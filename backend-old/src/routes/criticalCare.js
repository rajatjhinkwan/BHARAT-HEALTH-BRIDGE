import { Router } from 'express';
import { Patient, User } from '../models/index.js';
import Bed from '../models/Bed.js';

const router = Router();

// ==========================================
// 1. WARD APIs
// ==========================================

router.get('/wards', async (req, res) => {
    try {
        const wards = ['ICU', 'Ventilator Ward', 'Neuro Ward', 'Nephro Ward', 'Cardiac Ward', 'Emergency Observation Ward', 'Trauma Ward', 'Surgical Ward', 'Pediatric Ward'];
        res.json(wards);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch wards' });
    }
});

router.get('/wards/:wardName/patients', async (req, res) => {
    try {
        const { wardName } = req.params;
        const patients = await Patient.find({ currentWard: wardName }).sort({ updatedAt: -1 });
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
        const beds = await Bed.find({}).sort({ wardName: 1, bedNumber: 1 });
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
            currentBed: bed.bedNumber,
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
        }, { new: true });

        req.app.get('io').emit('criticalUpdate', { type: 'admission', ward: wardName });
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
            currentBed: newBed.bedNumber,
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
        }, { new: true });

        req.app.get('io').emit('criticalUpdate', { type: 'shift', ward: newWardName });
        res.json({ patient, bed: newBed });
    } catch (err) {
        res.status(500).json({ error: 'Shift failed' });
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
            bed.status = 'AVAILABLE';
            await bed.save();
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
        }, { new: true });

        req.app.get('io').emit('criticalUpdate', { type: 'discharge' });
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
        req.app.get('io').emit('criticalUpdate', { patientId, type: 'vitals' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: 'Vitals update failed' });
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
        req.app.get('io').emit('criticalUpdate', { patientId, type: 'note' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: 'Add note failed' });
    }
});

export default router;
