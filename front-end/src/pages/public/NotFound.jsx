import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '75vh',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--background)',
      color: 'var(--text-main)',
      textAlign: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxSizing: 'border-box'
    },
    card: {
      maxWidth: '640px',
      width: '100%',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '3.5rem 2rem',
      boxShadow: 'var(--shadow-lg)'
    },
    errorCode: {
      fontSize: '6rem',
      fontWeight: '900',
      lineHeight: '1',
      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light, #60a5fa) 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '1rem',
      letterSpacing: '-0.05em'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '800',
      marginBottom: '0.75rem',
      color: 'var(--text-main)',
      letterSpacing: '-0.025em'
    },
    description: {
      fontSize: '1rem',
      color: 'var(--text-muted)',
      lineHeight: '1.6',
      marginBottom: '2.5rem'
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      flexWrap: 'wrap'
    },
    primaryButton: {
      backgroundColor: 'var(--primary)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '0.8rem 1.8rem',
      fontSize: '0.975rem',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.2s'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      color: 'var(--text-main)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      padding: '0.8rem 1.8rem',
      fontSize: '0.975rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorCode}>404</div>
        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.description}>
          The medical bridge pathway you are seeking doesn't exist or has been relocated.
          Please verify the URL or proceed back to our clinical ecosystems.
        </p>
        
        <div style={styles.buttonContainer}>
          <button
            onClick={() => navigate('/')}
            style={styles.primaryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Return Home
          </button>
          
          <button
            onClick={() => navigate(-1)}
            style={styles.secondaryButton}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
