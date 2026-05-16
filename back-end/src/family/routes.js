import { Router } from 'express'
import { z } from 'zod'
import FamilyMember from './family.model.js'

const router = Router()

router.get('/', async (req, res) => {
  const members = await FamilyMember.find().limit(20).sort({ createdAt: -1 })
  res.json(members)
})

const memberSchema = z.object({
  name: z.string().min(2),
  relation: z.enum(['Father', 'Mother', 'Child', 'Grandfather', 'Self', 'Wife']),
  status: z.enum(['good', 'due', 'alert', 'caregiver']),
})

router.post('/', async (req, res) => {
  const parsed = memberSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const created = await FamilyMember.create(parsed.data)
  res.status(201).json(created)
})

export default router
