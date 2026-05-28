import React, { useEffect, useState } from 'react';
import { BarChart3, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import AnalyticsCard from '../components/AnalyticsCard';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { doctorApi } from '../services/doctorApi';

export default function AnalyticsSection() {
  const { doctor } = useDoctorProfile();
  const analytics = doctor?.analytics || {};
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    doctorApi.getActivity().then(({ data }) => setActivity(data.activity || [])).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Patients', value: analytics.totalPatients },
    { label: 'Consultations Today', value: analytics.consultationsToday },
    { label: 'Online Consultations', value: analytics.onlineConsultations },
    { label: 'Pending Reports', value: analytics.pendingReports },
    { label: 'Rating', value: analytics.rating, isDecimal: true },
    { label: 'Reviews', value: analytics.reviews },
  ];

  return (
    <>
      <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dhp-section-header">
          <h2><BarChart3 size={20} /> Analytics Overview</h2>
        </div>
        <div className="dhp-analytics-grid">
          {cards.map((c, i) => (
            <AnalyticsCard key={c.label} {...c} index={i} />
          ))}
        </div>
      </motion.div>

      <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="dhp-section-header">
          <h2><Activity size={20} /> Recent Activity</h2>
        </div>
        <ul className="dhp-timeline">
          {activity.map((item, i) => (
            <li key={i}>
              <span className="dhp-timeline-dot" />
              <div>
                <strong>{item.action}</strong> — {item.section}
                <br />
                <small>{new Date(item.at).toLocaleString()}</small>
              </div>
            </li>
          ))}
          {!activity.length && <li>No recent activity</li>}
        </ul>
      </motion.div>
    </>
  );
}
