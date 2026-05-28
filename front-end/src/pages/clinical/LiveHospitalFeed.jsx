import React from 'react';
import HospitalMetrics from '../../components/clinical/HospitalMetrics';
import ActivityFeed from '../../components/clinical/ActivityFeed';
import './LiveHospitalFeed.css';

export default function LiveHospitalFeed() {
  return (
    <div className="live-feed-page">
      <div className="live-feed-body">
        <section className="live-feed-activity-section">
          <div className="live-feed-section-head">
            <h2>Live activity stream</h2>
            <p>Admissions, discharges, transfers, and department movements in real time</p>
          </div>
          <ActivityFeed />
        </section>

        <aside className="live-feed-metrics-section">
          <div className="live-feed-section-head compact">
            <h2>Snapshot metrics</h2>
          </div>
          <HospitalMetrics />
        </aside>
      </div>
    </div>
  );
}
