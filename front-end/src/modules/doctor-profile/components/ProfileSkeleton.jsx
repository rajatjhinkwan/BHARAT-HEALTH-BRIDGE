import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="dhp-root">
      <div className="dhp-layout">
        <div className="dhp-profile-card">
          <div className="dhp-skeleton dhp-skeleton-avatar" />
          <div className="dhp-skeleton" style={{ height: 24, width: '70%', margin: '0 auto 8px' }} />
          <div className="dhp-skeleton" style={{ height: 16, width: '50%', margin: '0 auto' }} />
        </div>
        <div className="dhp-main">
          <div className="dhp-skeleton" style={{ height: 48, marginBottom: 16 }} />
          <div className="dhp-section-card">
            <div className="dhp-skeleton" style={{ height: 200 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
