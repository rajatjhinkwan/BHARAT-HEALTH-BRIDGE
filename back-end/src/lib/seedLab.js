import Patient from '../models/Patient.js';

const LAB_ORDERS = [
  { patientName: 'Anil Kumar', mrn: 'UHID-2026-1042', tests: ['CBC', 'LFT'], status: 'Pending', priority: 'Normal' },
  { patientName: 'Priya Nair', mrn: 'UHID-2026-1088', tests: ['KFT', 'Lipid Profile'], status: 'Processing', priority: 'Urgent' },
  { patientName: 'Rohan Sharma', mrn: 'UHID-2026-1101', tests: ['HbA1c'], status: 'Pending', priority: 'Normal' },
  { patientName: 'Meera Reddy', mrn: 'UHID-2026-1120', tests: ['Thyroid Panel'], status: 'Accepted', priority: 'Normal', isCritical: true },
  { patientName: 'Vikram Singh', mrn: 'UHID-2026-1135', tests: ['CBC', 'CRP'], status: 'Pending', priority: 'Emergency', isCritical: true },
  { patientName: 'Kavita Devi', mrn: 'UHID-2026-1142', tests: ['Urine Routine'], status: 'Completed', priority: 'Normal' },
  { patientName: 'Arjun Mehta', mrn: 'UHID-2026-1150', tests: ['LFT', 'KFT'], status: 'Pending', priority: 'Urgent' },
  { patientName: 'Sanya Malhotra', mrn: 'UHID-2026-1168', tests: ['Lipid Profile'], status: 'Processing', priority: 'Normal' },
];

export async function ensureLabSeed() {
  let withOrders = 0;
  for (const o of LAB_ORDERS) {
    let patient = await Patient.findOne({ mrn: o.mrn });
    if (!patient) {
      patient = await Patient.create({
        patientName: o.patientName,
        mrn: o.mrn,
        dob: '1990-01-01',
        age: 40,
        gender: 'Female',
        phone: '9876543210',
        address: 'Haridwar, Uttarakhand',
        aadharCardId: `9876-5432-${Math.floor(1000 + Math.random() * 9000)}`,
        currentDepartment: 'General Medicine',
        assignedDoctor: 'Dr. R. Sharma',
      });
    }
    const hasOrder = patient.labOrders?.some((lo) => lo.tests?.join() === o.tests.join());
    if (!hasOrder) {
      patient.labOrders = patient.labOrders || [];
      patient.labOrders.push({
        orderId: `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        tests: o.tests,
        status: o.status,
        priority: o.priority,
        isCritical: o.isCritical || false,
        orderedBy: 'Dr. R. Sharma',
        orderDate: new Date(),
        sampleType: 'Blood',
      });
      await patient.save();
      withOrders++;
    }
  }
  if (withOrders > 0) {
    console.log(`Bootstrap: seeded ${withOrders} lab orders`);
  }
}
