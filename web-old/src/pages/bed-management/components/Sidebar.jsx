import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, UserPlus,
  ArrowRightLeft, UserMinus, BarChart2, Shield, ChevronDown, Check
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

const navItems = [
  { label: 'Dashboard',   path: '/beds',            icon: LayoutDashboard },
  { label: 'Bed Tracking',path: '/beds/tracking',    icon: BedDouble },
  { label: 'Admissions',  path: '/beds/admissions',  icon: UserPlus },
  { label: 'Transfers',   path: '/beds/transfers',   icon: ArrowRightLeft },
  { label: 'Discharge',   path: '/beds/discharge',   icon: UserMinus },
  { label: 'Reports',     path: '/beds/reports',     icon: BarChart2 },
];

const roles = [
  { id: 'All', label: 'Admin (All Wards)' },
  { id: 'Neuro', label: 'Neuro Nurse' },
  { id: 'Nephro', label: 'Nephro Nurse' },
  { id: 'Ortho', label: 'Ortho Nurse' },
  { id: 'Cardio', label: 'Cardio Nurse' },
  { id: 'General', label: 'General Nurse' },
  { id: 'ICU', label: 'ICU Nurse' },
  { id: 'Maternity', label: 'Maternity Nurse' },
  { id: 'Emergency', label: 'Emergency Nurse' },
  { id: 'Pediatrics', label: 'Pediatric Nurse' }
];

const Sidebar = () => {
  const { stats, isConnected, activeWardView, setActiveWardView } = useHospital();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeRoleLabel = roles.find(r => r.id === activeWardView)?.label || 'Admin (All Wards)';

  return (
    <div className="sidebar">
      {/* Premium Role Simulator Dropdown */}
      <div style={{ padding: '1.25rem', paddingBottom: '0' }}>
        <div style={{ marginBottom: '0.5rem', position: 'relative' }} ref={dropdownRef}>
          <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Shield size={12} color="var(--primary-light)" />
            Role Simulator
          </label>
          
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: isDropdownOpen ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.06)',
              color: isDropdownOpen ? '#fff' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${isDropdownOpen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: isDropdownOpen ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontSize: '0.875rem', fontWeight: 600
            }}
          >
            <span>{activeRoleLabel}</span>
            <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </div>

          {isDropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '0.5rem',
              zIndex: 50,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              maxHeight: '220px', overflowY: 'auto'
            }}>
              {roles.map(role => (
                <div 
                  key={role.id}
                  onClick={() => {
                    setActiveWardView(role.id);
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: activeWardView === role.id ? '#fff' : 'rgba(255,255,255,0.7)',
                    background: activeWardView === role.id ? 'var(--primary)' : 'transparent',
                    fontSize: '0.875rem', fontWeight: activeWardView === role.id ? 600 : 500,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeWardView !== role.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeWardView !== role.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }
                  }}
                >
                  {role.label}
                  {activeWardView === role.id && <Check size={14} color="#fff" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live occupancy pill */}
      <div style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Occupancy
          </span>
          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800 }}>
            {stats.occupied}/{stats.total} beds
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/beds'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={18} />
            {label}
            {label === 'Admissions' && stats.available > 0 && (
              <span className="sidebar-badge">{stats.available}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{
          fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)',
          textAlign: 'center', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ 
              display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', 
              backgroundColor: isConnected ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
              boxShadow: isConnected ? '0 0 8px #10b981' : 'none'
            }} />
            {isConnected ? 'Database Synchronized' : 'Offline / Sync Error'}
          </div>
          <div>Clinical Node v2.0 • Data Integrity Validated</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
