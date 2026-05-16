import { Router } from 'express';
import { EmergencyCase } from '../models/index.js';

const router = Router();

// Auto-assignment mapping
const doctorMapping = {
    'Cardiac': 'Dr. Aryan (Cardio)', // Using existing or similar
    'ENT': 'Dr. Sara (ENT)',
    'Trauma': 'Dr. Vikram (Surgeon)',
    'Neurology': 'Dr. Lenna (Neuro)',
    'Orthopedic': 'Dr. Raj (Ortho)',
    'General Emergency': 'ER Resident'
};

// Create New Emergency Case
router.post('/', async (req, res) => {
    try {
        const count = await EmergencyCase.countDocuments();
        const year = new Date().getFullYear();
        const caseId = `ER-${year}-${(count + 1).toString().padStart(4, '0')}`;

        const { emergencyType } = req.body;
        const assignedDoctor = doctorMapping[emergencyType] || 'General Physician';

        const newCase = new EmergencyCase({
            ...req.body,
            caseId,
            assignedDoctor,
            currentStatus: 'WAITING'
        });

        await newCase.save();
        req.app.get('io').emit('emergencyUpdated');
        res.status(201).json(newCase);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get All Emergency Cases
router.get('/', async (req, res) => {
    try {
        const cases = await EmergencyCase.find().sort({ createdAt: -1 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Case Status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const erCase = await EmergencyCase.findById(req.params.id);
        if (!erCase) return res.status(404).json({ message: 'Case not found' });

        erCase.currentStatus = status;
        await erCase.save();

        // If status is ADMITTED, IN ICU, or ON VENTILATOR, create a Patient record and assign a bed
        if (['ADMITTED', 'IN ICU', 'ON VENTILATOR'].includes(status)) {
            const { Patient } = await import('../models/index.js');
            const Bed = (await import('../models/Bed.js')).default;

            let patient = await Patient.findOne({ patientName: erCase.patientName, phone: erCase.phone });
            
            if (!patient) {
                const randomUHID = Math.floor(100000 + Math.random() * 900000);
                patient = new Patient({
                    patientName: erCase.patientName,
                    mrn: `UHID-ER-${randomUHID}`,
                    age: erCase.age,
                    gender: erCase.gender === 'Male' ? 'Male' : (erCase.gender === 'Female' ? 'Female' : 'Other'),
                    phone: erCase.phone || '0000000000',
                    address: 'Emergency Admission',
                    aadharCardId: 'ER-' + Date.now(),
                    dob: 'Unknown',
                    currentDepartment: 'EMERGENCY',
                    currentStatus: status,
                    assignedDoctor: erCase.assignedDoctor,
                    priority: erCase.priority === 'Critical' ? 'CRITICAL' : 'HIGH',
                    vitals: [{
                        bp: erCase.vitals?.bp,
                        heartRate: erCase.vitals?.hr,
                        temp: erCase.vitals?.temp,
                        spo2: erCase.vitals?.spO2,
                        recordedBy: 'ER Nurse'
                    }],
                    timeline: [{
                        action: 'EMERGENCY ADMISSION',
                        department: 'Emergency',
                        performedBy: erCase.assignedDoctor,
                        details: `Emergency case ${erCase.caseId} transitioned to admission.`
                    }]
                });
            }

            // Find a bed in the target ward
            const targetWard = status === 'IN ICU' ? 'ICU' : 
                               status === 'ON VENTILATOR' ? 'Ventilator Ward' : 'General Ward';
            
            const bed = await Bed.findOne({ wardName: { $regex: new RegExp(`^${targetWard}$`, 'i') }, occupied: false });
            if (bed) {
                bed.occupied = true;
                bed.patientId = patient._id;
                bed.status = 'OCCUPIED';
                await bed.save();

                patient.currentWard = bed.wardName;
                patient.currentRoom = bed.roomNumber;
                patient.currentBed = bed.bedId;
                patient.currentStatus = status;
            }

            await patient.save();
        }

        req.app.get('io').emit('emergencyUpdated');
        req.app.get('io').emit('criticalUpdate', { type: 'emergency_admission' });
        res.json(erCase);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Case Vitals
router.patch('/:id/vitals', async (req, res) => {
    try {
        const updatedCase = await EmergencyCase.findByIdAndUpdate(
            req.params.id,
            { $set: { vitals: req.body } },
            { new: true }
        );
        res.json(updatedCase);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Seed Emergency Data
router.get('/seed-emergency', async (req, res) => {
    try {
        const cases = [
            { 
                caseId: 'ER-2026-0001', patientName: 'Amit Sharma', age: 45, gender: 'Male', 
                emergencyType: 'Cardiac', condition: 'Chest pain, shortness of breath', 
                priority: 'Critical', assignedDoctor: 'Dr. Aryan (Cardio)', currentStatus: 'WAITING',
                vitals: { bp: '160/100', hr: '110', temp: '99', spO2: '92%' }
            },
            { 
                caseId: 'ER-2026-0002', patientName: 'Sunita Devi', age: 32, gender: 'Female', 
                emergencyType: 'Trauma', condition: 'Road accident, leg fracture', 
                priority: 'Serious', assignedDoctor: 'Dr. Vikram (Surgeon)', currentStatus: 'IN ICU',
                vitals: { bp: '110/70', hr: '95', temp: '98.4', spO2: '98%' }
            },
            { 
                caseId: 'ER-2026-0003', patientName: 'Rahul Singh', age: 28, gender: 'Male', 
                emergencyType: 'Neurology', condition: 'Severe headache, blurred vision', 
                priority: 'Serious', assignedDoctor: 'Dr. Lenna (Neuro)', currentStatus: 'LAB PENDING',
                vitals: { bp: '130/85', hr: '80', temp: '98.6', spO2: '99%' }
            },
            { 
                caseId: 'ER-2026-0004', patientName: 'Anjali Gupta', age: 54, gender: 'Female', 
                emergencyType: 'ENT', condition: 'Foreign object in throat', 
                priority: 'Stable', assignedDoctor: 'Dr. Sara (ENT)', currentStatus: 'ADMITTED',
                vitals: { bp: '120/80', hr: '72', temp: '98.2', spO2: '100%' }
            },
            { 
                caseId: 'ER-2026-0005', patientName: 'Kabir Khan', age: 40, gender: 'Male', 
                emergencyType: 'Cardiac', condition: 'Arrhythmia, palpitations', 
                priority: 'Critical', assignedDoctor: 'Dr. Aryan (Cardio)', currentStatus: 'ON VENTILATOR',
                vitals: { bp: '90/60', hr: '130', temp: '97.5', spO2: '88%' }
            }
        ];

        for (const c of cases) {
            await EmergencyCase.findOneAndUpdate(
                { caseId: c.caseId },
                c,
                { upsert: true, new: true }
            );
        }
        res.json({ ok: true, message: 'Emergency cases seeded successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
