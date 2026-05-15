import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function AppointmentList({ appointments, role = 'patient' }) {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    card: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '1.25rem',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s'
    },
    infoGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    dateBox: {
      background: 'var(--primary-light)',
      color: 'var(--primary)',
      padding: '0.75rem',
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '60px'
    },
    dateMonth: {
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase'
    },
    dateDay: {
      fontSize: '1.25rem',
      fontWeight: 800,
      lineHeight: 1
    },
    details: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem'
    },
    title: {
      fontSize: '1rem',
      fontWeight: 600,
      color: 'var(--text-main)',
      margin: 0
    },
    subText: {
      fontSize: '0.85rem',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    statusBadge: (status) => {
      let bg = 'var(--primary-light)';
      let col = 'var(--primary)';
      if (status === 'Confirmed') {
        bg = 'var(--success-light)';
        col = 'var(--success)';
      } else if (status === 'Cancelled') {
        bg = 'var(--danger-light)';
        col = 'var(--danger)';
      }
      return {
        padding: '0.25rem 0.75rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: bg,
        color: col
      };
    }
  };

  if (!appointments || appointments.length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>No upcoming appointments.</div>;
  }

  return (
    <div style={styles.container}>
      {appointments.map((apt, index) => {
        const dateObj = new Date(apt.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        const day = dateObj.getDate();

        return (
          <div key={index} style={styles.card}>
            <div style={styles.infoGroup}>
              <div style={styles.dateBox}>
                <span style={styles.dateMonth}>{month}</span>
                <span style={styles.dateDay}>{day}</span>
              </div>
              <div style={styles.details}>
                <h4 style={styles.title}>
                  {role === 'patient' ? `Dr. ${apt.doctorName} (${apt.department})` : `${apt.patientName}`}
                </h4>
                <div style={styles.subText}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> {apt.time}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> {apt.location || 'Consultation Room'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span style={styles.statusBadge(apt.status)}>{apt.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
