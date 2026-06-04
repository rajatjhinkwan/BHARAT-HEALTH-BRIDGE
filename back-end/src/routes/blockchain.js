import { Router } from 'express';
import Block from '../models/Block.js';
import MedicalHistory from '../models/MedicalHistory.js';
import { auditChain, verifyRecordIntegrity, syncExistingRecords } from '../lib/blockchain.js';

const router = Router();

// ==========================================
// 1. GET ALL BLOCKS (THE LEDGER)
// ==========================================
router.get('/blocks', async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    res.json(blocks);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    res.status(500).json({ error: 'Server error fetching blockchain blocks' });
  }
});

// ==========================================
// 2. AUDIT THE ENTIRE CHAIN & COMPARE WITH DB
// ==========================================
router.get('/audit', async (req, res) => {
  try {
    const auditResults = await auditChain();
    res.json(auditResults);
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Server error running blockchain audit' });
  }
});

// ==========================================
// 3. VERIFY A SINGLE RECORD
// ==========================================
router.get('/verify/:recordId', async (req, res) => {
  try {
    const result = await verifyRecordIntegrity(req.params.recordId);
    res.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error verifying record integrity' });
  }
});

// ==========================================
// 4. SYNC EXISTING DATABASE RECORDS
// ==========================================
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
