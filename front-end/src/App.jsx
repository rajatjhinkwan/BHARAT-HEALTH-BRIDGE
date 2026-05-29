import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/public/Home';
import OPDRegistration from './pages/reception/OPDRegistration';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import ICUDashboard from './pages/clinical/ICUDashboard';
import VentilatorDashboard from './pages/clinical/VentilatorDashboard';
import WardDashboard from './pages/clinical/WardDashboard';
import DoctorDashboard from './pages/clinical/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import LabDashboard from './pages/services/LabDashboard';
import PharmacyDashboard from './pages/services/PharmacyDashboard';
import TriageDashboard from './pages/emergency/TriageDashboard';
import QueueDashboard from './pages/reception/QueueDashboard';
import ElectronicMedicalRecord from './pages/clinical/ElectronicMedicalRecord';
import EmployeeHierarchy from './pages/admin/EmployeeHierarchy';
import NurseStation from './pages/clinical/NurseStation';
import BedSystemLayout from './pages/bed-management/BedSystemLayout';
import BookAppointment from './pages/reception/BookAppointment';
import HRDashboard from './pages/admin/HRDashboard';
import StaffShifts from './pages/admin/StaffShifts';
import BloodBank from './pages/services/BloodBank';
import Login from './pages/public/Login';
import EmergencyDashboard from './pages/emergency/EmergencyDashboard';
import EmergencyBoards from './pages/emergency/EmergencyBoards';
import UHGSContainer from './UHGS';
import MachineTrackingDashboard from './pages/admin/MachineTrackingDashboard';
import RadiologyDashboard from './pages/services/RadiologyDashboard';
import DepartmentalQueue from './pages/clinical/DepartmentalQueue';
import SurgeryDashboard from './pages/services/SurgeryDashboard';
import SpecializedSessionDashboard from './pages/services/SpecializedSessionDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LiveHospitalFeed from './pages/clinical/LiveHospitalFeed';
import Profile from './pages/clinical/Profile';
import { DoctorProfilePage } from './modules/doctor-profile';
import HospitalList from './pages/public/HospitalList';
import HospitalNavigation from './pages/public/HospitalNavigation';
import PatientPortal from './pages/patient/PatientPortal';
import PatientLogin from './pages/patient/PatientLogin';
import PatientSettings from './pages/patient/PatientSettings';
import PatientHistory from './pages/patient/PatientHistory';
import { NotificationProvider } from './context/NotificationContext';
import GlobalSearch from './components/clinical/GlobalSearch';
import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/public/NotFound';
import './App.css';

const Unauthorized = () => (
  <div style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh' }}>
    <h1 style={{ color: 'var(--danger)' }}>403 - Access Denied</h1>
    <p>You do not have the required role to view this page.</p>
  </div>
);

const NavbarWrapper = ({ onSearch }) => {
  const location = useLocation();
  if (location.pathname === '/login') return null;
  return <Navbar onSearch={onSearch} />;
};

const FooterWrapper = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return <Footer />;
};

function App() {
  const [showSearch, setShowSearch] = useState(false);
  
  const styles = {
    appContainer: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--background)'
    },
    mainContent: {
      flex: 1
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ErrorBoundary>
              {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
              <div style={styles.appContainer}>
                <NavbarWrapper onSearch={() => setShowSearch(true)} />
                <div style={styles.mainContent} className="app-main-content">
                  <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Login />} />
              <Route path="/hospitals" element={<HospitalList />} />
              <Route path="/hospital-navigation" element={<HospitalNavigation />} />
              <Route path="/patient-login" element={<PatientLogin />} />
              <Route path="/patient" element={<PatientPortal />} />
              <Route path="/patient-settings" element={<PatientSettings />} />
              <Route path="/patient-history" element={<PatientHistory />} />
              <Route path="/premium" element={<Navigate to="/doctor" replace />} />
              <Route path="/billing" element={<Navigate to="/admin" replace />} />

              {/* Role-Based Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'medical_director', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                <Route path="/triage" element={<TriageDashboard />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="canViewEMR" />}>
                <Route path="/emr" element={<ElectronicMedicalRecord />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/reception" element={<ReceptionDashboard />} />
                <Route path="/register" element={<ReceptionDashboard />} />
                <Route path="/register-patient" element={<OPDRegistration />} />
                <Route path="/schedule" element={<BookAppointment />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin', 'ADMIN', 'hospital_admin', 'super_admin', 'receptionist', 'nurse', 'doctor']} />}>
                <Route path="/queue" element={<QueueDashboard />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="canUploadLabReports" />}>
                <Route path="/lab" element={<LabDashboard />} />
                <Route path="/bloodbank" element={<BloodBank />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="canUploadRadiologyReports" />}>
                <Route path="/radiology" element={<RadiologyDashboard />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="canDispenseMeds" />}>
                <Route path="/pharmacy" element={<PharmacyDashboard />} />
                <Route path="/inventory" element={<PharmacyDashboard />} />
              </Route>


              <Route element={<ProtectedRoute allowedRoles={['nurse', 'NURSE', 'doctor', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/nurse" element={<WardDashboard />} />
                <Route path="/nurse-station" element={<NurseStation />} />
                <Route path="/beds/*" element={<BedSystemLayout />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['hr', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/hr" element={<HRDashboard />} />
                <Route path="/shifts" element={<StaffShifts />} />
              </Route>

              <Route element={<ProtectedRoute requiredPermission="canViewAuditLogs" />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/governance" element={<UHGSContainer />} />
                <Route path="/hierarchy" element={<EmployeeHierarchy />} />
                <Route path="/machines" element={<MachineTrackingDashboard />} />
                <Route path="/dept-queue" element={<DepartmentalQueue />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'receptionist', 'admin', 'ADMIN', 'hospital_admin', 'super_admin', 'lab_tech', 'pharmacist']} />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'receptionist', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/emergency" element={<EmergencyDashboard />} />
                <Route path="/emergency/boards" element={<EmergencyBoards />} />
              </Route>

              {/* Critical Care Routes */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'hospital_admin', 'super_admin', 'medical_director', 'ICU_STAFF', 'DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN']} />}>
                <Route path="/icu" element={<ICUDashboard />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'hospital_admin', 'super_admin', 'medical_director', 'VENTILATOR_STAFF', 'DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN']} />}>
                <Route path="/ventilator" element={<VentilatorDashboard />} />
              </Route>

              {/* Service Dashboards */}
              <Route element={<ProtectedRoute allowedRoles={['hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/live-feed" element={<LiveHospitalFeed />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'hospital_admin', 'super_admin', 'admin', 'ADMIN']} />}>
                <Route path="/surgery" element={<SurgeryDashboard />} />
                <Route path="/sessions" element={<SpecializedSessionDashboard />} />
              </Route>
              
              {/* Catch-all Route - redirect to home page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <FooterWrapper />
          <Analytics />
        </div>
            </ErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
