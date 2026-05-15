import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, X, Activity, UserCircle, Sun, Moon, LogOut, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onSearch }) {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const styles = {
        nav: {
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--border)',
            padding: '0.75rem 0',
            boxShadow: '0 4px 20px -10px rgba(0,0,0,0.1)'
        },
        container: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1500px',
            margin: '0 auto',
            padding: '0 2.5rem'
        },
        logoLink: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.4rem',
            letterSpacing: '-0.03em',
            textDecoration: 'none',
            zIndex: 60,
            whiteSpace: 'nowrap',
            paddingRight: '1rem'
        },
        desktopMenu: {
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'flex-end'
        },
        mobileMenu: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--background)',
            padding: '6rem 2.5rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            zIndex: 90,
            overflowY: 'auto'
        },
        link: (path) => ({
            fontWeight: location.pathname === path ? 700 : 500,
            color: location.pathname === path ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            position: 'relative',
            padding: '0.5rem 0'
        }),
        mobileLink: (path) => ({
            fontWeight: location.pathname === path ? 700 : 500,
            color: location.pathname === path ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'all 0.2s',
            textDecoration: 'none',
            fontSize: '1.3rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border)'
        }),
        emergencyLink: {
            fontWeight: 700,
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            transition: 'all 0.3s'
        },
        mobileEmergencyLink: {
            fontWeight: 700,
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            padding: '1rem 1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textDecoration: 'none',
            fontSize: '1.1rem',
            justifyContent: 'center',
            marginTop: '1.5rem'
        },
        hamburger: {
            display: 'none',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '0.5rem',
            borderRadius: '10px',
            cursor: 'pointer',
            color: 'var(--text-main)',
            zIndex: 100
        }
    };

    const renderLinks = (isMobile = false) => {
        const linkStyle = isMobile ? styles.mobileLink : styles.link;
        const closeMenu = () => isMobile && setIsOpen(false);
        const role = user?.role?.toUpperCase();

        return (
            <>
                {role === 'DOCTOR' && (
                    <>
                       <Link to="/doctor" style={linkStyle('/doctor')} onClick={closeMenu}>Queue</Link>
                       <Link to="/emr" style={linkStyle('/emr')} onClick={closeMenu}>Clinical EMR</Link>
                       <Link to="/icu" style={linkStyle('/icu')} onClick={closeMenu}>Critical ICU</Link>
                       <Link to="/ventilator" style={linkStyle('/ventilator')} onClick={closeMenu}>Ventilator</Link>
                    </>
                )}

                {role === 'RECEPTIONIST' && (
                    <>
                       <Link to="/register-patient" style={linkStyle('/register-patient')} onClick={closeMenu}>Registration</Link>
                       <Link to="/schedule" style={linkStyle('/schedule')} onClick={closeMenu}>Book Appt</Link>
                       <Link to="/queue" style={linkStyle('/queue')} onClick={closeMenu}>Live Queue</Link>
                       <Link to="/emergency" style={linkStyle('/emergency')} onClick={closeMenu}>ER Entry</Link>
                    </>
                )}

                {role === 'NURSE' && (
                    <>
                       <Link to="/nurse" style={linkStyle('/nurse')} onClick={closeMenu}>Ward Dashboard</Link>
                       <Link to="/nurse-station" style={linkStyle('/nurse-station')} onClick={closeMenu}>Vitals Stn</Link>
                    </>
                )}
                
                {(role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN') && (
                    <>
                       <Link to="/admin" style={linkStyle('/admin')} onClick={closeMenu}>Admin Panel</Link>
                       <Link to="/icu" style={linkStyle('/icu')} onClick={closeMenu}>ICU</Link>
                       <Link to="/ventilator" style={linkStyle('/ventilator')} onClick={closeMenu}>Ventilator</Link>
                       <Link to="/lab" style={linkStyle('/lab')} onClick={closeMenu}>Lab</Link>
                    </>
                )}
            </>
        );
    };


    return (
        <>
            {/* Inline CSS for media query */}
            <style>
                {`
                @media (max-width: 1200px) {
                    .desktop-menu { display: none !important; }
                    .mobile-toggle { display: block !important; }
                }

                .navbar-profile-section {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding-left: 0.75rem;
                    border-left: 1px solid rgba(148, 163, 184, 0.1);
                }

                .profile-badge-group {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    background: var(--surface-hover);
                    padding: 0.5rem 0.65rem 0.5rem 1.25rem;
                    border-radius: 16px;
                    border: 1px solid var(--border);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 10px -5px rgba(0,0,0,0.05);
                }

                .profile-badge-group:hover {
                    border-color: var(--primary);
                    background: var(--surface);
                    box-shadow: 0 8px 30px -10px var(--primary-light);
                    transform: translateY(-1px);
                }

                .profile-text-content {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    line-height: 1.1;
                    margin-right: 0.5rem;
                }

                .profile-name {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: var(--text-main);
                    white-space: nowrap;
                    letter-spacing: -0.01em;
                }

                .profile-dept {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: var(--primary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    opacity: 0.8;
                }
                .profile-avatar-container-btn {
                    padding: 0;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .profile-avatar-container-btn:hover {
                    transform: scale(1.08) rotate(3deg);
                }

                .profile-avatar-container {
                    position: relative;
                    width: 42px;
                    height: 42px;
                }

                .nav-avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 12px;
                    border: 2px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .nav-avatar-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--primary-light) 0%, rgba(14, 165, 233, 0.2) 100%);
                    color: var(--primary);
                    border-radius: 12px;
                    border: 2px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }

                .nav-logout-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    background: var(--surface);
                    color: var(--text-muted);
                    border: 1px solid var(--border);
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.85rem;
                    font-weight: 700;
                }

                .nav-logout-btn:hover {
                    background: var(--danger-light);
                    color: var(--danger);
                    border-color: rgba(239, 68, 68, 0.2);
                    transform: translateY(-1px);
                }

                .link-underline {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: var(--primary);
                    transition: width 0.3s;
                }

                .desktop-menu a:hover .link-underline {
                    width: 100%;
                }
                `}
            </style>

            <nav style={styles.nav} className="no-print">
                <div style={styles.container}>
                    <Link to="/" style={styles.logoLink} onClick={() => setIsOpen(false)}>
                        <Heart fill="var(--primary)" color="var(--primary)" size={32} style={{ filter: 'drop-shadow(0 0 12px var(--primary))' }} />
                        <span>Bharat Health Bridge</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div style={{ ...styles.desktopMenu, marginLeft: '1.5rem' }} className="desktop-menu">
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                           {renderLinks(false)}
                        </div>

                        <Link to="/emergency" style={styles.emergencyLink}>
                            <Activity size={18} /> Emergency
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingLeft: '1.5rem', borderLeft: '2px solid rgba(148,163,184,0.1)' }}>
                           <button
                               onClick={toggleTheme}
                               style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                               className="btn-icon hover-card-effect"
                               title="Toggle Theme"
                           >
                               {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                           </button>

                           <button
                               onClick={onSearch}
                               style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                               className="btn-icon hover-card-effect"
                               title="Global Patient Search"
                           >
                               <Search size={22} />
                           </button>

                           {user ? (
                               <div className="navbar-profile-section">
                                  <div className="profile-badge-group">
                                     <div className="profile-text-content">
                                        <span className="profile-name">{user.name}</span>
                                        <span className="profile-dept">{user.department || 'Medical Staff'}</span>
                                     </div>
                                     <button 
                                        className="profile-avatar-container-btn"
                                        onClick={() => navigate('/profile')}
                                        title="View Profile"
                                     >
                                        <div className="profile-avatar-container">
                                           {user.avatar ? (
                                              <img src={user.avatar} alt="Profile" className="nav-avatar-img" />
                                           ) : (
                                              <div className="nav-avatar-placeholder">
                                                 <UserCircle size={28} />
                                              </div>
                                           )}
                                        </div>
                                     </button>
                                  </div>
                                  <button 
                                     onClick={() => { logout(); navigate('/login'); }} 
                                     className="nav-logout-btn"
                                     title="Logout Session"
                                  >
                                     <LogOut size={18} />
                                     <span>Logout</span>
                                  </button>
                               </div>
                           ) : (
                               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
                                  <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '0.6rem 2rem', borderRadius: '12px', fontSize: '0.95rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                                     Staff Login
                                  </button>
                               </div>
                           )}
                        </div>
                    </div>

                    {/* Mobile Toggle Button */}
                    <button 
                        className="mobile-toggle"
                        style={styles.hamburger} 
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div style={styles.mobileMenu}>
                    {renderLinks(true)}

                    <Link to="/emergency" style={styles.mobileEmergencyLink} onClick={() => setIsOpen(false)}>
                        <Activity size={20} /> Emergency Response
                    </Link>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                        <button
                            onClick={toggleTheme}
                            style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 500 }}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>

                        {user ? (
                            <button 
                                onClick={() => { setIsOpen(false); logout(); navigate('/login'); }} 
                                style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.8rem 1.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 600 }}
                            >
                                Logout
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setIsOpen(false); navigate('/login'); }} 
                                className="btn-primary" 
                                style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', fontSize: '1rem', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
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
