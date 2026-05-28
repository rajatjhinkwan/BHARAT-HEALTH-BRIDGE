import { Router } from 'express'
import { z } from 'zod'
import { Bill } from '../models/index.js'

import { authenticate as protect } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, async (req, res) => {
  const bills = await Bill.find({ userId: req.user._id }).limit(50).sort({ createdAt: -1 })
  if (bills.length === 0) {
    // ... sample logic remains same but scoped to user if needed
    const now = new Date()
    const sample = [
      {
        _id: 'sample1',
        hospital: 'City Hospital, Delhi',
        patientName: 'Rahul Sharma',
        createdAt: now.toISOString(),
        items: [
          { description: 'CBC Test', unitCost: 500, quantity: 1 },
          { description: 'Paracetamol 650mg', unitCost: 3, quantity: 10 },
        ],
      },
      {
        _id: 'sample2',
        hospital: 'Govt Medical College, Patna',
        patientName: 'Asha Verma',
        createdAt: new Date(now.getTime() - 86400000 * 15).toISOString(),
        items: [
          { description: 'X-Ray', unitCost: 800, quantity: 1 },
          { description: 'Consultation', unitCost: 400, quantity: 1 },
        ],
      },
    ]
    return res.json(sample)
  }
  res.json(bills)
})

router.post('/', async (req, res) => {
  const schema = z.object({
    hospital: z.string().min(2),
    patientName: z.string().min(2),
    items: z.array(z.object({ description: z.string(), unitCost: z.number().nonnegative(), quantity: z.number().nonnegative() })).min(1),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const created = await Bill.create(parsed.data)
  res.status(201).json(created)
})

// Analyze a bill (mock implementation)
router.post('/analyze', async (req, res) => {
  const schema = z.object({
    sourceType: z.enum(['camera', 'gallery', 'pdf']),
    uri: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

  // Mocked analysis: compute a deterministic score and issues based on uri hash
  const input = parsed.data.uri ?? parsed.data.sourceType
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  const score = 70 + (hash % 31) // 70-100

  const issues = [
    { id: 'missing_gst', title: 'GST number missing', severity: 'medium' },
    { id: 'duplicate_item', title: 'Possible duplicate line item', severity: 'low' },
    { id: 'mrp_exceeded', title: 'Price above MRP benchmark', severity: 'high' },
  ]
  const flagged = issues.slice(0, Math.max(1, (100 - score) >= 10 ? 3 : 2))

  res.json({
    standards: 'BIS 19493:2025',
    score,
    outOf: 100,
    attentionCount: flagged.length,
    issues: flagged,
    billing: {
        originalTotal: '₹42,800',
        total: '₹38,200',
        potentialSavings: '₹4,600',
        lastUpdated: new Date().toLocaleTimeString(),
        logs: [
            { id: 'l1', item: 'Bed Charges (Semi-Private)', cost: '₹8,000', category: 'Accommodation', status: 'ok', time: '10:30 AM' },
            { id: 'l2', item: 'Consultation Fee - Dr. Singh', cost: '₹2,500', category: 'Consultation', status: 'ok', time: '11:15 AM' },
            { id: 'l4', item: 'IV Fluids (NS 500ml)', cost: '₹4,620', category: 'Pharmacy', status: 'red-flag', flag: 'Price 35% above MRP benchmark', time: '02:45 PM' },
        ]
    }
  })
})

router.get('/live', protect, async (req, res) => {
    // In a real app, this would query active admissions for the user
    res.json({
        originalTotal: '₹42,800',
        total: '₹38,200',
        potentialSavings: '₹4,600',
        lastUpdated: 'Just now',
        logs: [
            { id: 'l1', item: 'Bed Charges (Semi-Private)', cost: '₹8,000', category: 'Accommodation', status: 'ok', time: '10:30 AM' },
            { id: 'l2', item: 'Consultation Fee - Dr. Singh', cost: '₹2,500', category: 'Consultation', status: 'ok', time: '11:15 AM' },
            { id: 'l4', item: 'IV Fluids (NS 500ml)', cost: '₹4,620', category: 'Pharmacy', status: 'red-flag', flag: 'Price 35% above MRP benchmark', time: '02:45 PM' },
            { id: 'l5', item: 'Admin Charges', cost: '₹1,500', category: 'General', status: 'flag', flag: 'Non-medical charge detected', time: '04:20 PM' },
        ]
    })
})

export default router
