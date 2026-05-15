import { Router } from 'express'
import { z } from 'zod'
import { Hospital } from '../models/index.js'

import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  const hospitals = await Hospital.find().limit(50)
  if (hospitals.length === 0) {
    return res.json([
      { _id: 'h1', name: 'City Hospital', city: 'Delhi', type: 'Private', rating: 4.2, specialties: ['Cardiology', 'General'] },
      { _id: 'h2', name: 'Govt Medical College', city: 'Patna', type: 'Govt', rating: 4.0, specialties: ['Orthopedics', 'Emergency'] },
      { _id: 'h3', name: 'Sunrise Clinic', city: 'Bengaluru', type: 'Private', rating: 3.8, specialties: ['Pediatrics'] },
    ])
  }
  res.json(hospitals)
})

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    type: z.enum(['Govt', 'Private']),
    rating: z.number().min(0).max(5),
    specialties: z.array(z.string()).default([]),
    aqi: z.number().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const created = await Hospital.create(parsed.data)
  res.status(201).json(created)
})

export default router
