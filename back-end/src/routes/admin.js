import { Router } from 'express';
import Bed from '../models/Bed.js';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import Machine from '../models/Machine.js';
import QueueNode from '../models/QueueNode.js';
import {
  WARD_CATALOG,
  CLINICAL_WARD_KEYS,
  computeBedStats,
} from '../lib/wards.js';
import {
  computeDashboardStats,
  daysUntilExpiry,
} from '../lib/pharmacyHelpers.js';
import DispensingLog from '../models/DispensingLog.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { flattenPrescriptions } from '../lib/pharmacyHelpers.js';
import { authenticate, validatePermission } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';

const router = Router();

function flattenLabOrders(patients) {
  const queue = [];
  for (const p of patients) {
    if (!p.labOrders?.length) continue;
    p.labOrders.forEach((order) => {
      queue.push({
        status: order.status,
        isCritical: order.isCritical,
        priority: order.priority,
        patientName: p.patientName,
        tests: order.tests,
      });
    });
  }
  return queue;
}

router.get('/overview', authenticate, (req, res, next) => {
  if (req.user.permissions?.canViewAuditLogs || req.user.permissions?.canManageStaff) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied: requires Admin view permissions' });
}, async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const patientQuery = hospitalId ? { hospitalId } : {};

    const [beds, patients, medicines, machines, queueNodes, logs, suppliers, orders] =
      await Promise.all([
        Bed.find().lean(),
        Patient.find(patientQuery).sort({ updatedAt: -1 }).limit(500),
        Medicine.find().lean(),
        Machine.find().lean(),
        QueueNode.find({ date: new Date().toISOString().split('T')[0] }).lean(),
        DispensingLog.find().sort({ createdAt: -1 }).limit(100).lean(),
        Supplier.find().lean(),
        PurchaseOrder.find().lean(),
      ]);

    const wards = CLINICAL_WARD_KEYS.map((key) => {
      const wardBeds = beds.filter((b) => b.wardName?.toLowerCase() === key.toLowerCase());
      return {
        key,
        label: WARD_CATALOG.find((w) => w.key === key)?.label || key,
        ...computeBedStats(wardBeds),
      };
    });

    const opdByDept = {};
    queueNodes.forEach((q) => {
      const dept = q.department || 'Unknown';
      if (!opdByDept[dept]) opdByDept[dept] = { waiting: 0, inConsultation: 0 };
      if (q.status === 'WAITING' || q.status === 'Waiting') opdByDept[dept].waiting++;
      else if (q.status === 'IN_CONSULTATION' || q.status === 'IN CONSULTATION') opdByDept[dept].inConsultation++;
    });

    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const lowStock = medicines.filter((m) => m.stockQuantity > 0 && m.stockQuantity <= (m.minimumStock || 10));
    const outOfStock = medicines.filter((m) => (m.stockQuantity || 0) <= 0);
    const expiringSoon = medicines.filter((m) => {
      const d = daysUntilExpiry(m.expiryDate);
      return d >= 0 && d <= 30;
    });

    const rx = flattenPrescriptions(patients);
    const pharmacyStats = computeDashboardStats(medicines, rx, logs, suppliers, orders);

    const labOrders = flattenLabOrders(patients);
    const lab = {
      pending: labOrders.filter((o) => ['Pending', 'Accepted'].includes(o.status)).length,
      processing: labOrders.filter((o) => o.status === 'Processing').length,
      critical: labOrders.filter((o) => o.isCritical || o.priority === 'Emergency').length,
      completed: labOrders.filter((o) => ['Completed', 'Verified'].includes(o.status)).length,
    };

    const machineStats = {
      total: machines.length,
      operational: machines.filter((m) => m.status === 'operational').length,
      maintenance: machines.filter((m) => m.status === 'maintenance').length,
      offline: machines.filter((m) => m.status === 'offline').length,
      avgUptime:
        machines.length > 0
          ? Number((machines.reduce((s, m) => s + (m.uptime || 0), 0) / machines.length).toFixed(1))
          : 0,
    };

    const totals = computeBedStats(beds);

    res.json({
      generatedAt: new Date().toISOString(),
      patients: { total: patients.length },
      beds: totals,
      wards,
      opd: { byDepartment: opdByDept, totalWaiting: queueNodes.filter((q) => q.status === 'WAITING').length },
      pharmacy: {
        stats: pharmacyStats,
        lowStock: lowStock.slice(0, 10).map((m) => ({ name: m.name, stock: m.stockQuantity, min: m.minimumStock })),
        outOfStock: outOfStock.slice(0, 10).map((m) => ({ name: m.name })),
        expiringSoon: expiringSoon.slice(0, 10).map((m) => ({
          name: m.name,
          expiryDate: m.expiryDate,
          daysLeft: daysUntilExpiry(m.expiryDate),
        })),
      },
      lab,
      machines: machineStats,
    });
  } catch (err) {
    console.error('Admin overview:', err);
    res.status(500).json({ error: 'Overview failed', message: err.message });
  }
});

router.get('/audit-logs', authenticate, validatePermission('canViewAuditLogs'), async (req, res) => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(logDir).filter(f => f.startsWith('audit_') && f.endsWith('.log'));
    let allLogs = [];
    for (const file of files) {
      const filePath = path.join(logDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^\[(.*?)\] (.*?) \| (.*?) \| (.*?)$/);
        if (match) {
          allLogs.push({
            timestamp: match[1],
            actor: match[2],
            action: match[3],
            details: match[4],
            date: file.replace('audit_', '').replace('.log', '')
          });
        } else {
          allLogs.push({ raw: line });
        }
      }
    }
    allLogs.reverse();
    res.json(allLogs.slice(0, 500));
  } catch (err) {
    console.error('Failed to read audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
