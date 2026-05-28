import express from 'express';
import Bed from '../models/Bed.js';
import { escapeRegExp } from '../lib/regexHelpers.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { ward } = req.query;
    const query = ward
      ? { wardName: { $regex: new RegExp(`^${escapeRegExp(ward)}$`, 'i') } }
      : {};
    const beds = await Bed.find(query)
      .populate('patientId', 'patientName mrn')
      .sort({ wardName: 1, bedNumber: 1 });
    res.json(beds);
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ error: 'Server error fetching beds' });
  }
});

router.put('/:bedId', async (req, res) => {
  try {
    const { bedId } = req.params;
    const updates = { ...req.body };

    if (updates.status === 'Occupied' || updates.status === 'OCCUPIED') {
      updates.status = 'OCCUPIED';
      updates.occupied = true;
    } else if (['Available', 'AVAILABLE', 'Cleaning'].includes(updates.status)) {
      updates.status = 'AVAILABLE';
      updates.occupied = false;
      updates.patientId = null;
    }

    const bed = await Bed.findOneAndUpdate({ bedId }, { $set: updates }, { returnDocument: 'after' });
    if (!bed) return res.status(404).json({ error: 'Bed not found' });

    const io = req.app.get('io');
    if (io) io.emit('bedUpdate', bed);

    res.json(bed);
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ error: 'Server error updating bed' });
  }
});

export default router;
