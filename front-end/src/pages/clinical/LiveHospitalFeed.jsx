import React from 'react';
import HospitalMetrics from '../../components/clinical/HospitalMetrics';
import ActivityFeed from '../../components/clinical/ActivityFeed';
import ErrorBoundary from '../../components/ErrorBoundary';
import './LiveHospitalFeed.css';

function FeedSectionFallback({ title }) {
  return (
    <div className="live-feed-section-fallback">
      <p>{title} could not load. Other panels remain available — try refreshing.</p>
    </div>
  );
}

export default function LiveHospitalFeed() {
  return (
    <div className="live-feed-page">
      <div className="live-feed-body">
        <section className="live-feed-activity-section">
          <div className="live-feed-section-head">
            <h2>Live activity stream</h2>
            <p>Admissions, discharges, transfers, and department movements in real time</p>
          </div>
          <ErrorBoundary fallback={<FeedSectionFallback title="Activity stream" />}>
            <ActivityFeed />
          </ErrorBoundary>
        </section>

        <aside className="live-feed-metrics-section">
          <div className="live-feed-section-head compact">
            <h2>Snapshot metrics</h2>
          </div>
          <ErrorBoundary fallback={<FeedSectionFallback title="Hospital metrics" />}>
            <HospitalMetrics />
          </ErrorBoundary>
        </aside>
      </div>
    </div>
  );
}
