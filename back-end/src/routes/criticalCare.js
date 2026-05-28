import { Router } from 'express';
import { Patient, User, MedicalHistory } from '../models/index.js';
import Bed from '../models/Bed.js';
import {
  WARD_CATALOG,
  CLINICAL_WARD_KEYS,
  computeBedStats,
  wardToOpdDepartment,
} from '../lib/wards.js';
import { escapeRegExp } from '../lib/regexHelpers.js';

const router = Router();

function emitBedEvents(req, wardName, bed = null) {
  const io = req.app.get('io');
  if (!io) return;
  io.emit('criticalUpdate', { type: 'bed', ward: wardName });
  if (bed) io.emit('bedUpdate', bed);
}

// ==========================================
// 1. WARD APIs
// ==========================================

// Aliases for frontend compatibility
router.get('/icu/patients', async (req, res) => {
    try {
        const patients = await Patient.find({ currentWard: { $regex: /ICU/i } }).sort({ updatedAt: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ICU patients' });
    }
});

router.get('/ventilator/patients', async (req, res) => {
    try {
        const patients = await Patient.find({ currentWard: { $regex: /Ventilator/i } }).sort({ updatedAt: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch Ventilator patients' });
    }
});

router.get('/wards', async (req, res) => {
    try {
        const beds = await Bed.find({}, 'wardName roomNumber').lean();
        const roomsByWard = {};
        for (const b of beds) {
            const w = b.wardName;
            if (!w) continue;
            if (!roomsByWard[w]) roomsByWard[w] = new Set();
            if (b.roomNumber) roomsByWard[w].add(b.roomNumber);
        }
        const payload = WARD_CATALOG.map(({ key, label, opdDepartment }) => ({
            key,
            label,
            opdDepartment,
            rooms: [...(roomsByWard[key] || [])].sort(),
        }));
        res.json(payload);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wards' });
    }
});

router.get('/wards/summary', async (_req, res) => {
    try {
        const beds = await Bed.find().lean();
        const summary = CLINICAL_WARD_KEYS.map((key) => {
            const wardBeds = beds.filter((b) => b.wardName?.toLowerCase() === key.toLowerCase());
            return { key, label: WARD_CATALOG.find((w) => w.key === key)?.label || key, ...computeBedStats(wardBeds) };
        });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ward summary' });
    }
});

router.get('/wards/:wardName/patients', async (req, res) => {
    try {
        const { wardName } = req.params;
        const { room } = req.query;
        // Case-insensitive ward match
        const query = { currentWard: { $regex: new RegExp(`^${escapeRegExp(wardName)}$`, 'i') } };
        if (room && room !== '__ALL__') query.currentRoom = room;
        
        const patients = await Patient.find(query).sort({ updatedAt: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch ward patients' });
    }
});

// ==========================================
// 2. BED APIs
// ==========================================

router.get('/beds', async (req, res) => {
    try {
        const { ward } = req.query;
        let query = {};
        if (ward) {
            query.wardName = { $regex: new RegExp(`^${escapeRegExp(ward)}$`, 'i') };
        }
        const beds = await Bed.find(query).populate('patientId', 'patientName mrn').sort({ wardName: 1, bedNumber: 1 });
        res.json(beds);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch beds' });
    }
});

router.get('/beds/available/:wardName', async (req, res) => {
    try {
        const beds = await Bed.find({ wardName: req.params.wardName, occupied: false, status: 'AVAILABLE' });
        res.json(beds);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch available beds' });
    }
});

// ==========================================
// 3. PATIENT MOVEMENT (Doctor Actions)
// ==========================================

router.patch('/patients/admit/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { wardName, doctorName } = req.body;

        const bed = await Bed.findOne({ wardName, occupied: false, status: 'AVAILABLE' });
        if (!bed) return res.status(400).json({ error: 'No available beds in this ward' });

        bed.occupied = true;
        bed.patientId = patientId;
        bed.status = 'OCCUPIED';
        await bed.save();

        const patient = await Patient.findByIdAndUpdate(patientId, {
            currentWard: wardName,
            currentRoom: bed.roomNumber,
            currentBed: bed.bedId,
            currentStatus: wardName.toUpperCase().includes('ICU') ? 'IN ICU' : 
                          wardName.toUpperCase().includes('VENTILATOR') ? 'ON VENTILATOR' : 'ADMITTED',
            assignedDoctor: doctorName,
            admissionDate: new Date(),
            $push: {
                timeline: {
                    action: 'ADMITTED',
                    department: wardName,
                    performedBy: doctorName,
                    details: `Patient admitted to ${wardName}. Assigned bed: ${bed.bedNumber}`
                }
            }
        }, { returnDocument: 'after' });

        emitBedEvents(req, wardName, bed);
        res.json({ patient, bed });
    } catch (err) {
        res.status(500).json({ error: 'Admission failed' });
    }
});

router.patch('/patients/shift-ward/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { newWardName, doctorName } = req.body;

        const oldBed = await Bed.findOne({ patientId });
        if (oldBed) {
            oldBed.occupied = false;
            oldBed.patientId = null;
            oldBed.status = 'AVAILABLE';
            await oldBed.save();
        }

        const newBed = await Bed.findOne({ wardName: newWardName, occupied: false, status: 'AVAILABLE' });
        if (!newBed) return res.status(400).json({ error: 'No available beds in new ward' });

        newBed.occupied = true;
        newBed.patientId = patientId;
        newBed.status = 'OCCUPIED';
        await newBed.save();

        const patient = await Patient.findByIdAndUpdate(patientId, {
            currentWard: newWardName,
            currentBed: newBed.bedId,
            currentStatus: newWardName.toUpperCase().includes('ICU') ? 'IN ICU' : 
                          newWardName.toUpperCase().includes('VENTILATOR') ? 'ON VENTILATOR' : 'ADMITTED',
            $push: {
                timeline: {
                    action: 'WARD SHIFT',
                    department: newWardName,
                    performedBy: doctorName || 'Doctor',
                    details: `Shifted from previous ward to ${newWardName}. New bed: ${newBed.bedNumber}`
                }
            }
        }, { returnDocument: 'after' });

        emitBedEvents(req, newWardName, newBed);
        res.json({ patient, bed: newBed });
    } catch (err) {
        res.status(500).json({ error: 'Shift failed' });
    }
});

router.post('/patients/discharge/:patientId/summary', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { doctorName, diagnosis, medicines, followUp, notes, hospital } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const record = await MedicalHistory.create({
            patientId,
            type: 'discharge_summary',
            title: `Discharge Summary — ${patient.patientName}`,
            hospital: hospital || 'Bharat Health Bridge',
            doctor: doctorName || 'Attending Physician',
            prescriptionDetails: {
                diagnosis: diagnosis || '',
                notes: notes || '',
                followUpDate: followUp ? new Date(followUp) : undefined,
                medicines: Array.isArray(medicines) ? medicines : [],
            },
        });

        res.status(201).json(record);
    } catch (err) {
        console.error('Discharge summary error:', err);
        res.status(500).json({ error: 'Failed to save discharge summary' });
    }
});

router.patch('/patients/discharge/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { doctorName } = req.body;

        const bed = await Bed.findOne({ patientId });
        if (bed) {
            bed.occupied = false;
            bed.patientId = null;
            bed.status = 'CLEANING';
            await bed.save();
            emitBedEvents(req, bed.wardName, bed);
        }

        const patient = await Patient.findByIdAndUpdate(patientId, {
            currentWard: null,
            currentBed: null,
            currentStatus: 'DISCHARGED',
            dischargeDate: new Date(),
            $push: {
                timeline: {
                    action: 'DISCHARGED',
                    department: 'General',
                    performedBy: doctorName || 'Doctor',
                    details: 'Patient discharged from hospital care.'
                }
            }
        }, { returnDocument: 'after' });

        emitBedEvents(req, 'General');
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: 'Discharge failed' });
    }
});

// ==========================================
// 4. NURSE APIs
// ==========================================

router.patch('/nurse/update-vitals/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { bp, heartRate, temp, spo2, respiratoryRate, recordedBy } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        patient.vitals.push({
            bp,
            heartRate,
            temp,
            spo2,
            respiratoryRate,
            recordedBy,
            timestamp: new Date()
        });

        if (parseInt(spo2) < 90) patient.currentStatus = 'CRITICAL';
        else if (parseInt(spo2) < 95) patient.currentStatus = 'UNDER OBSERVATION';
        
        patient.timeline.push({
            action: 'VITALS UPDATE',
            department: patient.currentWard || 'General',
            performedBy: recordedBy,
            details: `Vitals recorded: BP ${bp}, SpO2 ${spo2}%, HR ${heartRate}`
        });

        await patient.save();
        const io = req.app.get('io');
        if (io) io.emit('criticalUpdate', { patientId, type: 'vitals' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: 'Vitals update failed' });
    }
});

// Nurse assigns patient to a specific bed (Nurse Station)
router.post('/admit', async (req, res) => {
    try {
        const { patientId, bedId, wardName, doctorName } = req.body;
        if (!patientId || !bedId || !wardName) {
            return res.status(400).json({ message: 'patientId, bedId, and wardName are required' });
        }

        const bed = await Bed.findOne({
            bedId,
            wardName: { $regex: new RegExp(`^${escapeRegExp(wardName)}$`, 'i') },
        });
        if (!bed) return res.status(404).json({ error: 'Bed not found' });
        if (bed.occupied) return res.status(400).json({ error: 'Bed is already occupied' });

        const oldBed = await Bed.findOne({ patientId });
        if (oldBed && oldBed.bedId !== bedId) {
            oldBed.occupied = false;
            oldBed.patientId = null;
            oldBed.status = 'AVAILABLE';
            await oldBed.save();
        }

        bed.occupied = true;
        bed.patientId = patientId;
        bed.status = 'OCCUPIED';
        await bed.save();

        const wardUpper = wardName.toUpperCase();
        let currentStatus = 'ADMITTED';
        if (wardUpper.includes('ICU')) currentStatus = 'IN ICU';
        else if (wardUpper.includes('VENTILATOR')) currentStatus = 'ON VENTILATOR';

        const patient = await Patient.findByIdAndUpdate(
            patientId,
            {
                currentWard: wardName,
                currentRoom: bed.roomNumber,
                currentBed: bed.bedId,
                currentStatus,
                assignedDoctor: doctorName || 'Assigned Physician',
                admissionDate: new Date(),
                $push: {
                    timeline: {
                        action: 'ADMITTED',
                        department: wardName,
                        performedBy: doctorName || 'Nurse',
                        details: `Allocated to bed ${bed.bedNumber} in ${wardName}`,
                    },
                },
            },
            { returnDocument: 'after' }
        );

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        emitBedEvents(req, wardName, bed);
        res.json({ patient, bed });
    } catch (err) {
        console.error('Nurse admit error:', err);
        res.status(500).json({ error: 'Admission failed', message: err.message });
    }
});

router.post('/nurse/add-note/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const { nurseName, note } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        patient.nurseNotes.push({
            nurseName,
            note,
            timestamp: new Date()
        });

        patient.timeline.push({
            action: 'NURSE NOTE',
            department: patient.currentWard || 'General',
            performedBy: nurseName,
            details: note.substring(0, 50) + (note.length > 50 ? '...' : '')
        });

        await patient.save();
        const io = req.app.get('io');
        if (io) io.emit('criticalUpdate', { patientId, type: 'note' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: 'Add note failed' });
    }
});

export default router;
