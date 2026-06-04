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

// ==========================================
// 5. SIMULATE DATABASE TAMPERING (DEMO ONLY)
// ==========================================
router.post('/tamper', async (req, res) => {
  try {
    const { recordId, tamperValue } = req.body;
    if (!recordId) {
      return res.status(400).json({ error: 'recordId is required for tampering simulation' });
    }

    const valueToSet = tamperValue || 'CORRUPTED_BY_INTRUSION';

    const record = await MedicalHistory.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Record not found to tamper' });
    }

    // Intentionally alter record data directly in MongoDB WITHOUT mining a block.
    // This creates a mismatch between DB content and blockchain record seal.
    record.title = `[ALERT] ${valueToSet} (${record.title})`;
    
    // If it's a prescription, let's also tamper with the diagnosis
    if (record.type === 'prescription' && record.prescriptionDetails) {
      record.prescriptionDetails.diagnosis = `HACKED: Unauthorized modification of diagnostics.`;
    }

    await record.save();

    console.warn(`[Blockchain-Demo] Tampered with MedicalHistory record: ${recordId}`);
    res.json({
      success: true,
      message: 'Record successfully tampered in the database. Blockchain ledger was NOT updated, making this modification detectable.',
      tamperedRecord: record
    });
  } catch (error) {
    console.error('Tampering simulation error:', error);
    res.status(500).json({ error: 'Server error simulating tampering' });
  }
});

export default router;
