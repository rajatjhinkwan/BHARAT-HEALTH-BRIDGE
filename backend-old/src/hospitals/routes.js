import { Router } from 'express'
import Hospital from './hospital.model.js'
import { z } from 'zod'

const router = Router()

router.get('/', async (req, res) => {
  const hospitals = await Hospital.find().limit(50)
  res.json(hospitals)
})

const hospitalSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  type: z.enum(['Govt', 'Private']),
  rating: z.number().min(0).max(5),
  specialties: z.array(z.string()).default([]),
  aqi: z.number().optional(),
})

router.post('/', async (req, res) => {
  const parsed = hospitalSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const created = await Hospital.create(parsed.data)
  res.status(201).json(created)
})

export default router
