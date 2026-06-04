import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchLeaveRequests, reviewLeaveRequest, fetchRosterSummary } from '../../services/hrApi';

export default function StaffShifts() {
  const [activeTab, setActiveTab] = useState('leaves');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [leaves, rosterData] = await Promise.all([
          fetchLeaveRequests(),
          fetchRosterSummary().catch(() => null),
        ]);
        setLeaveRequests(leaves);
        setRoster(rosterData);
      } catch (error) {
        toast.error(error.message || 'Failed to load HR data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleReview = async (id, action) => {
    try {
      setReviewingId(id);
      await reviewLeaveRequest(id, action);
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected');
      const leaves = await fetchLeaveRequests();
      setLeaveRequests(leaves);
    } catch (error) {
      toast.error(error.message || 'Could not update leave request');
    } finally {
      setReviewingId(null);
    }
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem' },
    card: { background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '2rem', border: '1px solid var(--border)' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    tabBar: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
    tab: (active) => ({
      padding: '0.6rem 1.2rem',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? 'white' : 'var(--text-main)',
      borderRadius: '9999px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '0.9rem',
      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    }),
    infoBox: { padding: '1.25rem', background: 'var(--background)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '1rem' },
  };

  const pendingCount = leaveRequests.filter((l) => l.status === 'pending').length;

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.card}>
        <div style={styles.header}>
          <Users size={32} color="var(--primary)" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0 }}>Shift roster & leave</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Review leave requests and view staffing overview
            </p>
          </div>
          <Link to="/hr" className="btn-secondary" style={{ textDecoration: 'none' }}>← HR attendance</Link>
        </div>

        <div style={styles.tabBar}>
          <button type="button" style={styles.tab(activeTab === 'leaves')} onClick={() => setActiveTab('leaves')}>
            <FileText size={16} style={{ display: 'inline', marginRight: 6 }} />
            Leave approvals {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button type="button" style={styles.tab(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
            <Calendar size={16} style={{ display: 'inline', marginRight: 6 }} />
            Roster overview
          </button>
          <button type="button" style={styles.tab(activeTab === 'attendance')} onClick={() => setActiveTab('attendance')}>
            <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />
            Attendance
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : activeTab === 'leaves' ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {leaveRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No leave requests.</p>
            ) : (
              leaveRequests.map((lr) => (
                <div
                  key={lr.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem',
                    background: 'var(--background)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{lr.name}</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {lr.role} · {lr.department || '—'} · {lr.type} · {lr.dates}
                    </span>
                  </div>
                  {lr.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={reviewingId === lr.id}
                        onClick={() => handleReview(lr.id, 'approve')}
                        style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={reviewingId === lr.id}
                        onClick={() => handleReview(lr.id, 'reject')}
                        style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{
                      color: lr.status === 'approved' ? 'var(--success)' : 'var(--danger)',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}>
                      {lr.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'overview' ? (
          <div>
            <div style={styles.infoBox}>
              <h3 style={{ margin: '0 0 0.5rem' }}>{roster?.month || 'Current month'}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {roster?.staffCount ?? '—'} staff members registered · Shifts: Morning, Evening, Night
              </p>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Detailed auto-scheduling is managed at the department level. Use HR attendance for daily clock-in status
              and this page to approve or reject leave that affects roster availability.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.15rem' }}>Daily attendance</h2>
            <p style={{ maxWidth: '420px', margin: '0 auto 1rem' }}>
              Mark present, late, absent, or on leave for each staff member. Payroll is not part of this module.
            </p>
            <Link to="/hr" className="btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Open HR attendance
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
