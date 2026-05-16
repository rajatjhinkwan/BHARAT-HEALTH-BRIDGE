import express from 'express';
import PatientQueue from '../models/PatientQueue.js';

const router = express.Router();

// Add patient to queue
router.post('/', async (req, res) => {
  try {
    const newQueueEntry = new PatientQueue(req.body);
    const savedEntry = await newQueueEntry.save();
    res.status(201).json(savedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get queue for a specific department
router.get('/:department', async (req, res) => {
  try {
    const queue = await PatientQueue.find({ 
      targetDepartment: req.params.department,
      status: { $ne: 'Completed' } 
    }).sort({ createdAt: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update queue status
router.patch('/:queueId', async (req, res) => {
  try {
    const updatedEntry = await PatientQueue.findOneAndUpdate(
      { queueId: req.params.queueId },
      { status: req.body.status },
      { new: true }
    );
    res.json(updatedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
