import React from 'react';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import ToggleSwitch from '../components/ToggleSwitch';
import { useDoctorProfile } from '../context/DoctorProfileContext';

const TOGGLES = [
  { key: 'telemedicineEnabled', title: 'Telemedicine', desc: 'Enable remote patient consultations' },
  { key: 'videoConsultationEnabled', title: 'Video Consultation', desc: 'HD video calls with patients' },
  { key: 'voiceDictationEnabled', title: 'Voice Dictation', desc: 'Speech-to-text for clinical notes' },
  { key: 'aiPrescriptionEnabled', title: 'AI Prescription Assist', desc: 'Smart prescription suggestions' },
  { key: 'smsAlerts', title: 'SMS Alerts', desc: 'Appointment and emergency SMS' },
  { key: 'emailAlerts', title: 'Email Alerts', desc: 'Daily summary and reports via email' },
  { key: 'pushNotifications', title: 'Push Notifications', desc: 'Real-time in-app notifications' },
];

export default function DigitalHealthSection() {
  const { doctor, saveSettings, updateLocal } = useDoctorProfile();
  const settings = doctor?.settings || {};

  const toggle = async (key, value) => {
    const next = { ...settings, [key]: value };
    updateLocal((d) => ({ ...d, settings: next }));
    await saveSettings(next);
  };

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><Settings size={20} /> Digital Health Settings</h2>
      </div>
      {TOGGLES.map((t) => (
        <div key={t.key} className="dhp-toggle-row">
          <div className="dhp-toggle-info">
            <h4>{t.title}</h4>
            <p>{t.desc}</p>
          </div>
          <ToggleSwitch
            id={t.key}
            label={t.title}
            checked={!!settings[t.key]}
            onChange={(v) => toggle(t.key, v)}
          />
        </div>
      ))}
    </motion.div>
  );
}
