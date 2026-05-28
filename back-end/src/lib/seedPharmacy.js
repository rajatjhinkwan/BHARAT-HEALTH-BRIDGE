import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import StockTransaction from '../models/StockTransaction.js';
import { MEDICINE_CATALOG, SUPPLIER_CATALOG } from './medicineCatalog.js';

export async function ensurePharmacySeed() {
  for (const m of MEDICINE_CATALOG) {
    await Medicine.findOneAndUpdate(
      { medicineId: m.medicineId },
      { $set: m },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`Pharmacy: synchronized ${MEDICINE_CATALOG.length} medicines in database`);

  for (const s of SUPPLIER_CATALOG) {
    await Supplier.findOneAndUpdate(
      { name: s.name },
      { $set: s },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`Pharmacy: synchronized ${SUPPLIER_CATALOG.length} suppliers in database`);

  // Seed realistic Stock Transactions for history logs
  const count = await StockTransaction.countDocuments();
  if (count === 0) {
    const meds = await Medicine.find();
    for (const med of meds) {
      await StockTransaction.create({
        medicineId: med._id,
        medicineName: med.name,
        type: 'added',
        quantity: med.stockQuantity,
        batchNumber: med.batchNumber,
        pharmacistName: 'System Seeder',
        notes: 'Initial pharmacy inventory bootstrap',
        createdAt: new Date(Date.now() - 86400000 * 10),
      });

      if (Math.random() > 0.4) {
        await StockTransaction.create({
          medicineId: med._id,
          medicineName: med.name,
          type: 'dispensed',
          quantity: -Math.floor(10 + Math.random() * 40),
          batchNumber: med.batchNumber,
          pharmacistName: 'Nurse Care',
          notes: 'Ward dispensing simulation',
          createdAt: new Date(Date.now() - Math.random() * 86400000 * 5),
        });
      }
    }
    console.log(`Pharmacy: successfully seeded initial StockTransaction simulations for ${meds.length} medicines`);
  }
}
