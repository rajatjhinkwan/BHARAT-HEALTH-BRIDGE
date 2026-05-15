import { Router } from 'express'
import Patient from '../models/Patient.js'
import QueueNode from '../models/QueueNode.js'

const router = Router()

// ========================
// PATIENT ENDPOINTS
// ========================

// @route   POST /api/clinical/patients
// @desc    Register a new patient
router.post('/patients', async (req, res) => {
  try {
    const newPatient = new Patient(req.body)
    const saved = await newPatient.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Patient Registration Error:', error)
    res.status(500).json({ message: 'Server Error during patient registration', error: error.message })
  }
})

// @route   GET /api/clinical/patients
// @desc    Get all patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 })
    res.json(patients)
  } catch (error) {
    console.error('Fetch Patients Error:', error)
    res.status(500).json({ message: 'Server Error fetching patients' })
  }
})

// @route   GET /api/clinical/patients/:id
// @desc    Get a single patient
router.get('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
    if(!patient) return res.status(404).json({ message: 'Patient not found' })
    res.json(patient)
  } catch (error) {
    console.error('Fetch Patient Error:', error)
    res.status(500).json({ message: 'Server Error fetching patient' })
  }
})

// @route   PUT /api/clinical/patients/:id
// @desc    Update a patient (add vitals, encounters, labs, etc.)
router.put('/patients/:id', async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if(!updated) return res.status(404).json({ message: 'Patient not found' })
    res.json(updated)
  } catch (error) {
    console.error('Update Patient Error:', error)
    res.status(500).json({ message: 'Server Error updating patient' })
  }
})

// ========================
// QUEUE ENDPOINTS
// ========================

// @route   POST /api/clinical/queue
// @desc    Add a patient to the queue
router.post('/queue', async (req, res) => {
  try {
    const newQueueNode = new QueueNode(req.body)
    const saved = await newQueueNode.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Queue Addition Error:', error)
    res.status(500).json({ message: 'Server Error adding to queue', error: error.message })
  }
})

// @route   GET /api/clinical/queue
// @desc    Get the current active queue
router.get('/queue', async (req, res) => {
  try {
    const queue = await QueueNode.find().sort({ createdAt: 1 }).populate('patientId')
    res.json(queue)
  } catch (error) {
    console.error('Fetch Queue Error:', error)
    res.status(500).json({ message: 'Server Error fetching queue' })
  }
})

// @route   PUT /api/clinical/queue/:queueId
// @desc    Update queue status by queueId string
router.put('/queue/:queueId', async (req, res) => {
  try {
    const updated = await QueueNode.findOneAndUpdate({ queueId: req.params.queueId }, req.body, { new: true })
    if(!updated) return res.status(404).json({ message: 'Queue node not found' })
    res.json(updated)
  } catch (error) {
    console.error('Update Queue Error:', error)
    res.status(500).json({ message: 'Server Error updating queue status' })
  }
})

export default router
