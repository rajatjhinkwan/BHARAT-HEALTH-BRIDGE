import { Router } from 'express';
import Block from '../models/Block.js';
import { auditChain, verifyRecordIntegrity, syncExistingRecords } from '../lib/blockchain.js';

const router = Router();

router.get('/summary', async (req, res) => {
  try {
    const [totalBlocks, recordBlocks] = await Promise.all([
      Block.countDocuments(),
      Block.countDocuments({ 'data.recordId': { $ne: 'genesis' } }),
    ]);
    res.json({
      totalBlocks,
      recordBlocks,
      hasGenesis: totalBlocks > 0,
      algorithm: 'SHA-256',
      difficulty: 2,
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Server error fetching ledger summary' });
  }
});

router.get('/blocks', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit, 10) || 20));
    const q = (req.query.q || '').trim();
    const sort = req.query.sort === 'asc' ? 1 : -1;

    const filter = {};
    if (q) {
      const or = [
        { 'data.recordId': { $regex: q, $options: 'i' } },
        { 'data.patientId': { $regex: q, $options: 'i' } },
        { hash: { $regex: q, $options: 'i' } },
        { previousHash: { $regex: q, $options: 'i' } },
      ];
      const indexNum = parseInt(q, 10);
      if (!Number.isNaN(indexNum)) or.push({ index: indexNum });
      filter.$or = or;
    }

    const [blocks, total] = await Promise.all([
      Block.find(filter)
        .sort({ index: sort })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Block.countDocuments(filter),
    ]);

    res.json({
      blocks,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Server error fetching blockchain blocks' });
  }
});

router.get('/blocks/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    if (Number.isNaN(index)) {
      return res.status(400).json({ error: 'Invalid block index' });
    }
    const block = await Block.findOne({ index }).lean();
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json(block);
  } catch (error) {
    console.error('Error fetching block:', error);
    res.status(500).json({ error: 'Server error fetching block' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const auditResults = await auditChain();
    const breached = auditResults.blocks.filter((b) => b.status === 'BREACHED');
    res.json({
      ...auditResults,
      breachedCount: breached.length,
      secureCount: auditResults.blocks.length - breached.length,
      breachedBlocks: breached.slice(0, 50),
    });
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Server error running blockchain audit' });
  }
});

router.get('/verify/:recordId', async (req, res) => {
  try {
    const result = await verifyRecordIntegrity(req.params.recordId);
    res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error verifying record integrity' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const count = await syncExistingRecords();
    res.json({ success: true, syncedCount: count });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Server error synchronizing ledger' });
  }
});

export default router;
