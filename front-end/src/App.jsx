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
import InventoryManagement from './pages/services/InventoryManagement';
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
import { NotificationProvider } from './context/NotificationContext';
import GlobalSearch from './components/clinical/GlobalSearch';
import React, { useState } from 'react';
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
      <NotificationProvider>
        <AuthProvider>
          <Router>
            {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}
            <div style={styles.appContainer}>
              <NavbarWrapper onSearch={() => setShowSearch(true)} />
             <div style={styles.mainContent}>
               <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Login />} />

              {/* Role-Based Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'medical_director', 'hospital_admin', 'super_admin']} />}>
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/triage" element={<TriageDashboard />} />
                <Route path="/emr" element={<ElectronicMedicalRecord />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['receptionist', 'hospital_admin', 'super_admin']} />}>
                <Route path="/reception" element={<ReceptionDashboard />} />
                <Route path="/register" element={<ReceptionDashboard />} />
                <Route path="/register-patient" element={<OPDRegistration />} />
                <Route path="/schedule" element={<BookAppointment />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin', 'hospital_admin', 'super_admin', 'receptionist', 'nurse', 'doctor']} />}>
                <Route path="/queue" element={<QueueDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['lab_tech', 'hospital_admin', 'super_admin']} />}>
                <Route path="/lab" element={<LabDashboard />} />
                <Route path="/bloodbank" element={<BloodBank />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['pharmacist', 'pharmacy_manager', 'hospital_admin', 'super_admin']} />}>
                <Route path="/pharmacy" element={<PharmacyDashboard />} />
                <Route path="/inventory" element={<InventoryManagement />} />
              </Route>


              <Route element={<ProtectedRoute allowedRoles={['nurse', 'NURSE', 'doctor', 'hospital_admin', 'super_admin']} />}>
                <Route path="/nurse" element={<WardDashboard />} />
                <Route path="/nurse-station" element={<NurseStation />} />
                <Route path="/beds/*" element={<BedSystemLayout />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['hr', 'hospital_admin', 'super_admin']} />}>
                <Route path="/hr" element={<HRDashboard />} />
                <Route path="/shifts" element={<StaffShifts />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['hospital_admin', 'super_admin', 'medical_director']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/governance" element={<UHGSContainer />} />
                <Route path="/hierarchy" element={<EmployeeHierarchy />} />
                <Route path="/machines" element={<MachineTrackingDashboard />} />
                <Route path="/dept-queue" element={<DepartmentalQueue />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'receptionist', 'admin', 'hospital_admin', 'super_admin', 'lab_tech', 'pharmacist']} />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'receptionist', 'hospital_admin', 'super_admin']} />}>
                <Route path="/emergency" element={<EmergencyDashboard />} />
                <Route path="/emergency/boards" element={<EmergencyBoards />} />
              </Route>

              {/* Critical Care Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ICU_STAFF', 'DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN']} />}>
                <Route path="/icu" element={<ICUDashboard />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['VENTILATOR_STAFF', 'DOCTOR', 'ADMIN', 'HOSPITAL_ADMIN']} />}>
                <Route path="/ventilator" element={<VentilatorDashboard />} />
              </Route>

              {/* Service Dashboards */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'nurse', 'hospital_admin', 'super_admin']} />}>
                <Route path="/live-feed" element={<LiveHospitalFeed />} />
                <Route path="/radiology" element={<RadiologyDashboard />} />
                <Route path="/surgery" element={<SurgeryDashboard />} />
                <Route path="/sessions" element={<SpecializedSessionDashboard />} />
              </Route>
            </Routes>
          </div>
          <FooterWrapper />
        </div>
          </Router>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
