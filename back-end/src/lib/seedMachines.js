import Machine from '../models/Machine.js';
import { MACHINE_CATALOG } from './machineCatalog.js';

export async function seedMachines() {
  const count = await Machine.countDocuments();
  if (count > 0) return count;

  const docs = MACHINE_CATALOG.map((item, index) => ({
    machineCode: `MCH-${String(index + 1).padStart(4, '0')}`,
    name: item.name,
    manufacturer: item.manufacturer,
    model: item.model,
    department: item.department,
    status: item.status,
    location: item.location,
    uptime: item.uptime,
    lastMaintenance: item.lastMaintenance ? new Date(item.lastMaintenance) : undefined,
    nextMaintenance: item.nextMaintenance ? new Date(item.nextMaintenance) : undefined,
    purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
    warrantyStatus: item.warrantyStatus,
    serialNumber: item.serialNumber,
    statusHistory: [{ status: item.status, changedBy: 'Bootstrap', note: 'Initial seed' }],
  }));

  await Machine.insertMany(docs);
  console.log(`Bootstrap: inserted ${docs.length} machines`);
  return docs.length;
}
