import React from 'react';

export default class DoctorProfileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Doctor Profile Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dhp-root" style={{ textAlign: 'center', padding: '4rem' }}>
          <h2>Something went wrong</h2>
          <p style={{ color: 'var(--dhp-muted)' }}>Please refresh the page or contact support.</p>
          <button type="button" className="dhp-btn dhp-btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
