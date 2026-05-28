import React from 'react';
import AppointmentList from '../../components/AppointmentList';
import { User, Activity, Bell } from 'lucide-react';

export default function PatientDashboard() {
  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--border)'
    },
    titleGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    welcomeText: {
      margin: 0,
      fontSize: '2rem',
      fontWeight: '700',
      color: 'var(--text-main)'
    },
    profileIcon: {
      background: 'var(--primary-light)',
      padding: '0.75rem',
      borderRadius: 'var(--radius-full)',
      color: 'var(--primary)'
    },
    quickActionBtn: {
      backgroundColor: 'var(--primary)',
      color: '#fff',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: 'var(--radius)',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: 'var(--shadow)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
      gap: '2rem'
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--text-main)',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    medicalCard: {
      background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
      color: '#fff',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: 'var(--shadow-lg)',
      position: 'relative',
      overflow: 'hidden'
    },
    vitalBlock: {
      display: 'flex',
      justifyContent: 'space-between',
      borderTop: '1px solid rgba(255,255,255,0.2)',
      paddingTop: '1rem',
      marginTop: '0.5rem'
    }
  };

  const myAppointments = [
    { doctorName: 'Sharma', department: 'Cardiology', date: '2026-04-10', time: '10:00 AM', status: 'Confirmed' },
    { doctorName: 'Gupta', department: 'General', date: '2026-05-02', time: '14:30 PM', status: 'Pending' }
  ];

  return (
    <div style={styles.container} className="animate-fade-in-up">
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.profileIcon}>
            <User size={32} />
          </div>
          <div>
            <h1 style={styles.welcomeText}>Welcome back, Rahul!</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Patient ID: PT-98234</p>
          </div>
        </div>
        <button style={styles.quickActionBtn}>Book Appointment</button>
      </div>

      <div style={styles.grid}>
        {/* Main Content Area */}
        <div style={styles.section}>
          <div>
            <h3 style={styles.sectionTitle}><Activity size={20} /> Latest Vitals</h3>
            <div style={{ ...styles.medicalCard, marginTop: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: '500', opacity: 0.9 }}>Last Checkup: 15 Mar 2026</h4>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2rem' }}>All Clear!</h2>
              </div>
              <div style={styles.vitalBlock}>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Blood Pressure</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>120/80</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Heart Rate</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>72 bpm</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Weight</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>70 kg</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Area */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}><Bell size={20} /> Upcoming Appointments</h3>
          <AppointmentList appointments={myAppointments} role="patient" />
        </div>
      </div>
    </div>
  );
}
