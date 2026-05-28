import { getStockStatus } from '../models/Medicine.js';

export function daysUntilExpiry(expiryDate) {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate) - new Date()) / 86400000);
}

export function enrichMedicine(med) {
  const obj = med.toObject?.() ?? med;
  const status = getStockStatus(obj);
  const daysToExpiry = daysUntilExpiry(obj.expiryDate);
  return {
    ...obj,
    id: obj._id?.toString?.() ?? obj.id,
    status,
    daysToExpiry,
    expiryLabel:
      daysToExpiry == null
        ? '—'
        : daysToExpiry <= 0
          ? 'Expired'
          : `Expires in ${daysToExpiry} days`,
  };
}

export function flattenPrescriptions(patients) {
  const queue = [];
  for (const p of patients) {
    if (!p.prescriptions?.length) continue;
    p.prescriptions.forEach((rx, rxIndex) => {
      if (rx.dispensed) return;
      const meds = rx.medications || [];
      queue.push({
        rxIndex,
        patientId: p._id.toString(),
        patientName: p.patientName,
        mrn: p.mrn,
        uhid: p.mrn,
        age: p.age,
        gender: p.gender,
        department: p.currentDepartment || 'OPD',
        doctorName: rx.prescribedBy || p.assignedDoctor || '—',
        prescriptionDate: rx.date,
        medications: meds.map((m) => ({
          name: m.name,
          dosage: m.dosage || '—',
          frequency: m.frequency || 'As directed',
          days: m.duration || m.days || '—',
          quantity: m.quantity || 1,
          notes: m.notes || '',
        })),
        voiceNoteUrl: rx.voiceNoteUrl,
      });
    });
  }
  return queue.sort((a, b) => new Date(b.prescriptionDate) - new Date(a.prescriptionDate));
}

export function findMedicineByName(medicines, name) {
  if (!name) return null;
  const q = name.toLowerCase().trim();
  return (
    medicines.find(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.brandName?.toLowerCase().includes(q)
    ) || null
  );
}

export function computeDashboardStats(medicines, prescriptions, dispensingLogs, suppliers, purchaseOrders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enriched = medicines.map(enrichMedicine);
  const lowStock = enriched.filter((m) => m.status === 'low_stock').length;
  const outOfStock = enriched.filter((m) => m.status === 'out_of_stock').length;
  const expiringSoon = enriched.filter((m) => m.status === 'expiring_soon' || m.status === 'expired').length;
  const availableStock = enriched.reduce((s, m) => s + (m.stockQuantity || 0), 0);

  const todaySales = dispensingLogs
    .filter((d) => new Date(d.createdAt) >= today)
    .reduce((s, d) => s + (d.totalAmount || 0), 0);

  const todayDispensed = dispensingLogs.filter((d) => new Date(d.createdAt) >= today).length;
  const pendingOrders = purchaseOrders.filter((o) => ['draft', 'sent'].includes(o.status)).length;

  return {
    totalMedicines: medicines.length,
    availableStock,
    lowStock,
    outOfStock,
    expiringSoon,
    totalSuppliers: suppliers.length,
    todayPrescriptions: prescriptions.length,
    todaySales,
    todayDispensed,
    pendingOrders,
  };
}

export function smartReorderSuggestions(medicines) {
  return medicines
    .filter((m) => {
      const s = getStockStatus(m);
      return s === 'low_stock' || s === 'out_of_stock';
    })
    .slice(0, 5)
    .map((m) => ({
      medicineId: m.medicineId,
      name: m.name,
      currentStock: m.stockQuantity,
      minimumStock: m.minimumStock,
      suggestedQty: Math.max((m.minimumStock || 10) * 3 - (m.stockQuantity || 0), 50),
      message: `Based on usage patterns, reorder ${m.name} within ${m.stockQuantity <= 0 ? '1' : '3'} days.`,
    }));
}
