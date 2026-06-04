import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, ShieldCheck, ShieldAlert, Activity, Cpu, Clock,
  ArrowRight, Lock, HelpCircle, RefreshCw, FileText, Terminal,
  Flame, CheckCircle2, AlertOctagon, Server, HardDrive, RefreshCcw
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import toast from 'react-hot-toast';

export default function BlockchainDashboard() {
  const [blocks, setBlocks] = useState([]);
  const [auditInfo, setAuditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const blocksPerPage = 5; // Show 5 blocks per page for a compact view
  
  // Console logs to print during audit checks
  const [consoleLogs, setConsoleLogs] = useState([
    'Initializing Security Ledger connection...',
    'Node status: Operational.',
    'System ready for auditing.'
  ]);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/blockchain/blocks`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
        if (data.length > 0) {
          // Default to the first non-genesis block for tempering dropdown
          const nonGenesis = data.filter(b => b.data.recordId !== 'genesis');
          if (nonGenesis.length > 0 && !selectedRecordId) {
            setSelectedRecordId(nonGenesis[0].data.recordId);
          }
        }
      } else {
        toast.error('Failed to load blockchain ledger');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error loading ledger');
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    try {
      setAuditing(true);
      setConsoleLogs([
        `[${new Date().toLocaleTimeString()}] Establishing cryptographic handshake...`,
        `[${new Date().toLocaleTimeString()}] Fetching live blocks from server database...`,
      ]);

      const res = await fetch(`${API_BASE_URL}/blockchain/audit`);
      
      // Simulate real-time console verification steps for visuals
      await new Promise(resolve => setTimeout(resolve, 800));
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Found ${blocks.length} blocks to inspect.`]);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Verifying link integrity (previousHash === block.hash)...`]);

      if (res.ok) {
        const audit = await res.json();
        setAuditInfo(audit);

        // Print details of each checked block to the console
        for (const block of audit.blocks) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const statusText = block.status === 'SECURE' ? '✅ SECURE' : '❌ BREACHED';
          setConsoleLogs(prev => [
            ...prev,
            `  - Block #${block.index} [Record: ${block.recordId.substring(0, 8)}...]: Hash ${block.hash.substring(0, 12)}... ${statusText}`
          ]);
          if (block.details && block.details.length > 0) {
            block.details.forEach(detail => {
              setConsoleLogs(prev => [...prev, `    ⚠️ ERROR: ${detail}`]);
            });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        if (audit.isValid) {
          setConsoleLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Cryptographic Check: SUCCESS. Chain links intact. Data states verified.`,
            `*** LEDGER INTEGRITY CONFIRMED ***`
          ]);
          toast.success('Blockchain Audit Complete: All data secure');
        } else {
          setConsoleLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] Cryptographic Check: FAILURE. Mismatches detected.`,
            `⚠️ WARNING: UNAUTHORIZED MODIFICATIONS FOUND. DATABASE TAMPERED.`,
            `*** BLOCKCHAIN INTEGRITY BREACHED ***`
          ]);
          toast.error('Blockchain Audit Alert: Unauthorized database changes detected!');
        }
      } else {
        toast.error('Audit API returned an error');
      }
    } catch (error) {
      console.error(error);
      toast.error('Audit failed');
    } finally {
      setAuditing(false);
    }
  };

  const runSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`${API_BASE_URL}/blockchain/sync`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.syncedCount > 0) {
          toast.success(`Ledger Synced: mined ${result.syncedCount} blocks for existing database records.`);
        } else {
          toast.success('Ledger is already in sync with database records.');
        }
        await loadLedger();
      } else {
        toast.error('Failed to sync blockchain ledger');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error during syncing');
    } finally {
      setSyncing(false);
    }
  };


  useEffect(() => {
    loadLedger();
  }, []);

  const chainStatus = auditInfo ? (auditInfo.isValid ? 'SECURE' : 'BREACHED') : 'NOT_AUDITED';

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    title: { fontSize: '2rem', fontWeight: 700, margin: 0 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' },
    statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' },
    mainLayout: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem' },
    ledgerView: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    blockCard: (isGenesis, isTampered) => ({
      background: 'var(--surface)',
      border: isTampered ? '2px solid var(--danger)' : '1px solid var(--border)',
      borderLeft: isTampered ? '8px solid var(--danger)' : isGenesis ? '6px solid var(--accent)' : '6px solid var(--success)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      position: 'relative',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      transition: 'all 0.25s'
    }),
    chainConnector: { display: 'flex', justifyContent: 'center', margin: '-0.75rem 0', color: 'var(--text-muted)' },
    consoleBox: {
      background: '#090d16',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '1rem',
      fontFamily: 'Courier New, Courier, monospace',
      fontSize: '0.85rem',
      color: '#4ade80',
      minHeight: '260px',
      maxHeight: '380px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.8)'
    },
    codeHash: { fontFamily: 'Courier New, monospace', fontSize: '0.82rem', background: 'rgba(0, 0, 0, 0.05)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' },
    darkCodeHash: { fontFamily: 'Courier New, monospace', fontSize: '0.82rem', background: 'rgba(0, 0, 0, 0.4)', color: '#94a3b8', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }
  };

  const indexOfLastBlock = currentPage * blocksPerPage;
  const indexOfFirstBlock = indexOfLastBlock - blocksPerPage;
  const currentBlocks = blocks.slice(indexOfFirstBlock, indexOfLastBlock);
  const totalPages = Math.ceil(blocks.length / blocksPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div style={styles.container} className="animate-fade-in-up blockchain-dashboard">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Security Ledger Command Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Bharat Health Bridge · Cryptographic Tamper-Evidence Blockchain
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin" className="btn-secondary">
            ← Admin Center
          </Link>
          <button
            type="button"
            className="btn-primary"
            onClick={runAudit}
            disabled={auditing || blocks.length === 0}
            style={{ minWidth: '150px' }}
          >
            <RefreshCw size={16} className={auditing ? 'animate-spin' : ''} />
            {auditing ? 'Auditing...' : 'Audit Chain'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            BLOCKCHAIN BLOCKS
            <Database size={18} color="var(--primary)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0' }}>
            {loading ? '…' : blocks.length}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chronological hash chain</span>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            LEDGER STATUS
            {chainStatus === 'SECURE' ? (
              <ShieldCheck size={18} color="var(--success)" />
            ) : chainStatus === 'BREACHED' ? (
              <ShieldAlert size={18} color="var(--danger)" />
            ) : (
              <HelpCircle size={18} color="var(--warning)" />
            )}
          </div>
          <p style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            margin: '0.25rem 0 0',
            color: chainStatus === 'SECURE' ? 'var(--success)' : chainStatus === 'BREACHED' ? 'var(--danger)' : 'var(--warning)'
          }}>
            {chainStatus === 'SECURE' ? 'SECURE' : chainStatus === 'BREACHED' ? 'BREACHED' : 'AWAITING RUN'}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {chainStatus === 'SECURE' ? 'All records authentic' : chainStatus === 'BREACHED' ? 'DB tampering detected!' : 'Perform audit check'}
          </span>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            HASH DIFFICULTY
            <Cpu size={18} color="var(--warning)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0' }}>
            2 Zeros
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proof-of-Work constraint</span>
        </div>

        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            CHAIN ENGINE
            <HardDrive size={18} color="var(--accent)" />
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.6rem 0 0' }}>
            SHA-256 Ledger
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cryptographic Chaining</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={styles.mainLayout}>
        
        {/* Left Side - The Blocks Timeline */}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={22} color="var(--primary)" />
            Ledger Blocks Explorer
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div className="glowing-spinner"></div>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Querying decentralized ledger nodes...</p>
            </div>
          ) : blocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No blocks found in the blockchain. Back-fill the ledger using existing database records.</p>
              <button type="button" className="btn-primary" onClick={runSync} disabled={syncing}>
                <RefreshCcw size={16} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Historical Records'}
              </button>
            </div>
          ) : (
            <div style={styles.ledgerView}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Showing {indexOfFirstBlock + 1} to {Math.min(indexOfLastBlock, blocks.length)} of {blocks.length} blocks
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-outline" 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="btn-outline" 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                    disabled={currentPage === totalPages}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {currentBlocks.map((block, idx) => {
                const isGenesis = block.data.recordId === 'genesis';
                
                // Check if this block has been flagged as breached in the last audit report
                const auditBlock = auditInfo?.blocks?.find(b => b.index === block.index);
                const isTampered = auditBlock?.status === 'BREACHED';

                return (
                  <div key={block._id}>
                    {idx > 0 && (
                      <div style={styles.chainConnector}>
                        <ArrowRight size={20} style={{ transform: 'rotate(90deg)', margin: '0.5rem 0' }} />
                      </div>
                    )}
                    <div style={styles.blockCard(isGenesis, isTampered)} className="hover-card-effect">
                      {/* Block Header Info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider)', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isTampered ? 'var(--danger)' : isGenesis ? 'var(--accent)' : 'var(--success)' }}>
                          BLOCK #{block.index} {isGenesis && '(GENESIS BLOCK)'} {isTampered && '(CORRUPTED)'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          {new Date(block.timestamp).toLocaleString()}
                        </div>
                      </div>

                      {/* Block Body Data details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-muted)' }}>Payload Metadata:</strong>
                          <div style={{ padding: '0.5rem', background: 'var(--surface-hover)', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span><strong>Associated Record:</strong> {isGenesis ? 'N/A' : block.data.recordId}</span>
                            <span><strong>Patient Reference ID:</strong> {isGenesis ? 'N/A' : block.data.patientId}</span>
                            {!isGenesis && (
                              <span>
                                <strong>Payload Cryptographic Seal:</strong>
                                <span style={styles.codeHash}>{block.data.dataHash}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}><strong>Previous Block Hash:</strong></span>
                            <span style={styles.codeHash}>{block.previousHash.substring(0, 32)}...</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}><strong>Current Block Hash:</strong></span>
                            <span style={{ ...styles.codeHash, color: isTampered ? 'var(--danger)' : 'var(--text-main)', fontWeight: isTampered ? 'bold' : 'normal' }}>
                              {block.hash.substring(0, 32)}...
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '0.4rem', borderTop: '1px solid var(--divider)' }}>
                          <span>Nonce Used: <strong>{block.nonce}</strong></span>
                          <span>PoW Verified: <strong>Starts with '00'</strong></span>
                        </div>
                      </div>

                      {/* Display failure notes if tampered */}
                      {isTampered && auditBlock?.details && (
                        <div style={{ padding: '0.5rem 0.75rem', background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertOctagon size={16} />
                          <span><strong>Breach Reason:</strong> {auditBlock.details.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Pagination Controls at Bottom */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    className="btn-outline" 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                    disabled={currentPage === 1}
                  >
                    Previous Page
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                    disabled={currentPage === totalPages}
                  >
                    Next Page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Security Operations Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Audit Operations Terminal */}
          <div style={styles.statCard}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0' }}>
              <Terminal size={20} color="var(--primary)" />
              Security Console Log
            </h2>

            <div style={styles.consoleBox}>
              {consoleLogs.map((log, i) => (
                <div key={i} style={{ lineBreak: 'anywhere' }}>{log}</div>
              ))}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => setConsoleLogs(['Security console logs cleared. Node is listening...'])}
                style={{ fontSize: '0.85rem' }}
              >
                Clear Log
              </button>
              <button
                type="button"
                className="btn-primary w-full"
                onClick={runSync}
                disabled={syncing || loading}
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCcw size={14} className={syncing ? 'animate-spin' : ''} />
                Sync Ledger
              </button>
            </div>
          </div>


        </div>

      </div>
    </div>
  );
}
