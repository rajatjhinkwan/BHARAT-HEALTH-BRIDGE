import crypto from 'crypto';
import Block from '../models/Block.js';
import MedicalHistory from '../models/MedicalHistory.js';

const DIFFICULTY = 2; // Number of leading zeros required (e.g. '00'). Low for instant mining, high enough to demonstrate PoW.

/**
 * Calculates SHA-256 hash for a block structure.
 */
export function calculateBlockHash(index, previousHash, timestamp, data, nonce) {
  const dataString = JSON.stringify(data);
  const timeString = new Date(timestamp).getTime().toString();
  const input = `${index}${previousHash}${timeString}${dataString}${nonce}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generates a stable SHA-256 hash for a MedicalHistory record's content.
 */
export function generateRecordHash(record) {
  const dataToHash = {
    patientId: record.patientId?.toString(),
    type: record.type,
    title: record.title,
    hospital: record.hospital,
    doctor: record.doctor,
    fileUrl: record.fileUrl || '',
    ocrText: record.ocrText || '',
    prescriptionDetails: record.prescriptionDetails || {},
    voiceNoteDetails: record.voiceNoteDetails || {}
  };

  // Sort keys to guarantee consistent JSON serialization
  const sortedKeys = Object.keys(dataToHash).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = dataToHash[key];
  }

  return crypto.createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex');
}

/**
 * Ensures a genesis block exists in the database.
 */
export async function ensureGenesisBlock() {
  const count = await Block.countDocuments();
  if (count === 0) {
    console.log('[Blockchain] Initializing Chain with Genesis Block...');
    const index = 0;
    const previousHash = '0';
    const timestamp = new Date('2026-01-01T00:00:00.000Z');
    const data = {
      recordId: 'genesis',
      patientId: 'genesis',
      dataHash: crypto.createHash('sha256').update('Bharat Health Bridge Genesis Data').digest('hex')
    };

    let nonce = 0;
    let hash = '';
    const prefix = '0'.repeat(DIFFICULTY);

    // Mine genesis block
    while (true) {
      hash = calculateBlockHash(index, previousHash, timestamp, data, nonce);
      if (hash.startsWith(prefix)) {
        break;
      }
      nonce++;
    }

    const genesisBlock = new Block({
      index,
      timestamp,
      previousHash,
      hash,
      nonce,
      data
    });

    await genesisBlock.save();
    console.log('[Blockchain] Genesis Block saved. Hash:', hash);
  }
}

/**
 * Mines and appends a block to the chain for a medical history record.
 */
export async function addRecordBlock(recordId, patientId, recordData) {
  try {
    await ensureGenesisBlock();

    // Check if block already exists for this recordId to avoid duplicate blocks
    const existingBlock = await Block.findOne({ 'data.recordId': recordId.toString() });
    if (existingBlock) {
      console.log(`[Blockchain] Block already exists for record: ${recordId}. Skipping.`);
      return existingBlock;
    }

    const lastBlock = await Block.findOne().sort({ index: -1 });
    const index = lastBlock.index + 1;
    const previousHash = lastBlock.hash;
    const timestamp = new Date();
    const dataHash = generateRecordHash(recordData);

    const data = {
      recordId: recordId.toString(),
      patientId: patientId.toString(),
      dataHash
    };

    let nonce = 0;
    let hash = '';
    const prefix = '0'.repeat(DIFFICULTY);
    const startMining = Date.now();

    // Mining Loop (Proof-of-Work)
    while (true) {
      hash = calculateBlockHash(index, previousHash, timestamp, data, nonce);
      if (hash.startsWith(prefix)) {
        break;
      }
      nonce++;
    }

    const duration = Date.now() - startMining;
    console.log(`[Blockchain] Block #${index} mined in ${duration}ms! Nonce: ${nonce}, Hash: ${hash}`);

    const newBlock = new Block({
      index,
      timestamp,
      previousHash,
      hash,
      nonce,
      data
    });

    return await newBlock.save();
  } catch (error) {
    console.error('[Blockchain] Error mining block:', error);
    throw error;
  }
}

/**
 * Audits the blockchain ledger.
 * Verifies link integrity, block hash computations, and database record synchronization.
 */
export async function auditChain() {
  try {
    await ensureGenesisBlock();
    const blocks = await Block.find().sort({ index: 1 });
    const auditResults = {
      isValid: true,
      totalBlocks: blocks.length,
      errors: [],
      blocks: []
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const recalculatedHash = calculateBlockHash(
        block.index,
        block.previousHash,
        block.timestamp,
        block.data,
        block.nonce
      );

      const blockDetails = {
        index: block.index,
        recordId: block.data.recordId,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        nonce: block.nonce,
        status: 'SECURE',
        details: []
      };

      // 1. Verify block self-hash
      if (block.hash !== recalculatedHash) {
        auditResults.isValid = false;
        blockDetails.status = 'BREACHED';
        const msg = `Block #${block.index} hash mismatch. Contained: ${block.hash.substring(0, 10)}... Recalculated: ${recalculatedHash.substring(0, 10)}...`;
        auditResults.errors.push(msg);
        blockDetails.details.push('Block self-hash is invalid (Block structure was altered)');
      }

      // 2. Verify links
      if (i > 0) {
        const prevBlock = blocks[i - 1];
        if (block.previousHash !== prevBlock.hash) {
          auditResults.isValid = false;
          blockDetails.status = 'BREACHED';
          const msg = `Chain broken at Block #${block.index}. Link 'previousHash' does not match Block #${prevBlock.index} hash.`;
          auditResults.errors.push(msg);
          blockDetails.details.push(`Previous hash link is broken (Expected: ${prevBlock.hash.substring(0, 8)}, Got: ${block.previousHash.substring(0, 8)})`);
        }
      }

      // 3. Verify Database Integrity (compare DB medical record vs Blockchain block hash)
      if (block.data.recordId !== 'genesis') {
        const record = await MedicalHistory.findById(block.data.recordId);
        if (!record) {
          auditResults.isValid = false;
          blockDetails.status = 'BREACHED';
          const msg = `Database record missing for Block #${block.index} (Record ID: ${block.data.recordId})`;
          auditResults.errors.push(msg);
          blockDetails.details.push('Associated medical record has been DELETED from the database');
        } else {
          const currentRecordHash = generateRecordHash(record);
          if (block.data.dataHash !== currentRecordHash) {
            auditResults.isValid = false;
            blockDetails.status = 'BREACHED';
            const msg = `Integrity mismatch on Medical Record #${block.data.recordId}. Ledger seal: ${block.data.dataHash.substring(0, 10)}... Current: ${currentRecordHash.substring(0, 10)}...`;
            auditResults.errors.push(msg);
            blockDetails.details.push('Medical record data does not match ledger seal');
          }
        }
      }

      auditResults.blocks.push(blockDetails);
    }

    return auditResults;
  } catch (error) {
    console.error('[Blockchain] Audit failed:', error);
    throw error;
  }
}

/**
 * Validates a single medical history record's integrity against the blockchain.
 */
export async function verifyRecordIntegrity(recordId) {
  try {
    const block = await Block.findOne({ 'data.recordId': recordId.toString() });
    if (!block) {
      return { verified: false, reason: 'No blockchain seal exists for this record' };
    }

    const record = await MedicalHistory.findById(recordId);
    if (!record) {
      return { verified: false, reason: 'Record deleted from database' };
    }

    const currentHash = generateRecordHash(record);
    if (block.data.dataHash === currentHash) {
      return { verified: true, blockIndex: block.index, blockHash: block.hash };
    } else {
      return {
        verified: false,
        reason: 'Hash mismatch: DB record modified after mining',
        blockHash: block.hash,
        currentHash
      };
    }
  } catch (error) {
    return { verified: false, reason: `Verification error: ${error.message}` };
  }
}

/**
 * Syncs any existing records that do not have a block in the blockchain ledger.
 */
export async function syncExistingRecords() {
  try {
    await ensureGenesisBlock();
    const records = await MedicalHistory.find().sort({ createdAt: 1 });
    let syncCount = 0;

    for (const record of records) {
      const existingBlock = await Block.findOne({ 'data.recordId': record._id.toString() });
      if (!existingBlock) {
        await addRecordBlock(record._id, record.patientId, record);
        syncCount++;
      }
    }
    return syncCount;
  } catch (error) {
    console.error('[Blockchain] Sync error:', error);
    throw error;
  }
}
