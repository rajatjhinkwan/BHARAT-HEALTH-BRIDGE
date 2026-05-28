import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Heart, Menu, X, Activity, UserCircle, Sun, Moon, LogOut, Search,
  ChevronDown, HeartPulse, Wind, Network, AlertTriangle, Stethoscope, 
  List, TestTube, Pill, Server, UserCog, Scan
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isOversightRole } from '../utils/roles';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar({ onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClinicalDropdownOpen, setIsClinicalDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const role = user?.role?.toUpperCase();
  const isActive = (path) => location.pathname === path;

  const navLinks = [];
  const dropdownLinks = [];
  const desktopLinks = [];

  if (role === 'DOCTOR' || role === 'MEDICAL_DIRECTOR') {
    const isRad = (user?.department || '').toLowerCase() === 'radiology';
    const doctorItems = isRad
      ? [
          { to: '/radiology', label: 'Radiology' },
          { to: '/emr', label: 'EMR' },
          { to: '/doctor', label: 'OPD Queue' },
        ]
      : [
          { to: '/doctor', label: 'Queue' },
          { to: '/emr', label: 'EMR' },
          { to: '/icu', label: 'ICU' },
          { to: '/ventilator', label: 'Ventilator' },
        ];
    navLinks.push(...doctorItems);
    desktopLinks.push(...doctorItems);
  }

  if (role === 'RECEPTIONIST') {
    const receptionItems = [
      { to: '/register-patient', label: 'Registration' },
      { to: '/schedule', label: 'Book Appt' },
      { to: '/queue', label: 'Live Queue' },
    ];
    navLinks.push(...receptionItems);
    desktopLinks.push(...receptionItems);
  }

  if (role === 'NURSE') {
    const nurseItems = [
      { to: '/nurse', label: 'Ward' },
      { to: '/nurse-station', label: 'Nurse Station' },
      { to: '/icu', label: 'ICU' },
      { to: '/ventilator', label: 'Ventilator' },
      { to: '/emergency/boards', label: 'ER Boards' },
    ];
    if ((user?.department || '').toLowerCase() === 'radiology') {
      nurseItems.unshift({ to: '/radiology', label: 'Radiology' });
    }
    navLinks.push(...nurseItems);
    desktopLinks.push(...nurseItems);
  }

  if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN' || isOversightRole(role)) {
    navLinks.push(
      { to: '/admin', label: 'Admin Portal' },
      { to: '/live-feed', label: 'Live Feed' },
      { to: '/nurse-station', label: 'Nurse Station' },
      { to: '/icu', label: 'ICU' },
      { to: '/ventilator', label: 'Ventilator' },
      { to: '/emergency', label: 'Emergency' },
      { to: '/emergency/boards', label: 'ER Boards' },
      { to: '/emr', label: 'EMR' },
      { to: '/queue', label: 'Queue' },
      { to: '/lab', label: 'Laboratory' },
      { to: '/radiology', label: 'Radiology' },
      { to: '/pharmacy', label: 'Pharmacy' },
      { to: '/machines', label: 'Equipment' },
      { to: '/hr', label: 'HR' },
      { to: '/shifts', label: 'Shift Roster' },
    );
    
    desktopLinks.push(
      { to: '/admin', label: 'Admin Portal' },
      { to: '/live-feed', label: 'Live Feed' },
    );

    dropdownLinks.push(
      { to: '/nurse-station', label: 'Nurse Station', icon: Network },
      { to: '/icu', label: 'ICU Monitoring', icon: HeartPulse },
      { to: '/ventilator', label: 'Ventilator Unit', icon: Wind },
      { to: '/emergency/boards', label: 'ER Boards', icon: AlertTriangle },
      { to: '/emr', label: 'Clinical EMR', icon: Stethoscope },
      { to: '/queue', label: 'Live Queue', icon: List },
      { to: '/lab', label: 'Laboratory OS', icon: TestTube },
      { to: '/radiology', label: 'Radiology OS', icon: Scan },
      { to: '/pharmacy', label: 'Pharmacy OS', icon: Pill },
      { to: '/machines', label: 'Equipment Tracking', icon: Server },
      { to: '/hr', label: 'HR & Attendance', icon: UserCog },
      { to: '/shifts', label: 'Shift Roster', icon: UserCog },
    );
  }

  const closeMenu = () => setIsOpen(false);

  const linkClass = (path) =>
    `app-navbar__link${isActive(path) ? ' is-active' : ''}`;

  const mobileLinkClass = (path) =>
    `app-navbar__mobile-link${isActive(path) ? ' is-active' : ''}`;

  return (
    <>
      <nav className="app-navbar no-print">
        <div className="app-navbar__inner">
          <Link to="/" className="app-navbar__logo" onClick={closeMenu} title="Bharat Health Bridge">
            <span className="app-navbar__logo-mark" aria-hidden>
              <Heart fill="var(--primary)" color="var(--primary)" size={26} />
            </span>
            <span className="app-navbar__logo-text">
              <span className="app-navbar__logo-title">Bharat Health Bridge</span>
            </span>
          </Link>

          <div className="app-navbar__desktop">
            <div className="app-navbar__links">
              {desktopLinks.map(({ to, label }) => (
                <Link key={to} to={to} className={linkClass(to)}>
                  {label}
                </Link>
              ))}

              {dropdownLinks.length > 0 && (
                <div 
                  className="app-navbar__dropdown-container"
                  onMouseEnter={() => setIsClinicalDropdownOpen(true)}
                  onMouseLeave={() => setIsClinicalDropdownOpen(false)}
                >
                  <button 
                    type="button" 
                    className={`app-navbar__link app-navbar__dropdown-trigger ${isClinicalDropdownOpen ? 'is-active' : ''}`}
                    onClick={() => setIsClinicalDropdownOpen(!isClinicalDropdownOpen)}
                  >
                    Clinical Modules <ChevronDown size={14} className="dropdown-arrow" />
                  </button>
                  {isClinicalDropdownOpen && (
                    <div className="app-navbar__dropdown-menu">
                      {dropdownLinks.map(({ to, label, icon: Icon }) => (
                        <Link 
                          key={to} 
                          to={to} 
                          className={`app-navbar__dropdown-item ${isActive(to) ? 'is-active' : ''}`}
                          onClick={() => setIsClinicalDropdownOpen(false)}
                        >
                          <Icon size={16} className="dropdown-item-icon" />
                          <span>{label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link to="/emergency" className="app-navbar__link--emergency">
              <Activity size={18} className="app-navbar__emergency-icon" />
              <span className="app-navbar__emergency-text">Emergency</span>
            </Link>
          </div>

          <div className="app-navbar__actions">
            <button
              type="button"
              className="app-navbar__icon-btn"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {onSearch && (
              <button
                type="button"
                className="app-navbar__icon-btn"
                onClick={onSearch}
                title="Search patients"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            )}

            {user ? (
              <>
                <div className="app-navbar__profile">
                  <div className="app-navbar__profile-text">
                    <span className="app-navbar__profile-name" title={user.name}>
                      {user.name}
                    </span>
                    <span className="app-navbar__profile-dept" title={user.department}>
                      {user.department || 'Staff'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="app-navbar__avatar-btn"
                    onClick={() => navigate(['doctor', 'medical_director'].includes((user.role || '').toLowerCase()) ? '/doctor/profile' : '/profile')}
                    title="Profile"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="app-navbar__avatar" />
                    ) : (
                      <div className="app-navbar__avatar-placeholder">
                        <UserCircle size={22} />
                      </div>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  className="app-navbar__logout"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="app-navbar__logout-label">Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="app-navbar__login-btn"
                onClick={() => navigate('/login')}
              >
                Staff Login
              </button>
            )}

            <button
              type="button"
              className="app-navbar__menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="app-navbar__mobile-panel">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className={mobileLinkClass(to)} onClick={closeMenu}>
              {label}
            </Link>
          ))}
          <Link
            to="/emergency"
            className="app-navbar__mobile-link"
            style={{ color: 'var(--danger)' }}
            onClick={closeMenu}
          >
            Emergency
          </Link>

          <div className="app-navbar__mobile-footer">
            <button type="button" className="app-navbar__icon-btn" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {theme === 'dark' ? ' Light' : ' Dark'}
            </button>
            {user ? (
              <button
                type="button"
                className="app-navbar__logout"
                onClick={() => {
                  closeMenu();
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button
                type="button"
                className="app-navbar__login-btn"
                onClick={() => {
                  closeMenu();
                  navigate('/login');
                }}
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
