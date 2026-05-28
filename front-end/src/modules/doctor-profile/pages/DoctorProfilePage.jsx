import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { DoctorProfileProvider, useDoctorProfile } from '../context/DoctorProfileContext';
import ProfileCard from '../components/ProfileCard';
import ProfileSkeleton from '../components/ProfileSkeleton';
import PersonalSection from '../sections/PersonalSection';
import ProfessionalSection from '../sections/ProfessionalSection';
import ContactSection from '../sections/ContactSection';
import DigitalHealthSection from '../sections/DigitalHealthSection';
import AvailabilitySection from '../sections/AvailabilitySection';
import SecuritySection from '../sections/SecuritySection';
import DocumentsSection from '../sections/DocumentsSection';
import AnalyticsSection from '../sections/AnalyticsSection';
import '../styles/doctor-profile.css';
import DoctorProfileErrorBoundary from '../components/ErrorBoundary';

const TABS = [
  { id: 'personal', label: 'Personal' },
  { id: 'professional', label: 'Professional' },
  { id: 'contact', label: 'Contact' },
  { id: 'digital', label: 'Digital Health' },
  { id: 'availability', label: 'Availability' },
  { id: 'security', label: 'Security' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics' },
];

function ProfileContent() {
  const { loading, activeSection, setActiveSection, hasUnsavedChanges, saving, saveSection, doctor } = useDoctorProfile();

  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  if (loading) return <ProfileSkeleton />;

  const renderSection = () => {
    switch (activeSection) {
      case 'personal': return <PersonalSection />;
      case 'professional': return <ProfessionalSection />;
      case 'contact': return <ContactSection />;
      case 'digital': return <DigitalHealthSection />;
      case 'availability': return <AvailabilitySection />;
      case 'security': return <SecuritySection />;
      case 'documents': return <DocumentsSection />;
      case 'analytics': return <AnalyticsSection />;
      default: return <PersonalSection />;
    }
  };

  const status = doctor?.availability?.status || 'offline';

  return (
    <div className="dhp-root">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', background: '#0f172a', color: '#fff' } }} />
      <header className="dhp-header">
        <div>
          <h1>Bharat Health Bridge</h1>
          <p>Doctor Profile Management — Enterprise Clinical Identity</p>
        </div>
        <span className="dhp-badge-live">
          <span className="dot" />
          {status === 'online' ? 'Live Sync' : 'Profile Sync Active'}
        </span>
      </header>

      <div className="dhp-layout">
        <ProfileCard />
        <main className="dhp-main">
          <nav className="dhp-nav-tabs" aria-label="Profile sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dhp-nav-tab ${activeSection === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSection(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            className="dhp-unsaved-banner"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            <span>Unsaved changes</span>
            <button
              type="button"
              className="dhp-btn dhp-btn-primary"
              disabled={saving}
              onClick={() => saveSection({
                personal: doctor?.personal,
                professional: doctor?.professional,
                contact: doctor?.contact,
              })}
            >
              {saving ? 'Saving…' : 'Save Now'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase();
  const allowed = ['doctor', 'medical_director', 'hospital_admin', 'super_admin'];

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(role)) return <Navigate to="/unauthorized" replace />;

  return (
    <DoctorProfileErrorBoundary>
      <DoctorProfileProvider>
        <ProfileContent />
      </DoctorProfileProvider>
    </DoctorProfileErrorBoundary>
  );
}
