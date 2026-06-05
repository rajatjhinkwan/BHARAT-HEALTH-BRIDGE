import React, { useState, useEffect } from 'react';
import { Activity, Clock, User } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import './ActivityFeed.css';

function formatActivityTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem('hospflow_auth_token');
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/workflow/activity`, { headers });
        if (res.ok) {
          const data = await res.json();
          setActivities(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="activity-feed-panel">
      <div className="activity-feed-list">
        {loading && activities.length === 0 && (
          <p className="activity-feed-empty">Loading live events…</p>
        )}

        {activities.map((act, idx) => (
          <article key={`${act.timestamp}-${idx}`} className="activity-feed-item">
            <span className="activity-feed-dot" aria-hidden />
            <div className="activity-feed-content">
              <div className="activity-feed-row">
                <strong>{act.patientName || 'Patient'}</strong>
                <span className="activity-feed-time">
                  <Clock size={12} />
                  {formatActivityTime(act.timestamp)}
                </span>
              </div>
              <span className="activity-feed-action">{act.action}</span>
              <p>{act.details}</p>
              <span className="activity-feed-by">
                <User size={12} /> {act.performedBy || 'System'}
              </span>
            </div>
          </article>
        ))}

        {!loading && activities.length === 0 && (
          <div className="activity-feed-empty">
            <Activity size={32} />
            <p>No recent activity yet. Patient movements will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
