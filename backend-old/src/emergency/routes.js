import { Router } from 'express'
import { z } from 'zod'

const router = Router()

router.post('/alert', async (req, res) => {
  const schema = z.object({
    bloodType: z.string(),
    location: z.string(),
    notes: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  res.json({ ok: true, message: 'Donor alert dispatched', request: parsed.data })
})

router.get('/donors', async (req, res) => {
  const donors = [
    { name: 'Asha', bloodType: 'O+', distanceKm: 2.3, verified: true },
    { name: 'Vivek', bloodType: 'A-', distanceKm: 5.1, verified: false },
  ]
  res.json(donors)
})

export default router
