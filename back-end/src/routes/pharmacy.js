import { Router } from 'express';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';
import DispensingLog from '../models/DispensingLog.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import MedicalHistory from '../models/MedicalHistory.js';
import { authenticate } from '../middleware/auth.js';
import { escapeRegExp } from '../lib/regexHelpers.js';
import {
  enrichMedicine,
  flattenPrescriptions,
  findMedicineByName,
  computeDashboardStats,
  smartReorderSuggestions,
  daysUntilExpiry,
} from '../lib/pharmacyHelpers.js';
import { emitDispensingUpdate, emitStockAlert, emitPharmacyUpdate } from '../lib/realtime.js';
import { ensurePharmacySeed } from '../lib/seedPharmacy.js';
import { getWorkflowContext } from '../lib/permissions.js';
import { logAuditAction } from '../lib/auditLogger.js';

const router = Router();

const PHARMACY_ROLES = ['pharmacist', 'pharmacy_manager', 'inventory_manager', 'hospital_admin', 'super_admin', 'admin'];

function requirePharmacyAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const role = (req.user?.role || '').toLowerCase();
  const context = getWorkflowContext(req.user);
  if (!context.permissions?.canDispenseMeds && !PHARMACY_ROLES.includes(role)) {
    return res.status(403).json({ error: 'Pharmacy access required' });
  }
  next();
}

function canDeleteMedicine(role) {
  return ['hospital_admin', 'super_admin', 'admin', 'inventory_manager'].includes(role);
}

router.use(authenticate);
router.use(requirePharmacyAccess);

router.use(async (_req, _res, next) => {
  try {
    await ensurePharmacySeed();
  } catch {
    /* ignore */
  }
  next();
});

function emitAll(io, event, payload) {
  if (!io) return;
  io.emit(event, payload);
  io.emit('serviceUpdate', { type: 'pharmacy', ...payload });
  io.to('pharmacy').emit(event, payload);
}

// ——— Dashboard ———
router.get('/dashboard', async (_req, res) => {
  try {
    const [medicines, patients, logs, suppliers, orders] = await Promise.all([
      Medicine.find().sort({ name: 1 }),
      Patient.find().sort({ updatedAt: -1 }),
      DispensingLog.find().sort({ createdAt: -1 }).limit(200),
      Supplier.find(),
      PurchaseOrder.find().sort({ createdAt: -1 }),
    ]);
    const prescriptions = flattenPrescriptions(patients);
    const stats = computeDashboardStats(medicines, prescriptions, logs, suppliers, orders);
    const reorderSuggestions = smartReorderSuggestions(medicines);
    res.json({ stats, reorderSuggestions });
  } catch (err) {
    console.error('Pharmacy dashboard:', err);
    res.status(500).json({ error: 'Dashboard failed' });
  }
});

// ——— Medicines / Inventory ———
router.get('/medicines', async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 50 } = req.query;
    let query = {};
    if (search) {
      const re = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ name: re }, { genericName: re }, { brandName: re }, { barcode: re }, { batchNumber: re }, { medicineId: re }];
    }
    if (category) query.category = category;

    const meds = await Medicine.find(query).sort({ name: 1 });
    let enriched = meds.map(enrichMedicine);
    if (status) enriched = enriched.filter((m) => m.status === status);

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(10000, parseInt(limit, 10));
    const start = (p - 1) * l;
    const paginated = enriched.slice(start, start + l);

    res.json({
      items: paginated,
      total: enriched.length,
      page: p,
      limit: l,
      pages: Math.ceil(enriched.length / l),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

router.get('/medicines/barcode/:code', async (req, res) => {
  try {
    const med = await Medicine.findOne({
      $or: [{ barcode: req.params.code }, { medicineId: req.params.code }, { batchNumber: req.params.code }],
    });
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    res.json(enrichMedicine(med));
  } catch (err) {
    res.status(500).json({ error: 'Lookup failed' });
  }
});

router.post('/medicines', async (req, res) => {
  try {
    const count = await Medicine.countDocuments();
    const body = {
      ...req.body,
      medicineId: req.body.medicineId || `MED-${String(count + 1).padStart(3, '0')}`,
      lastUpdated: new Date(),
    };
    const med = await Medicine.create(body);
    await StockTransaction.create({
      medicineId: med._id,
      medicineName: med.name,
      type: 'added',
      quantity: med.stockQuantity,
      batchNumber: med.batchNumber,
      pharmacistId: req.user?.employeeId,
      pharmacistName: req.user?.name,
      notes: 'New medicine added to inventory',
    });
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Inventory Item Added', `Added medicine: ${med.name} (ID: ${med.medicineId}) - Qty: ${med.stockQuantity}`);
    const io = req.app.get('io');
    emitAll(io, 'pharmacyInventoryUpdated', { action: 'added', medicineId: med._id });
    res.status(201).json(enrichMedicine(med));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Create failed' });
  }
});

router.put('/medicines/:id', async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { returnDocument: 'after' }
    );
    if (!med) return res.status(404).json({ error: 'Not found' });
    await StockTransaction.create({
      medicineId: med._id,
      medicineName: med.name,
      type: 'updated',
      quantity: med.stockQuantity,
      pharmacistId: req.user?.employeeId,
      pharmacistName: req.user?.name,
    });
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Inventory Item Updated', `Updated medicine: ${med.name} (ID: ${med.medicineId}) - Qty: ${med.stockQuantity}`);
    const enriched = enrichMedicine(med);
    const io = req.app.get('io');
    emitAll(io, 'pharmacyInventoryUpdated', { action: 'updated', medicineId: med._id, status: enriched.status });
    if (enriched.status === 'low_stock' || enriched.status === 'out_of_stock') {
      emitStockAlert(io, { medicineId: med.medicineId, name: med.name, status: enriched.status });
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/medicines/:id', async (req, res) => {
  const role = (req.user?.role || '').toLowerCase();
  if (!canDeleteMedicine(role)) {
    return res.status(403).json({ error: 'Only admin or inventory manager can delete medicines' });
  }
  try {
    const med = await Medicine.findByIdAndDelete(req.params.id);
    if (!med) return res.status(404).json({ error: 'Not found' });
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Inventory Item Deleted', `Deleted medicine ID: ${req.params.id}`);
    const io = req.app.get('io');
    emitAll(io, 'pharmacyInventoryUpdated', { action: 'removed', medicineId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ——— Prescriptions / Dispense ———
router.get('/prescriptions/pending', async (_req, res) => {
  try {
    const patients = await Patient.find().sort({ updatedAt: -1 });
    const medicines = await Medicine.find();
    const queue = flattenPrescriptions(patients).map((rx) => ({
      ...rx,
      medications: rx.medications.map((m) => {
        const inv = findMedicineByName(medicines, m.name);
        const availability = !inv ? 'out_of_stock' : inv.stockQuantity <= 0 ? 'out_of_stock' : inv.stockQuantity < (inv.minimumStock || 10) ? 'low' : 'available';
        const days = inv?.expiryDate ? daysUntilExpiry(inv.expiryDate) : null;
        return {
          ...m,
          availability,
          alternative: availability === 'out_of_stock' ? inv?.genericName : null,
          expiryWarning: days != null && days <= 30 ? `Expires in ${days} days` : null,
          stockAvailable: inv?.stockQuantity ?? 0,
          medicineId: inv?._id,
        };
      }),
    }));
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

router.post('/dispense', async (req, res) => {
  try {
    const { patientId, rxIndex, items = [], paymentMethod = 'cash', partial = false } = req.body;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const rx = patient.prescriptions?.[rxIndex];
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });

    const medicines = await Medicine.find();
    let totalAmount = 0;
    const dispensedItems = [];

    for (const item of items) {
      const inv = item.medicineId
        ? await Medicine.findById(item.medicineId)
        : findMedicineByName(medicines, item.name);
      const qty = item.quantity || 1;
      if (inv && item.dispensed !== false) {
        inv.stockQuantity = Math.max(0, (inv.stockQuantity || 0) - qty);
        inv.lastUpdated = new Date();
        await inv.save();
        totalAmount += (inv.sellingPrice || 0) * qty;
        await StockTransaction.create({
          medicineId: inv._id,
          medicineName: inv.name,
          type: 'dispensed',
          quantity: -qty,
          batchNumber: inv.batchNumber,
          pharmacistId: req.user?.employeeId,
          pharmacistName: req.user?.name,
          patientId: patient._id.toString(),
          patientName: patient.patientName,
        });
        const enriched = enrichMedicine(inv);
        const io = req.app.get('io');
        if (enriched.status === 'low_stock' || enriched.status === 'out_of_stock') {
          emitStockAlert(io, { medicineId: inv.medicineId, name: inv.name, status: enriched.status });
        }
      }
      dispensedItems.push({
        medicineId: inv?._id,
        name: item.name || inv?.name,
        dosage: item.dosage,
        frequency: item.frequency,
        days: item.days,
        quantity: qty,
        dispensed: item.dispensed !== false,
        partial: !!item.partial,
        alternative: item.alternative,
        unitPrice: inv?.sellingPrice || 0,
      });
    }

    const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;

    // Push dispensing action directly to patient's clinical timeline history
    const dispensedText = dispensedItems
      .filter((i) => i.dispensed)
      .map((i) => `${i.name} (Qty: ${i.quantity})`)
      .join(', ');

    patient.timeline.push({
      action: 'MEDICINE_DISPENSED',
      department: 'Pharmacy',
      performedBy: req.user?.name || 'Pharmacist',
      timestamp: new Date(),
      details: `Dispensed: ${dispensedText || 'None'} (Invoice: ${invoiceId})`,
    });

    if (!partial) {
      patient.prescriptions[rxIndex].dispensed = true;
      patient.markModified('prescriptions');
    }
    await patient.save();

    const log = await DispensingLog.create({
      patientId: patient._id,
      patientName: patient.patientName,
      mrn: patient.mrn,
      prescriptionIndex: rxIndex,
      items: dispensedItems,
      pharmacistId: req.user?.employeeId,
      pharmacistName: req.user?.name,
      doctorName: rx.prescribedBy,
      department: patient.currentDepartment,
      totalAmount,
      paymentMethod,
      invoiceId,
      status: partial ? 'partial' : 'completed',
    });

    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Medicine Dispensed', `Dispensed medicines for ${patient.patientName} (Invoice: ${invoiceId}) - Total: ₹${totalAmount}`);

    await MedicalHistory.create({
      patientId: patient._id,
      type: 'dispensing',
      title: 'Medicine Dispensed',
      description: `Pharmacy dispensed ${dispensedItems.length} item(s) — ${invoiceId}`,
      performedBy: req.user?.name || 'Pharmacist',
      metadata: { invoiceId, items: dispensedItems.map((i) => i.name) },
    });

    const io = req.app.get('io');
    emitDispensingUpdate(io, patient._id, log);
    emitPharmacyUpdate(io, { type: 'dispensed', patientId, invoiceId });

    res.json({ ok: true, log, invoiceId, totalAmount });
  } catch (err) {
    console.error('Dispense error:', err);
    res.status(500).json({ error: 'Dispensing failed' });
  }
});

// ——— Alerts ———
router.get('/alerts', async (_req, res) => {
  try {
    const medicines = (await Medicine.find()).map(enrichMedicine);
    const orders = await PurchaseOrder.find({ status: { $in: ['sent', 'draft'] } });

    const alerts = [];
    medicines.forEach((m) => {
      if (m.status === 'low_stock') {
        alerts.push({ type: 'low_stock', severity: 'warning', message: `${m.name} stock below minimum threshold (${m.stockQuantity}/${m.minimumStock})`, medicineId: m.medicineId, name: m.name, createdAt: new Date() });
      }
      if (m.status === 'out_of_stock') {
        alerts.push({ type: 'out_of_stock', severity: 'critical', message: `${m.name} is out of stock`, medicineId: m.medicineId, name: m.name, createdAt: new Date() });
      }
      if (m.status === 'expiring_soon' || m.status === 'expired') {
        alerts.push({ type: m.status === 'expired' ? 'expired' : 'expiring', severity: m.status === 'expired' ? 'critical' : 'warning', message: `${m.name}: ${m.expiryLabel}`, medicineId: m.medicineId, name: m.name, daysToExpiry: m.daysToExpiry, createdAt: new Date() });
      }
    });

    orders.forEach((o) => {
      if (o.status === 'sent' && o.expectedDate && new Date(o.expectedDate) < new Date()) {
        alerts.push({ type: 'delayed_order', severity: 'warning', message: `Purchase order ${o.orderId} delayed from ${o.supplierName}`, orderId: o.orderId, createdAt: o.createdAt });
      }
    });

    res.json(alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1)));
  } catch (err) {
    res.status(500).json({ error: 'Alerts failed' });
  }
});

// ——— Expiry ———
router.get('/expiry', async (_req, res) => {
  try {
    const medicines = (await Medicine.find()).map(enrichMedicine);
    const buckets = { expired: [], days7: [], days15: [], days30: [], healthy: [] };
    medicines.forEach((m) => {
      const d = m.daysToExpiry;
      if (d == null) return buckets.healthy.push(m);
      if (d <= 0) buckets.expired.push(m);
      else if (d <= 7) buckets.days7.push(m);
      else if (d <= 15) buckets.days15.push(m);
      else if (d <= 30) buckets.days30.push(m);
      else buckets.healthy.push(m);
    });
    res.json(buckets);
  } catch (err) {
    res.status(500).json({ error: 'Expiry fetch failed' });
  }
});

// ——— Suppliers ———
router.get('/suppliers', async (_req, res) => {
  try {
    res.json(await Supplier.find().sort({ name: 1 }));
  } catch (err) {
    res.status(500).json({ error: 'Suppliers failed' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json(supplier);
  } catch (err) {
    res.status(500).json({ error: 'Create supplier failed' });
  }
});

// ——— Purchase Orders ———
router.get('/purchase-orders', async (_req, res) => {
  try {
    res.json(await PurchaseOrder.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: 'PO fetch failed' });
  }
});

router.post('/purchase-orders', async (req, res) => {
  try {
    const count = await PurchaseOrder.countDocuments();
    const order = await PurchaseOrder.create({
      ...req.body,
      orderId: req.body.orderId || `PO-${Date.now().toString(36).toUpperCase()}`,
      createdBy: req.user?.name,
      status: req.body.status || 'draft',
    });
    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Purchase Order Created', `Created PO ${order.orderId} for supplier ${order.supplierName}`);
    const io = req.app.get('io');
    emitAll(io, 'pharmacyOrderUpdated', { orderId: order.orderId, status: order.status });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'PO create failed' });
  }
});

router.patch('/purchase-orders/:id/receive', async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });

    for (const item of order.items || []) {
      if (!item.medicineId) continue;
      const med = await Medicine.findById(item.medicineId);
      if (med) {
        med.stockQuantity = (med.stockQuantity || 0) + (item.quantity || 0);
        med.lastUpdated = new Date();
        await med.save();
        await StockTransaction.create({
          medicineId: med._id,
          medicineName: med.name,
          type: 'purchase_received',
          quantity: item.quantity,
          pharmacistName: req.user?.name,
          referenceId: order.orderId,
        });
      }
    }

    order.status = 'received';
    order.receivedDate = new Date();
    await order.save();

    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Purchase Order Received', `Received stock for PO ${order.orderId} from supplier ${order.supplierName}`);

    const io = req.app.get('io');
    emitAll(io, 'pharmacyInventoryUpdated', { action: 'purchase_received', orderId: order.orderId });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Receive failed' });
  }
});

// ——— Stock history ———
router.get('/history', async (req, res) => {
  try {
    const { medicineId, limit = 100 } = req.query;
    const query = medicineId ? { medicineId } : {};
    const history = await StockTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, parseInt(limit, 10)))
      .populate('medicineId', 'name medicineId');
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'History failed' });
  }
});

// ——— Returns ———
router.post('/returns', async (req, res) => {
  try {
    const { medicineId, quantity, reason, patientId, patientName } = req.body;
    const med = await Medicine.findById(medicineId);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });

    med.stockQuantity = (med.stockQuantity || 0) + (quantity || 0);
    med.lastUpdated = new Date();
    await med.save();

    await StockTransaction.create({
      medicineId: med._id,
      medicineName: med.name,
      type: 'returned',
      quantity,
      pharmacistName: req.user?.name,
      patientId,
      patientName,
      notes: reason,
    });

    logAuditAction(`User: ${req.user.name} (${req.user.role})`, 'Medicine Returned', `Returned ${quantity} of ${med.name} for patient ${patientName || 'N/A'}`);

    const io = req.app.get('io');
    emitAll(io, 'pharmacyInventoryUpdated', { action: 'returned', medicineId: med._id });
    res.json(enrichMedicine(med));
  } catch (err) {
    res.status(500).json({ error: 'Return failed' });
  }
});

// ——— Analytics ———
router.get('/reports', async (_req, res) => {
  try {
    const [medicines, logs] = await Promise.all([
      Medicine.find(),
      DispensingLog.find().sort({ createdAt: -1 }).limit(500),
    ]);

    const usage = {};
    logs.forEach((l) => {
      (l.items || []).forEach((i) => {
        if (i.name) usage[i.name] = (usage[i.name] || 0) + (i.quantity || 1);
      });
    });

    const mostUsed = Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const monthlySales = {};
    logs.forEach((l) => {
      const m = new Date(l.createdAt).toLocaleString('en', { month: 'short' });
      monthlySales[m] = (monthlySales[m] || 0) + (l.totalAmount || 0);
    });

    const revenueChart = Object.entries(monthlySales).map(([month, revenue]) => ({ month, revenue }));
    const expiring = medicines
      .map(enrichMedicine)
      .filter((m) => m.status === 'expiring_soon' || m.status === 'expired')
      .length;

    res.json({
      mostUsed,
      revenueChart: revenueChart.length ? revenueChart : [
        { month: 'Jan', revenue: 42000 },
        { month: 'Feb', revenue: 38000 },
        { month: 'Mar', revenue: 51000 },
        { month: 'Apr', revenue: 47000 },
        { month: 'May', revenue: 55000 },
      ],
      expiringCount: expiring,
      totalRevenue: logs.reduce((s, l) => s + (l.totalAmount || 0), 0),
      movementByType: await StockTransaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    });
  } catch (err) {
    res.status(500).json({ error: 'Reports failed' });
  }
});

// ——— Search ———
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const re = new RegExp(escapeRegExp(q), 'i');
    const meds = await Medicine.find({
      $or: [{ name: re }, { genericName: re }, { brandName: re }, { barcode: re }, { batchNumber: re }, { supplierName: re }],
    }).limit(20);
    res.json(meds.map(enrichMedicine));
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
