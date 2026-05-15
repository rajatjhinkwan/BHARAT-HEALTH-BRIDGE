import express from 'express';
import Bed from '../models/Bed.js';

const router = express.Router();

// GET all beds
router.get('/', async (req, res) => {
  try {
    const beds = await Bed.find({});
    res.json(beds);
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ error: 'Server error fetching beds' });
  }
});

// Update a bed
router.put('/:id', async (req, res) => {
  try {
    const bed = await Bed.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!bed) return res.status(404).json({ error: 'Bed not found' });
    res.json(bed);
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ error: 'Server error updating bed' });
  }
});

export default router;
