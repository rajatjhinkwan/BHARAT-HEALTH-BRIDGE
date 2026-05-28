import { Router } from 'express';
import Patient from '../models/Patient.js';
import QueueNode from '../models/QueueNode.js';
import Machine from '../models/Machine.js';
import {
  IMAGING_MODALITIES,
  IMAGING_REPORT_FIELDS,
  resolveModality,
  medicalHistoryTypeForModality,
  pendingStatusForModality,
} from '../lib/imagingTemplates.js';
import { authenticate, validatePermission } from '../middleware/auth.js';
import { logAuditAction } from '../lib/auditLogger.js';
import { todayDateString } from '../lib/queueHelpers.js';
import { tokenPrefixForDepartment } from '../lib/departments.js';

const router = Router();

function flattenOrders(patients) {
  const queue = [];
  for (const p of patients) {
    if (!p.radiologyOrders?.length) continue;
    p.radiologyOrders.forEach((order, orderIndex) => {
      const modality = resolveModality(order.type);
      queue.push({
        orderIndex,
        patientId: p._id.toString(),
        patientName: p.patientName,
        mrn: p.mrn,
        age: p.age,
        gender: p.gender,
        department: order.referringDepartment || p.currentDepartment || 'OPD',
        assignedDoctor: p.assignedDoctor || order.orderedBy || '—',
        ...(order.toObject?.() ?? order),
        estimatedTurnaround: order.estimatedTurnaround || modality.turnaroundMinutes || 60,
        modalityName: modality.name,
      });
    });
  }
  return queue;
}

async function mirrorRadiologyToMedicalHistory(patient, order, summaryText) {
  const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
  const reportType = medicalHistoryTypeForModality(order.type);
  const titlePattern = new RegExp(`Radiology Request:.*${order.type}`, 'i');

  const existingRequest = await MedicalHistory.findOne({
    patientId: patient._id,
    type: reportType,
    title: titlePattern,
  }).sort({ createdAt: -1 });

  const title = ['Completed', 'Verified', 'Critical'].includes(order.status)
    ? `Radiology Report: ${order.type} — ${order.bodyPart || 'Study'}`
    : `Radiology Request: ${order.type} of ${order.bodyPart || 'Study'}`;

  if (existingRequest) {
    existingRequest.title = title;
    existingRequest.ocrText = summaryText;
    existingRequest.doctor = order.verifiedBy || order.assignedRadiologist || order.orderedBy || 'Radiology';
    await existingRequest.save();
  } else {
    await MedicalHistory.create({
      patientId: patient._id,
      type: reportType,
      title,
      doctor: order.verifiedBy || order.assignedRadiologist || order.orderedBy || 'Radiology',
      hospital: patient.currentDepartment ? `${patient.currentDepartment} Ward` : 'Bharat Health Bridge',
      ocrText: summaryText,
    });
  }
}

function buildFindingsSummary(order) {
  if (order.findings && typeof order.findings === 'object') {
    return Object.entries(order.findings)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
  return order.results || '';
}

router.get('/templates', authenticate, (_req, res) => {
  res.json({ modalities: IMAGING_MODALITIES, reportFields: IMAGING_REPORT_FIELDS });
});

router.get('/machines', authenticate, validatePermission('canUploadRadiologyReports'), async (_req, res) => {
  try {
    const machines = await Machine.find({ department: 'radiology', status: { $ne: 'offline' } }).sort({ name: 1 });
    res.json(machines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch imaging machines' });
  }
});

router.get('/queue', authenticate, validatePermission('canUploadRadiologyReports'), async (_req, res) => {
  try {
    const today = todayDateString();
    const nodes = await QueueNode.find({ department: 'Radiology', date: today }).sort({ createdAt: 1 });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch radiology queue' });
  }
});

router.get('/orders', authenticate, validatePermission('canUploadRadiologyReports'), async (_req, res) => {
  try {
    const patients = await Patient.find({ 'radiologyOrders.0': { $exists: true } }).sort({ updatedAt: -1 });
    res.json(flattenOrders(patients));
  } catch (err) {
    console.error('Radiology orders fetch:', err);
    res.status(500).json({ error: 'Failed to fetch radiology orders' });
  }
});

router.get('/analytics', authenticate, validatePermission('canUploadRadiologyReports'), async (_req, res) => {
  try {
    const patients = await Patient.find({ 'radiologyOrders.0': { $exists: true } });
    const orders = flattenOrders(patients);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedToday = orders.filter(
      (o) => ['Completed', 'Verified'].includes(o.status) && new Date(o.scanCompletedAt || o.orderDate) >= today
    ).length;

    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const modalityFreq = {};
    orders.forEach((o) => {
      modalityFreq[o.type] = (modalityFreq[o.type] || 0) + 1;
    });

    const commonModalities = Object.entries(modalityFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const criticalCount = orders.filter((o) => o.isCritical || o.priority === 'Emergency').length;

    res.json({
      totalPending: (statusCounts.Pending || 0) + (statusCounts.Accepted || 0),
      inProgress: (statusCounts['In Progress'] || 0) + (statusCounts.Scheduled || 0),
      awaitingReport: statusCounts['Awaiting Report'] || 0,
      completedToday,
      criticalCount,
      avgTurnaroundMinutes: 75,
      statusCounts,
      commonModalities,
      volumeByDay: [
        { day: 'Mon', count: 28 },
        { day: 'Tue', count: 32 },
        { day: 'Wed', count: 41 },
        { day: 'Thu', count: 36 },
        { day: 'Fri', count: 45 },
        { day: 'Sat', count: 18 },
        { day: 'Sun', count: 12 },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics failed' });
  }
});

router.get('/alerts', authenticate, validatePermission('canUploadRadiologyReports'), async (_req, res) => {
  try {
    const patients = await Patient.find({ 'radiologyOrders.isCritical': true });
    const alerts = [];
    patients.forEach((p) => {
      p.radiologyOrders.forEach((order, idx) => {
        if (order.isCritical || order.criticalFinding) {
          alerts.push({
            patientId: p._id,
            orderIndex: idx,
            patientName: p.patientName,
            mrn: p.mrn,
            orderId: order.orderId,
            type: order.type,
            bodyPart: order.bodyPart,
            criticalFinding: order.criticalFinding,
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

router.patch('/orders/:patientId/:orderIndex', authenticate, validatePermission('canUploadRadiologyReports'), async (req, res) => {
  try {
    const { patientId, orderIndex } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const idx = Number(orderIndex);
    const order = patient.radiologyOrders[idx];
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    Object.assign(order, req.body);

    if (req.body.status === 'In Progress' && !order.scanStartedAt) {
      order.scanStartedAt = new Date();
    }
    if (req.body.status === 'Awaiting Report' && !order.scanCompletedAt) {
      order.scanCompletedAt = new Date();
    }
    if (['Completed', 'Verified', 'Critical'].includes(req.body.status)) {
      order.reportGeneratedAt = new Date();
      if (patient.currentStatus === pendingStatusForModality(order.type)) {
        patient.currentStatus = 'IN CONSULTATION';
      }
      if (order.queueId) {
        const node = await QueueNode.findOne({ queueId: order.queueId });
        if (node && node.status !== 'COMPLETED') {
          node.status = 'COMPLETED';
          node.consultationEndTime = new Date();
          await node.save();
        }
      }
    }

    patient.timeline.push({
      action: `RADIOLOGY ${req.body.status || 'UPDATED'}`,
      department: 'Radiology',
      performedBy: req.body.performedBy || req.user?.name || 'Radiology Staff',
      details: req.body.timelineNote || `Imaging order ${order.orderId} → ${req.body.status || 'updated'}`,
      timestamp: new Date(),
    });

    await patient.save();
    logAuditAction(
      `User: ${req.user.name} (${req.user.role})`,
      'Radiology Order Update',
      `Updated imaging order for ${patient.patientName} (${order.orderId}) from ${prevStatus} to ${order.status}`
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('serviceUpdate', { type: 'radiology', patientId });
      io.emit('radiologyOrderUpdated', { patientId, orderIndex: idx });
      io.emit('queueUpdated', { department: 'Radiology' });
      if (order.isCritical) io.emit('radiologyCriticalAlert', { patientId, orderIndex: idx });
    }

    res.json(order);
  } catch (err) {
    console.error('Radiology patch:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.post('/orders/:patientId/:orderIndex/results', authenticate, validatePermission('canUploadRadiologyReports'), async (req, res) => {
  try {
    const { patientId, orderIndex } = req.params;
    const { findings, performedBy, isCritical, criticalFinding } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const idx = Number(orderIndex);
    const order = patient.radiologyOrders[idx];
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.findings = findings || {};
    order.results = buildFindingsSummary(order);
    order.isCritical = Boolean(isCritical);
    order.criticalFinding = criticalFinding || '';
    order.status = order.isCritical ? 'Critical' : 'Completed';
    order.verifiedBy = performedBy || req.user?.name || 'Radiologist';
    order.assignedRadiologist = order.verifiedBy;
    order.reportGeneratedAt = new Date();
    if (!order.scanCompletedAt) order.scanCompletedAt = new Date();

    if (patient.currentStatus === pendingStatusForModality(order.type)) {
      patient.currentStatus = 'IN CONSULTATION';
    }

    const summaryText = [
      `Modality: ${order.type}`,
      `Body Part: ${order.bodyPart || '—'}`,
      order.clinicalQuestion ? `Clinical Question: ${order.clinicalQuestion}` : '',
      '',
      'FINDINGS:',
      buildFindingsSummary(order),
      order.isCritical ? `\n⚠ CRITICAL: ${order.criticalFinding}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    patient.timeline.push({
      action: order.isCritical ? 'CRITICAL RADIOLOGY RESULT' : 'RADIOLOGY RESULT READY',
      department: 'Radiology',
      performedBy: order.verifiedBy,
      details: summaryText.slice(0, 500),
      timestamp: new Date(),
    });

    await mirrorRadiologyToMedicalHistory(patient, order, summaryText);

    if (order.queueId) {
      const node = await QueueNode.findOne({ queueId: order.queueId });
      if (node) {
        node.status = 'COMPLETED';
        node.consultationEndTime = new Date();
        await node.save();
      }
    }

    await patient.save();
    logAuditAction(
      `User: ${req.user.name} (${req.user.role})`,
      'Radiology Report Finalized',
      `Finalized ${order.type} report for ${patient.patientName} (${order.orderId})`
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('serviceUpdate', { type: 'radiology', patientId });
      io.emit('radiologyReportReady', { patientId, orderIndex: idx, isCritical: order.isCritical });
      io.emit('queueUpdated', { department: 'Radiology' });

      const { emitPrescriptionUpdate } = await import('../lib/realtime.js');
      const { default: MedicalHistory } = await import('../models/MedicalHistory.js');
      const latestHistory = await MedicalHistory.findOne({ patientId }).sort({ updatedAt: -1 });
      if (latestHistory) emitPrescriptionUpdate(io, patientId, latestHistory);
      if (order.isCritical) io.emit('radiologyCriticalAlert', { patientId, orderIndex: idx });
    }

    res.json({ order, summary: summaryText });
  } catch (err) {
    console.error('Radiology results:', err);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

export default router;
