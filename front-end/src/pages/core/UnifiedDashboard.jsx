import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Activity, ClipboardList, 
  Settings, Bell, Search, LogOut, Clock, Calendar, 
  ChevronRight, HeartPulse, ShieldCheck, Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminHome from './dashboard/AdminHome';
import DoctorHome from './dashboard/DoctorHome';
import NurseHome from './dashboard/NurseHome';
import OPDHome from './dashboard/OPDHome';
import './Dashboard.css';

const UnifiedDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const renderRoleSpecificHome = () => {
    switch (user.role) {
      case 'hospital_admin':
      case 'super_admin':
        return <AdminHome />;
      case 'doctor':
        return <DoctorHome />;
      case 'nurse':
        return <NurseHome />;
      case 'receptionist':
        return <OPDHome />;
      default:
        return (
          <div className="dashboard-container">
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <ShieldCheck size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
              <h2>Welcome to Bharat Health Bridge</h2>
              <p>Your role ({user.role}) has been authenticated. Please select a module from the sidebar.</p>
            </div>
          </div>
        );
    }
  };

  const getRoleBadge = () => {
    const roles = {
      hospital_admin: { label: 'Admin', color: 'badge-danger' },
      super_admin: { label: 'Super Admin', color: 'badge-danger' },
      doctor: { label: 'Physician', color: 'badge-primary' },
      nurse: { label: 'Head Nurse', color: 'badge-success' },
      receptionist: { label: 'OPD Staff', color: 'badge-warning' },
      pharmacist: { label: 'Pharmacist', color: 'badge-info' }
    };
    const roleData = roles[user.role] || { label: user.role, color: 'badge-primary' };
    return <span className={`badge ${roleData.color}`}>{roleData.label}</span>;
  };

  const getSidebarItems = () => {
    const items = [];
    const role = (user.role || '').toLowerCase();
    
    items.push({
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: user.dashboard || '/doctor',
      allowed: true
    });

    items.push({
      label: 'Emergency',
      icon: <Activity size={20} />,
      path: '/emergency',
      allowed: ['doctor', 'nurse', 'receptionist', 'admin', 'hospital_admin', 'super_admin'].includes(role)
    });

    items.push({
      label: 'Clinical EMR',
      icon: <Stethoscope size={20} />,
      path: '/emr',
      allowed: !!user.permissions?.canViewEMR
    });

    items.push({
      label: 'Patient Queue',
      icon: <ClipboardList size={20} />,
      path: '/queue',
      allowed: ['doctor', 'nurse', 'receptionist', 'admin', 'hospital_admin', 'super_admin'].includes(role)
    });

    items.push({
      label: 'Lab Workspace',
      icon: <Database size={20} />,
      path: '/lab',
      allowed: !!user.permissions?.canUploadLabReports
    });

    items.push({
      label: 'Pharmacy Console',
      icon: <Settings size={20} />,
      path: '/pharmacy',
      allowed: !!user.permissions?.canDispenseMeds
    });

    items.push({
      label: 'Governance',
      icon: <Database size={20} />,
      path: '/governance',
      allowed: !!user.permissions?.canViewAuditLogs
    });

    return items.filter(item => item.allowed);
  };

  const activePath = window.location.pathname;

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar-nav ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="hospital-logo" style={{ padding: '0 1rem' }}>
          <HeartPulse size={32} strokeWidth={2.5} />
          <span>BHARAT<br/>HEALTH</span>
        </div>

        <nav style={{ marginTop: '2.5rem' }}>
          <div className="nav-group">
            <p className="nav-group-label">Hospital Terminal</p>
            <ul className="sidebar-nav-list">
              {getSidebarItems().map((item, idx) => {
                const isActive = activePath.startsWith(item.path);
                return (
                  <li 
                    key={idx} 
                    className={`nav-item ${isActive ? 'active' : ''}`} 
                    onClick={() => navigate(item.path)}
                  >
                    {item.icon} {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button onClick={logout} className="btn-secondary w-full" style={{ justifyContent: 'flex-start' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="system-time">
              <Clock size={14} style={{ marginRight: '6px' }} />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="system-time" style={{ background: 'var(--surface-hover)' }}>
              <Calendar size={14} style={{ marginRight: '6px' }} />
              {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>

          <div className="header-right">
            <div className="notification-bell">
              <Bell size={22} />
              <div className="notification-dot"></div>
            </div>
            
            <div className="user-profile-badge">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-dept">Department of Medicine</span>
              </div>
              {getRoleBadge()}
            </div>
          </div>
        </header>

        <div className="dashboard-content-wrapper">
          {renderRoleSpecificHome()}
        </div>

        {/* Session Warning (Security) */}
        <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 100 }}>
          <div className="badge badge-warning" style={{ backdropFilter: 'blur(10px)', border: '1px solid var(--warning)' }}>
            <ShieldCheck size={14} style={{ marginRight: '6px' }} /> Secure Session Active
          </div>
        </div>
      </main>
    </div>
  );
};

export default UnifiedDashboard;
