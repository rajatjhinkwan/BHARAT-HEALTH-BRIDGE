import React from 'react';
import { Bed, User } from 'lucide-react';

export default function BedStatusCard({ wardName, totalBeds, occupiedBeds, cleaningBeds }) {
  const freeBeds = totalBeds - occupiedBeds - cleaningBeds;

  const styles = {
    card: {
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      padding: '1.5rem',
      boxShadow: 'var(--shadow)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      paddingBottom: '1rem',
      marginBottom: '0.5rem'
    },
    title: {
      margin: 0,
      fontSize: '1.25rem',
      color: 'var(--text-main)',
      fontWeight: 700
    },
    totalBadge: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary)',
      padding: '0.25rem 0.75rem',
      borderRadius: 'var(--radius-full)',
      fontSize: '0.875rem',
      fontWeight: 600
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '1rem'
    },
    statBox: (type) => {
      let bgColor = 'var(--surface-hover)';
      let color = 'var(--text-main)';
      if (type === 'free') {
        bgColor = 'var(--success-light)';
        color = 'var(--success)';
      } else if (type === 'occupied') {
        bgColor = 'var(--danger-light)';
        color = 'var(--danger)';
      } else if (type === 'cleaning') {
        bgColor = 'var(--warning-light)';
        color = 'var(--warning)';
      }

      return {
        background: bgColor,
        padding: '1rem',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: color
      };
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 700,
      lineHeight: 1
    },
    statLabel: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{wardName}</h3>
        <div style={styles.totalBadge}>{totalBeds} Total Beds</div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statBox('free')}>
          <Bed size={24} />
          <div style={styles.statValue}>{freeBeds}</div>
          <div style={styles.statLabel}>Free</div>
        </div>
        
        <div style={styles.statBox('occupied')}>
          <User size={24} />
          <div style={styles.statValue}>{occupiedBeds}</div>
          <div style={styles.statLabel}>Occupied</div>
        </div>

        <div style={styles.statBox('cleaning')}>
          <Bed size={24} />
          <div style={styles.statValue}>{cleaningBeds}</div>
          <div style={styles.statLabel}>Cleaning</div>
        </div>
      </div>
    </div>
  );
}
