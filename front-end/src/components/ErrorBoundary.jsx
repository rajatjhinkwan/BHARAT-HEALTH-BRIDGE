import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background, #0f172a)',
          color: 'var(--text-main, #f8fafc)',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'var(--surface, #1e293b)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger, #ef4444)',
              fontSize: '2rem',
              marginBottom: '1.5rem'
            }}>
              ⚠️
            </div>
            
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '800',
              marginBottom: '0.75rem',
              color: 'var(--text-main, #f8fafc)',
              letterSpacing: '-0.025em'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: 'var(--text-muted, #94a3b8)',
              fontSize: '1rem',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Our clinical dashboard encountered an unexpected error. Don't worry, your patient data remains safe.
            </p>

            {this.state.error && (
              <div style={{
                textAlign: 'left',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem',
                borderLeft: '4px solid var(--danger, #ef4444)',
                maxHeight: '150px',
                overflowY: 'auto',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                color: '#f87171'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: 'var(--primary, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Return to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-main, #f8fafc)',
                  border: '1px solid var(--border, #334155)',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
