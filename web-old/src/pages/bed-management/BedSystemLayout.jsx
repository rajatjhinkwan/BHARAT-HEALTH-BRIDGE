import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HospitalProvider } from './context/HospitalContext';
import Sidebar from './components/Sidebar';
import AlertBanner from './components/AlertBanner';
import Dashboard from './pages/Dashboard';
import BedTracking from './pages/BedTracking';
import Admissions from './pages/Admissions';
import Transfers from './pages/Transfers';
import Discharge from './pages/Discharge';
import Reports from './pages/Reports';
import './BedSystem.css';

export default function BedSystemLayout() {
  return (
    <HospitalProvider>
      <div className="bed-system">
        <div className="app-shell" style={{ height: 'calc(100vh - 80px)' }}> {/* Assuming top navbar takes some height */}
          <Sidebar />
          <div className="page-content">
            <AlertBanner />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="tracking" element={<BedTracking />} />
              <Route path="admissions" element={<Admissions />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="discharge" element={<Discharge />} />
              <Route path="reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </div>
    </HospitalProvider>
  );
}
