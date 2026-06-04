import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, ShieldCheck, ShieldAlert, RefreshCw, Search,
  ChevronLeft, ChevronRight, X, FileText, RefreshCcw, Link2, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchLedgerSummary,
  fetchLedgerBlocks,
  runLedgerAudit,
  syncLedger,
} from '../../services/ledgerApi';

const PAGE_SIZE = 20;

function truncateHash(hash, len = 16) {
  if (!hash) return '—';
  return hash.length <= len * 2 ? hash : `${hash.slice(0, len)}…${hash.slice(-8)}`;
}

function statusLabel(block) {
  if (block.data?.recordId === 'genesis') return { text: 'Genesis', tone: 'muted' };
  return { text: 'Record seal', tone: 'ok' };
}

export default function BlockchainDashboard() {
  const [summary, setSummary] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [auditInfo, setAuditInfo] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [page, setPage] = useState(1);

  const loadSummary = useCallback(async () => {
    try {
      const data = await fetchLedgerSummary();
      setSummary(data);
    } catch {
      /* summary is optional */
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLedgerBlocks({
        page,
        limit: PAGE_SIZE,
        q: searchQuery,
        sort: 'desc',
      });
      setBlocks(data.blocks || []);
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      });
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const runAudit = async () => {
    try {
      setAuditing(true);
      const audit = await runLedgerAudit();
      setAuditInfo(audit);
      if (audit.isValid) {
        toast.success(`Ledger verified — ${audit.secureCount} blocks secure`);
      } else {
        toast.error(`${audit.breachedCount} integrity issue(s) found`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const runSync = async () => {
    try {
      setSyncing(true);
      const result = await syncLedger();
      if (result.syncedCount > 0) {
        toast.success(`Synced ${result.syncedCount} medical record(s) to the ledger`);
      } else {
        toast.success('Ledger is already up to date');
      }
      await loadSummary();
      await loadBlocks();
      setAuditInfo(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const chainStatus = auditInfo
    ? auditInfo.isValid
      ? 'VERIFIED'
      : 'ISSUES'
    : 'NOT_RUN';

  const breachedIndexes = new Set(
    (auditInfo?.breachedBlocks || auditInfo?.blocks?.filter((b) => b.status === 'BREACHED') || []).map(
      (b) => b.index
    )
  );

  const styles = {
    container: { maxWidth: '1280px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '1.75rem', fontWeight: 700, margin: 0 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.1rem 1.25rem' },
    tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
    th: { textAlign: 'left', padding: '0.75rem 1rem', background: 'var(--surface-hover)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' },
    td: { padding: '0.7rem 1rem', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
    rowBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, padding: 0, fontSize: 'inherit' },
    toolbar: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
    searchForm: { display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '420px' },
    searchInput: { flex: 1, padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--background)' },
    pagination: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' },
    detailPanel: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    detailRow: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.5rem', fontSize: '0.85rem' },
    mono: { fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-muted)' },
    auditList: { margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--danger)' },
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Security Ledger</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0', maxWidth: '560px' }}>
            Cryptographic audit trail for medical history records. Each EMR entry is sealed with a SHA-256 hash
            and linked to the previous block so changes can be detected.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/admin" className="btn-secondary">← Admin</Link>
          <button type="button" className="btn-secondary" onClick={runSync} disabled={syncing}>
            <RefreshCcw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync records'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={runAudit}
            disabled={auditing || (summary?.totalBlocks ?? 0) === 0}
          >
            <RefreshCw size={15} className={auditing ? 'animate-spin' : ''} />
            {auditing ? 'Verifying…' : 'Verify chain'}
          </button>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>TOTAL BLOCKS</div>
          <p style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.2rem 0 0' }}>
            {loading && !summary ? '…' : summary?.totalBlocks ?? pagination.total}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {summary?.recordBlocks ?? '—'} medical record seals
          </span>
        </div>
        <div style={styles.statCard}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>INTEGRITY</div>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0.2rem 0 0',
            color: chainStatus === 'VERIFIED' ? 'var(--success)' : chainStatus === 'ISSUES' ? 'var(--danger)' : 'var(--warning)',
          }}>
            {chainStatus === 'VERIFIED' ? 'Verified' : chainStatus === 'ISSUES' ? 'Issues found' : 'Not verified'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {auditInfo
              ? auditInfo.isValid
                ? `${auditInfo.secureCount} blocks OK`
                : `${auditInfo.breachedCount} block(s) failed check`
              : 'Run verify to check chain + database'}
          </span>
        </div>
        <div style={styles.statCard}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>ALGORITHM</div>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.35rem 0 0' }}>SHA-256</p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Proof-of-work: {summary?.difficulty ?? 2} leading zeros
          </span>
        </div>
      </div>

      {auditInfo && !auditInfo.isValid && auditInfo.breachedBlocks?.length > 0 && (
        <div style={{ ...styles.statCard, borderColor: 'var(--danger)', background: 'var(--danger-light)' }}>
          <strong style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} /> Integrity issues
          </strong>
          <ul style={styles.auditList}>
            {auditInfo.breachedBlocks.map((b) => (
              <li key={b.index}>
                Block #{b.index} — record {truncateHash(b.recordId, 8)}
                {b.details?.length ? `: ${b.details.join('; ')}` : ''}
              </li>
            ))}
          </ul>
          {auditInfo.breachedCount > 50 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
              Showing first 50 of {auditInfo.breachedCount} issues. Search by record ID in the table below.
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedBlock ? '1fr 340px' : '1fr', gap: '1.25rem' }}>
        <section>
          <div style={styles.toolbar}>
            <form style={styles.searchForm} onSubmit={handleSearch}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by block #, record ID, patient ID, or hash…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <button type="submit" className="btn-secondary">Search</button>
              {searchQuery && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }}
                >
                  Clear
                </button>
              )}
            </form>
            <div style={styles.pagination}>
              <button
                type="button"
                className="btn-outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} blocks
              </span>
              <button
                type="button"
                className="btn-outline"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div style={styles.tableWrap}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledger…</div>
            ) : blocks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Database size={40} style={{ opacity: 0.25, marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem' }}>
                  {searchQuery ? 'No blocks match your search.' : 'No blocks yet. Sync existing medical records to build the chain.'}
                </p>
                {!searchQuery && (
                  <button type="button" className="btn-primary" onClick={runSync} disabled={syncing}>
                    Sync historical records
                  </button>
                )}
              </div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Record</th>
                    <th style={styles.th}>Timestamp</th>
                    <th style={styles.th}>Hash</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => {
                    const isGenesis = block.data?.recordId === 'genesis';
                    const breached = breachedIndexes.has(block.index);
                    const st = statusLabel(block);
                    return (
                      <tr
                        key={block._id || block.index}
                        style={{ background: breached ? 'rgba(239, 68, 68, 0.06)' : undefined }}
                      >
                        <td style={styles.td}>
                          <button type="button" style={styles.rowBtn} onClick={() => setSelectedBlock(block)}>
                            {block.index}
                          </button>
                        </td>
                        <td style={styles.td}>{st.text}</td>
                        <td style={{ ...styles.td, maxWidth: '180px' }}>
                          {isGenesis ? '—' : truncateHash(block.data.recordId, 10)}
                        </td>
                        <td style={styles.td}>{new Date(block.timestamp).toLocaleString('en-IN')}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '0.78rem' }}>
                          {truncateHash(block.hash, 10)}
                        </td>
                        <td style={styles.td}>
                          {auditInfo ? (
                            breached ? (
                              <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ShieldAlert size={14} /> Issue
                              </span>
                            ) : (
                              <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <ShieldCheck size={14} /> OK
                              </span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage(1)}>First</button>
              <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button type="button" className="btn-outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              <button type="button" className="btn-outline" disabled={page >= pagination.totalPages} onClick={() => setPage(pagination.totalPages)}>Last</button>
            </div>
          )}
        </section>

        {selectedBlock && (
          <aside style={styles.detailPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Block #{selectedBlock.index}</h3>
              <button type="button" className="btn-outline" onClick={() => setSelectedBlock(null)} style={{ padding: '0.25rem' }}>
                <X size={18} />
              </button>
            </div>
            <div style={styles.detailRow}>
              <span style={{ color: 'var(--text-muted)' }}>Timestamp</span>
              <span>{new Date(selectedBlock.timestamp).toLocaleString('en-IN')}</span>
            </div>
            {selectedBlock.data?.recordId !== 'genesis' && (
              <>
                <div style={styles.detailRow}>
                  <span style={{ color: 'var(--text-muted)' }}><FileText size={12} /> Record ID</span>
                  <span style={styles.mono}>{selectedBlock.data.recordId}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={{ color: 'var(--text-muted)' }}>Patient ID</span>
                  <span style={styles.mono}>{selectedBlock.data.patientId}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={{ color: 'var(--text-muted)' }}><Hash size={12} /> Data seal</span>
                  <span style={styles.mono}>{selectedBlock.data.dataHash}</span>
                </div>
              </>
            )}
            <div style={styles.detailRow}>
              <span style={{ color: 'var(--text-muted)' }}><Link2 size={12} /> Previous</span>
              <span style={styles.mono}>{selectedBlock.previousHash}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={{ color: 'var(--text-muted)' }}>Block hash</span>
              <span style={styles.mono}>{selectedBlock.hash}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={{ color: 'var(--text-muted)' }}>Nonce</span>
              <span>{selectedBlock.nonce}</span>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
