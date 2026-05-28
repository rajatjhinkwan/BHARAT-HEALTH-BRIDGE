import { Router } from 'express'
import { z } from 'zod'
import { Hospital } from '../models/index.js'
import { fetchHospitalsFromOSM } from '../services/osmService.js'
import { seedUttarakhandHospitals } from '../lib/seedUttarakhandHospitals.js'
import { escapeRegExp } from '../lib/regexHelpers.js'

const router = Router()

function formatHospital(h) {
  const doc = h.toObject ? h.toObject() : h
  const lng = doc.longitude ?? doc.location?.coordinates?.[0]
  const lat = doc.latitude ?? doc.location?.coordinates?.[1]
  return {
    ...doc,
    latitude: lat,
    longitude: lng,
    _id: doc._id,
  }
}

router.get('/', async (req, res) => {
  try {
    const { type, emergency_support, query, district, state, limit = 200 } = req.query
    const dbQuery = { state: state || 'Uttarakhand' }

    if (type) dbQuery.type = type
    if (district) dbQuery.district = new RegExp(escapeRegExp(district), 'i')
    if (emergency_support === 'true') dbQuery.emergency_support = true
    if (query) {
      const escapedQuery = escapeRegExp(query)
      dbQuery.$or = [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { city: { $regex: escapedQuery, $options: 'i' } },
        { district: { $regex: escapedQuery, $options: 'i' } },
        { specialties: { $regex: escapedQuery, $options: 'i' } },
      ]
    }

    let hospitals = await Hospital.find(dbQuery)
      .sort({ district: 1, name: 1 })
      .limit(Math.min(Number(limit) || 200, 500))
      .lean()

    if (hospitals.length === 0) {
      try {
        await seedUttarakhandHospitals(true)
        hospitals = await Hospital.find(dbQuery).sort({ district: 1, name: 1 }).limit(500).lean()
      } catch (seedErr) {
        console.warn('Auto-seed hospitals failed:', seedErr.message)
      }
    }

    res.json(hospitals.map(formatHospital))
  } catch (error) {
    console.error('GET /hospitals error:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch hospitals' })
  }
})

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    city: z.string().min(2),
    type: z.enum(['Govt', 'Private']),
    rating: z.number().min(0).max(5).optional(),
    specialties: z.array(z.string()).default([]),
    aqi: z.number().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    facilities: z.array(z.string()).default([]),
    emergency_support: z.boolean().default(false),
    ICU_count: z.number().default(0),
    bed_count: z.number().default(0),
    doctors_available: z.number().default(0),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
    district: z.string().optional(),
    state: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })
  const data = parsed.data
  if (data.latitude != null && data.longitude != null) {
    data.location = { type: 'Point', coordinates: [data.longitude, data.latitude] }
  }
  const created = await Hospital.create(data)
  res.status(201).json(formatHospital(created))
})

router.post('/sync', async (req, res) => {
  try {
    const region = req.query.region || req.body.region || 'Dehradun'
    const result = await fetchHospitalsFromOSM(region)
    res.json({ message: `Sync successful for ${region}`, result })
  } catch (error) {
    res.status(500).json({ error: 'Sync failed', details: error.message })
  }
})

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50000, emergency_support, district } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    const maxDist = parseInt(radius, 10)

    let hospitals = []
    try {
      const dbQuery = {
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
            $maxDistance: maxDist,
          },
        },
        state: 'Uttarakhand',
      }
      if (emergency_support === 'true') dbQuery.emergency_support = true
      if (district) dbQuery.district = new RegExp(escapeRegExp(district), 'i')
      hospitals = await Hospital.find(dbQuery).limit(100).lean()
    } catch (geoErr) {
      console.warn('Geo query failed, using manual distance:', geoErr.message)
      const all = await Hospital.find({ state: 'Uttarakhand' }).lean()
      hospitals = all
        .map((h) => {
          const hLat = h.latitude ?? h.location?.coordinates?.[1]
          const hLng = h.longitude ?? h.location?.coordinates?.[0]
          if (hLat == null || hLng == null) return null
          const d = haversineKm(latNum, lngNum, hLat, hLng)
          return { ...h, distanceKm: d }
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 100)
    }

    res.json(hospitals.map(formatHospital))
  } catch (error) {
    console.error('GET /hospitals/nearby error:', error)
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' })
    res.json(formatHospital(hospital))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/seed', async (req, res) => {
  try {
    const result = await seedUttarakhandHospitals(true)
    res.json({ success: true, message: 'Uttarakhand hospitals seeded', ...result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default router
