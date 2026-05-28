import { Router } from 'express';
import BloodDonor from '../models/BloodDonor.js';
import { escapeRegExp } from '../lib/regexHelpers.js';

const router = Router();

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/', async (req, res) => {
  try {
    const { bloodType, city, district, lat, lng, limit = 100 } = req.query;
    const filter = {};
    if (bloodType) filter.bloodType = new RegExp(`^${escapeRegExp(bloodType)}$`, 'i');
    if (city) filter.city = new RegExp(escapeRegExp(city), 'i');
    if (district) filter.district = new RegExp(escapeRegExp(district), 'i');

    let donors = await BloodDonor.find(filter).limit(Math.min(Number(limit) || 100, 500)).lean();

    const latNum = lat ? Number(lat) : null;
    const lngNum = lng ? Number(lng) : null;
    if (latNum != null && lngNum != null) {
      donors = donors.map((d) => ({
        ...d,
        distanceKm:
          d.latitude != null && d.longitude != null
            ? haversineKm(latNum, lngNum, d.latitude, d.longitude)
            : 999,
      }));
      donors.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    res.json(donors);
  } catch (err) {
    console.error('Donors fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch donors' });
  }
});

router.post('/sos', async (req, res) => {
  try {
    const { bloodType, lat, lng, patientId } = req.body;
    const filter = bloodType ? { bloodType: new RegExp(`^${escapeRegExp(bloodType)}$`, 'i') } : {};
    const donors = await BloodDonor.find(filter).limit(200).lean();

    const io = req.app.get('io');
    if (io && patientId) {
      io.emit('donorSOS', { patientId, bloodType, lat, lng, donorCount: donors.length });
    }

    res.json({
      ok: true,
      message: `SOS broadcast to ${donors.length} registered donors`,
      donorCount: donors.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'SOS broadcast failed' });
  }
});

export default router;
