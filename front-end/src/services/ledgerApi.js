import { apiJson } from '../utils/api';

export async function fetchLedgerSummary() {
  return apiJson('/blockchain/summary');
}

export async function fetchLedgerBlocks({ page = 1, limit = 20, q = '', sort = 'desc' } = {}) {
  const params = new URLSearchParams({ page, limit, sort });
  if (q) params.set('q', q);
  return apiJson(`/blockchain/blocks?${params}`);
}

export async function fetchLedgerBlock(index) {
  return apiJson(`/blockchain/blocks/${index}`);
}

export async function runLedgerAudit() {
  return apiJson('/blockchain/audit');
}

export async function syncLedger() {
  return apiJson('/blockchain/sync', { method: 'POST' });
}
