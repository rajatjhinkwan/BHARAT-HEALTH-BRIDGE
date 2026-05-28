import { Router } from 'express';
import Patient from '../models/Patient.js';
import {
  LAB_TEST_TEMPLATES,
  resolveTestTemplates,
  evaluateField,
  buildInterpretationSummary,
} from '../lib/labTestTemplates.js';
import { authenticate, validatePermission } from '../middleware/auth.js';
import { logAuditAction } from '../lib/auditLogger.js';

const router = Router();

function flattenOrders(patients) {
  const queue = [];
  for (const p of patients) {
    if (!p.labOrders?.length) continue;
    p.labOrders.forEach((order, orderIndex) => {
      const templates = resolveTestTemplates(order.tests || []);
      queue.push({
        orderIndex,
        patientId: p._id.toString(),
        patientName: p.patientName,
        mrn: p.mrn,
        age: p.age,
        gender: p.gender,
        department: p.currentDepartment || 'OPD',
        assignedDoctor: p.assignedDoctor || order.orderedBy || '—',
        ...order.toObject?.() ?? order,
        tests: order.tests || [],
        templates: templates.map((t) => t.id),
        estimatedTurnaround: templates.reduce((m, t) => Math.max(m, t.turnaroundMinutes || 60), 30),
        sampleType: order.sampleType || templates[0]?.sampleType || 'Blood',
      });
    });
  }
  return queue;
}

router.get('/templates', authenticate, (_req, res) => {
  res.json(LAB_TEST_TEMPLATES);
});

router.get('/orders', authenticate, validatePermission('canUploadLabReports'), async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ updatedAt: -1 });
    res.json(flattenOrders(patients));
  } catch (err) {
    console.error('Lab orders fetch:', err);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
});

router.get('/analytics', authenticate, validatePermission('canUploadLabReports'), async (_req, res) => {
  try {
    const patients = await Patient.find();
    const orders = flattenOrders(patients);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = orders.filter(
      (o) => ['Completed', 'Verified'].includes(o.status) && new Date(o.completedAt || o.orderDate) >= today
    ).length;

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const testFreq = {};
    orders.forEach((o) => {
      (o.tests || []).forEach((t) => {
        testFreq[t] = (testFreq[t] || 0) + 1;
      });
    });

    const commonTests = Object.entries(testFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const criticalCount = orders.filter((o) => o.isCritical || o.priority === 'Emergency').length;

    res.json({
      totalPending: (statusCounts.Pending || 0) + (statusCounts.Accepted || 0),
      processing: statusCounts.Processing || 0,
      completedToday,
      criticalCount,
      avgTurnaroundMinutes: 52,
      statusCounts,
      commonTests,
      volumeByDay: [
        { day: 'Mon', count: 42 },
        { day: 'Tue', count: 38 },
        { day: 'Wed', count: 55 },
        { day: 'Thu', count: 48 },
        { day: 'Fri', count: 61 },
        { day: 'Sat', count: 28 },
        { day: 'Sun', count: 19 },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics failed' });
  }
});

router.get('/alerts', authenticate, validatePermission('canUploadLabReports'), async (_req, res) => {
  try {
    const patients = await Patient.find({ 'labOrders.isCritical': true });
    const alerts = [];
    patients.forEach((p) => {
      p.labOrders.forEach((order, idx) => {
        if (order.isCritical || order.criticalAlerts?.length) {
          alerts.push({
            patientId: p._id,
            orderIndex: idx,
            patientName: p.patientName,
            mrn: p.mrn,
            orderId: order.orderId,
            alerts: order.criticalAlerts || [],
            status: order.status,
            createdAt: order.orderDate,
          });
        }
      });
    });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Alerts fetch failed' });
  }
});

router.patch('/orders/:patientId/:orderIndex', authenticate, validatePermission('canUploadLabReports'), async (req, res) => {
  try {
    const { patientId, orderIndex } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const idx = Number(orderIndex);
    if (!patient.labOrders[idx]) return res.status(404).json({ message: 'Order not found' });

    Object.assign(patient.labOrders[idx], req.body);
    if (req.body.status === 'Completed' || req.body.status === 'Verified') {
      patient.labOrders[idx].completedAt = new Date();
      if (patient.currentStatus === 'LAB PENDING') patient.currentStatus = 'IN CONSULTATION';
    }

    patient.timeline.push({
      action: `LAB ${req.body.status || 'UPDATED'}`,
      department: 'Laboratory',
      performedBy: req.body.performedBy || 'Lab Technician',
      details: req.body.timelineNote || `Lab order ${patient.labOrders[idx].orderId} updated`,
      timestamp: new Date(),
    });

    await patient.save();
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Lab Order Update', `Updated lab order status for patient ${patient.patientName} (Order ID: ${patient.labOrders[idx].orderId}) to ${req.body.status || 'Updated'}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('serviceUpdate', { type: 'lab', patientId });
      io.emit('labOrderUpdated', { patientId, orderIndex: idx });
      if (req.body.isCritical) io.emit('labCriticalAlert', { patientId, orderIndex: idx });
    }
    res.json(patient.labOrders[idx]);
  } catch (err) {
    console.error('Lab patch:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/orders/:patientId/:orderIndex/results', authenticate, validatePermission('canUploadLabReports'), async (req, res) => {
  try {
    const { patientId, orderIndex } = req.params;
    const { metrics, performedBy } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const idx = Number(orderIndex);
    const order = patient.labOrders[idx];
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const templates = resolveTestTemplates(order.tests || []);
    const criticalAlerts = [];
    const evaluated = {};

    for (const tpl of templates) {
      evaluated[tpl.id] = {};
      for (const field of tpl.fields) {
        const val = metrics?.[tpl.id]?.[field.key];
        const ev = evaluateField(field, val);
        evaluated[tpl.id][field.key] = { value: val, ...ev };
        if (ev.status === 'critical') {
          criticalAlerts.push({ test: tpl.name, field: field.label, message: ev.interpretation });
        }
      }
    }

    const { remarks, isCritical } = buildInterpretationSummary(
      Object.fromEntries(
        templates.map((t) => [t.id, metrics?.[t.id] || {}])
      )
    );

    order.metrics = metrics;
    order.evaluatedResults = evaluated;
    order.interpretation = remarks;
    order.criticalAlerts = criticalAlerts;
    order.isCritical = isCritical || criticalAlerts.length > 0;
    order.status = order.isCritical ? 'Critical' : 'Completed';
    order.completedAt = new Date();
    order.results = JSON.stringify({ metrics, remarks, evaluated });
    order.verifiedBy = performedBy || 'Lab Technician';
    order.reportGeneratedAt = new Date();

    patient.timeline.push({
      action: order.isCritical ? 'CRITICAL LAB RESULT' : 'LAB RESULT READY',
      department: 'Laboratory',
      performedBy: performedBy || 'Lab Technician',
      details: remarks.join(' '),
      timestamp: new Date(),
    });

    // Auto-Mirror test results directly to MedicalHistory Health Vault for mobile app visibility
    try {
      const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
      
      let summaryText = `Test Completed: ${order.tests?.join(', ') || 'Diagnostics'}\n\n`;
      if (evaluated) {
        summaryText += "RESULTS METRICS:\n";
        for (const [testId, fields] of Object.entries(evaluated)) {
          summaryText += `• ${testId.toUpperCase()}:\n`;
          for (const [key, f] of Object.entries(fields)) {
            const statusStr = f.status && f.status !== 'normal' ? ` [${f.status.toUpperCase()}]` : '';
            summaryText += `  - ${key}: ${f.value} ${f.unit || ''}${statusStr}\n`;
          }
        }
      }
      if (remarks && remarks.length) {
        summaryText += `\nCLINICAL INTERPRETATION:\n${remarks.join('\n')}`;
      }

      // Proactively search for a pending lab request to update it, otherwise create a new completed one
      const existingRequest = await MedicalHistory.findOne({
        patientId,
        type: 'lab_report',
        title: { $regex: /Lab Request:/i }
      }).sort({ createdAt: -1 });

      if (existingRequest) {
        existingRequest.title = `Lab Report: ${order.tests?.join(', ') || 'Diagnostics'}`;
        existingRequest.ocrText = summaryText;
        existingRequest.doctor = order.verifiedBy || performedBy || 'Lab Technician';
        await existingRequest.save();
        console.log(`Laboratory: updated existing medical history for patient ${patientId}`);
      } else {
        await MedicalHistory.create({
          patientId,
          type: 'lab_report',
          title: `Lab Report: ${order.tests?.join(', ') || 'Diagnostics'}`,
          doctor: order.verifiedBy || performedBy || 'Lab Technician',
          hospital: patient.currentDepartment ? `${patient.currentDepartment} Ward` : 'Bharat Health Bridge',
          ocrText: summaryText
        });
        console.log(`Laboratory: created new medical history record for patient ${patientId}`);
      }
    } catch (mirrorErr) {
      console.error('Failed to mirror lab results to MedicalHistory:', mirrorErr);
    }

    await patient.save();
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Lab Result Uploaded', `Uploaded lab test results for ${patient.patientName} (Tests: ${order.tests?.join(', ') || 'Diagnostics'}) - Status: ${order.status}`);

    const io = req.app.get('io');
    if (io) {
      io.emit('serviceUpdate', { type: 'lab', patientId });
      io.emit('labReportReady', { patientId, orderIndex: idx, isCritical: order.isCritical });
      
      // Auto-trigger a realtime prescription/report update on patient app
      const { emitPrescriptionUpdate } = await import('../lib/realtime.js');
      const latestHistory = await (await import('../models/MedicalHistory.js')).default.findOne({ patientId }).sort({ updatedAt: -1 });
      if (latestHistory) {
        emitPrescriptionUpdate(io, patientId, latestHistory);
      }

      if (order.isCritical) io.emit('labCriticalAlert', { patientId, orderIndex: idx });
    }

    res.json({ order: patient.labOrders[idx], remarks, criticalAlerts });
  } catch (err) {
    console.error('Lab results:', err);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

export default router;
