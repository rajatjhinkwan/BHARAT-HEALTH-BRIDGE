import { Router } from 'express'
import Registration from '../models/Registration.js'

const router = Router()

// @route   POST /api/registrations
// @desc    Register a new patient
// @access  Public (or customize based on auth strategy)
router.post('/', async (req, res) => {
  try {
    const { patientName, address, aadharCardId, gender, age, phone } = req.body

    const newRegistration = new Registration({
      patientName,
      address,
      aadharCardId,
      gender,
      age,
      phone
    })

    const savedRegistration = await newRegistration.save()
    res.status(201).json(savedRegistration)
  } catch (error) {
    console.error('Registration Error:', error.message)
    res.status(500).json({ message: 'Server Error during registration' })
  }
})

// @route   GET /api/registrations
// @desc    Get all registrations
// @access  Public
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 })
    res.json(registrations)
  } catch (error) {
    console.error('Get Registrations Error:', error.message)
    res.status(500).json({ message: 'Server Error' })
  }
})

export default router
