import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Plane, Ban, CheckCircle, Search, Edit2, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchTodayAttendance, updateAttendance } from '../../services/hrApi';

const STATUS_OPTIONS = ['Present', 'Not Arrived', 'Leave', 'Late'];

export default function HRDashboard() {
  const [personnel, setPersonnel] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [leaveForm, setLeaveForm] = useState({ reason: '', returnDate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTodayAttendance();
      setPersonnel(data.personnel || []);
      setAttendanceDate(data.date || '');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const applyStatus = async (id, newStatus) => {
    if (newStatus === 'Leave' && (!leaveForm.reason.trim() || !leaveForm.returnDate.trim())) {
      toast.error('Enter leave reason and expected return date');
      return;
    }
    try {
      setSaving(true);
      await updateAttendance(id, {
        status: newStatus,
        leaveReason: leaveForm.reason,
        returnDate: leaveForm.returnDate,
      });
      toast.success('Attendance updated');
      setEditingId(null);
      setLeaveForm({ reason: '', returnDate: '' });
      await loadAttendance();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const styles = {
    container: { maxWidth: '1400px', margin: '0 auto', padding: '2rem' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' },
    metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' },
    metricCard: (colorCode) => ({
      background: 'var(--surface)',
      border: `1px solid ${colorCode}`,
      padding: '1.25rem',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      borderLeft: `5px solid ${colorCode}`,
    }),
    table: { width: '100%', borderCollapse: 'collapse', background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' },
    th: { padding: '0.85rem 1rem', textAlign: 'left', background: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' },
    td: { padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', verticalAlign: 'top' },
    statusBadge: (status) => {
      let bg = 'var(--background)';
      let color = 'var(--text-main)';
      if (status === 'Present') { bg = 'var(--success-light)'; color = 'var(--success)'; }
      else if (status === 'Not Arrived' || status === 'Late') { bg = 'var(--danger-light)'; color = status === 'Late' ? 'var(--warning)' : 'var(--danger)'; }
      else if (status === 'Leave') { bg = 'var(--warning-light)'; color = 'var(--warning)'; }
      return { padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', background: bg, color, fontWeight: 600, fontSize: '0.78rem', display: 'inline-block' };
    },
    editPanel: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' },
    editInput: { padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem', width: '100%' },
    actionBtn: { padding: '0.35rem 0.7rem', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', marginRight: '0.35rem', marginBottom: '0.35rem' },
  };

  const filteredStaff = personnel.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counts = {
    present: personnel.filter((p) => p.status === 'Present').length,
    notArrived: personnel.filter((p) => p.status === 'Not Arrived' || p.status === 'Late').length,
    leave: personnel.filter((p) => p.status === 'Leave').length,
    totalScheduled: personnel.filter((p) => p.status !== 'Leave').length,
  };

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0 }}>HR & Attendance</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Daily staff presence for Bharat Health Bridge
              {attendanceDate && ` · ${attendanceDate}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none' }}>← Admin</Link>
          <Link to="/shifts" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Calendar size={16} /> Shift roster & leave
          </Link>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', top: 10, left: 10 }} />
            <input
              type="text"
              placeholder="Search staff…"
              style={{ padding: '0.5rem 0.75rem 0.5rem 2.25rem', width: '100%', borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', background: 'var(--surface)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div style={styles.metricGrid}>
        <div style={styles.metricCard('var(--success)')}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={15} /> Present today
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {loading ? '…' : counts.present}
            <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}> / {counts.totalScheduled} scheduled</span>
          </div>
        </div>
        <div style={styles.metricCard('var(--danger)')}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ban size={15} /> Absent / late
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{loading ? '…' : counts.notArrived}</div>
        </div>
        <div style={styles.metricCard('var(--warning)')}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plane size={15} /> On approved leave
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{loading ? '…' : counts.leave}</div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
        HR can mark clock-in, late arrival, absence, or leave for hospital staff. Approved leave requests from the shift roster
        automatically update future attendance days.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 1rem' }}>Staff tracking</h2>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading staff attendance…</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Employee</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Shift / time</th>
                <th style={styles.th}>HR actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((p) => (
                <tr key={p.id} style={{ background: p.status === 'Not Arrived' ? 'rgba(254, 242, 242, 0.5)' : undefined }}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.id} · {p.role} · {p.dept}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge(p.status)}>{p.status}</span>
                  </td>
                  <td style={styles.td}>
                    {p.status === 'Leave' ? (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600 }}>{p.details || 'Leave'}</div>
                        {p.returnDate && <div style={{ color: 'var(--text-muted)' }}>Return: {p.returnDate}</div>}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem' }}>
                        <div><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Shift: {p.shiftStart}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Clock-in: {p.timeIn}</div>
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === p.id ? (
                      <div style={styles.editPanel}>
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            disabled={saving}
                            onClick={() => applyStatus(p.id, opt)}
                            style={styles.actionBtn}
                          >
                            {opt}
                          </button>
                        ))}
                        {editingId === p.id && (
                          <>
                            <input
                              type="text"
                              placeholder="Leave reason (if granting leave)"
                              value={leaveForm.reason}
                              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                              style={styles.editInput}
                            />
                            <input
                              type="text"
                              placeholder="Return date e.g. 15 Nov 2026"
                              value={leaveForm.returnDate}
                              onChange={(e) => setLeaveForm((f) => ({ ...f, returnDate: e.target.value }))}
                              style={styles.editInput}
                            />
                          </>
                        )}
                        <button type="button" onClick={() => setEditingId(null)} style={styles.actionBtn}>
                          <X size={12} style={{ display: 'inline' }} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(p.id);
                          setLeaveForm({ reason: p.details || '', returnDate: p.returnDate || '' });
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Edit2 size={14} /> Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No staff found. Ensure staff accounts are seeded in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
