import { Router } from 'express'
import { z } from 'zod'
import Bill from './bill.model.js'

const router = Router()

router.get('/', async (req, res) => {
  const bills = await Bill.find().limit(50).sort({ createdAt: -1 })
  res.json(bills)
})

const billSchema = z.object({
  hospital: z.string().min(2),
  patientName: z.string().min(2),
  items: z
    .array(
      z.object({
        description: z.string(),
        unitCost: z.number().nonnegative(),
        quantity: z.number().nonnegative(),
      })
    )
    .min(1),
})

router.post('/', async (req, res) => {
  const parsed = billSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const created = await Bill.create(parsed.data)
  res.status(201).json(created)
})

export default router
