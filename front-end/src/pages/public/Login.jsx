import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Plus,
  Stethoscope,
  Building2,
  FlaskConical,
  Pill,
  ClipboardList,
  UserCog,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import {
  detectLoginProfile,
  DOCTOR_DEPARTMENTS,
  NURSE_DEPARTMENTS,
} from '../../config/staffLoginConfig';
import './Login.css';
import loginDoctorImg from '../../assets/login-doctor.png';

const LOGIN_HERO_IMAGE = loginDoctorImg;

const PROFILE_ICONS = {
  doctor: Stethoscope,
  nurse: Stethoscope,
  receptionist: ClipboardList,
  lab_tech: FlaskConical,
  pharmacist: Pill,
  admin: UserCog,
};

export default function Login() {
  const [step, setStep] = useState(1);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const heroVisualRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [department, setDepartment] = useState('');

  const loginProfile = useMemo(() => detectLoginProfile(employeeId), [employeeId]);
  const showDept = loginProfile?.needsDepartment === true;
  const deptOptions =
    loginProfile?.roleKey === 'nurse' ? NURSE_DEPARTMENTS : DOCTOR_DEPARTMENTS;
  const ProfileIcon = loginProfile
    ? PROFILE_ICONS[loginProfile.roleKey] || Stethoscope
    : Stethoscope;

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const zone = heroVisualRef.current;
    if (!zone) return undefined;

    const introTimer = requestAnimationFrame(() => {
      zone.classList.add('login-branding-visual--entered');
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      return () => {
        cancelAnimationFrame(introTimer);
        zone.classList.remove('login-branding-visual--entered');
      };
    }

    const reset = () => {
      zone.style.setProperty('--mouse-x', '0');
      zone.style.setProperty('--mouse-y', '0');
    };

    const onMove = (e) => {
      const rect = zone.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      zone.style.setProperty('--mouse-x', nx.toFixed(4));
      zone.style.setProperty('--mouse-y', ny.toFixed(4));
    };

    zone.addEventListener('mousemove', onMove);
    zone.addEventListener('mouseleave', reset);

    return () => {
      cancelAnimationFrame(introTimer);
      zone.removeEventListener('mousemove', onMove);
      zone.removeEventListener('mouseleave', reset);
      zone.classList.remove('login-branding-visual--entered');
    };
  }, []);

  useEffect(() => {
    if (!showDept) setDepartment('');
  }, [showDept]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    if (showDept && !department) {
      setError(`Please select your ${loginProfile?.departmentLabel || 'department'}.`);
      return;
    }
    setLoading(true);
    const isEmail = employeeId.includes('@');
    const body = {
      password,
      department: showDept ? department : undefined,
    };
    if (isEmail) body.email = employeeId;
    else body.employeeId = employeeId.trim().toUpperCase();
    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setTempUser(data.user);
        setSessionToken(data.token);
        setStep(2);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const otpToken = otp.join('');
    setTimeout(() => {
      if (otpToken.length !== 6 || isNaN(otpToken)) {
        setError('Invalid 2FA Token. Please enter all 6 digits.');
        setLoading(false);
        return;
      }
      const userWithId = { ...tempUser, _id: tempUser.id || tempUser._id };
      login(userWithId, sessionToken);
      const role = tempUser.role.toUpperCase();
      setLoading(false);
      switch (role) {
        case 'DOCTOR':
        case 'MEDICAL_DIRECTOR':
          navigate('/doctor');
          break;
        case 'NURSE':
          navigate(
            userWithId.assignedWard === 'ICU' || userWithId.department === 'ICU'
              ? '/icu'
              : '/nurse-station'
          );
          break;
        case 'ADMIN':
        case 'HOSPITAL_ADMIN':
        case 'SUPER_ADMIN':
          navigate('/admin');
          break;
        case 'PHARMACIST':
        case 'PHARMACY_MANAGER':
          navigate('/pharmacy');
          break;
        case 'RECEPTIONIST':
          navigate('/reception');
          break;
        case 'LAB_TECH':
        case 'LAB_TECHNICIAN':
          navigate('/lab');
          break;
        case 'ICU_STAFF':
          navigate('/icu');
          break;
        case 'VENTILATOR_STAFF':
          navigate('/ventilator');
          break;
        default:
          navigate('/');
          break;
      }
    }, 100);
  };

  return (
    <div className="login-wrapper">
      <div className="login-content-split">
        <aside className="login-branding-side" aria-label="Hospital staff platform">
          <svg className="login-branding-waves" viewBox="0 0 140 80" fill="none" aria-hidden="true">
            <path d="M0 40 Q35 8 70 40 T140 40" stroke="#0066ff" strokeWidth="2" fill="none" opacity="0.4" />
            <path d="M0 55 Q40 25 80 55 T140 55" stroke="#0066ff" strokeWidth="1.5" fill="none" opacity="0.25" />
          </svg>
          <div className="login-branding-stars" aria-hidden="true">
            <Sparkles size={18} className="login-star" />
            <Sparkles size={14} className="login-star" />
          </div>

          <p className="login-staff-eyebrow">
            <Building2 size={14} aria-hidden="true" />
            Authorized hospital staff only
          </p>
          <h1 className="login-branding-title">
            {loginProfile
              ? `${loginProfile.label} Portal — ${loginProfile.portal}`
              : 'Unified Clinical Command Center'}
          </h1>

          <div
            ref={heroVisualRef}
            className="login-branding-visual login-branding-visual--interactive"
          >
            <div className="login-hero-glow" aria-hidden="true" />
            <div className="login-hero-stage login-hero-stage--parallax">
              <div className="login-blue-card login-blue-card--motion" aria-hidden="true">
                <span className="login-blue-splash login-blue-splash--1" aria-hidden="true" />
                <span className="login-blue-splash login-blue-splash--2" aria-hidden="true" />
                <span className="login-blue-splash login-blue-splash--3" aria-hidden="true" />
                <span className="login-blue-shimmer" aria-hidden="true" />
              </div>
              {!heroImgFailed ? (
                <img
                  src={LOGIN_HERO_IMAGE}
                  alt="Hospital clinical staff"
                  className="login-doctor-img login-doctor-popout login-doctor--motion"
                  width={480}
                  height={640}
                  decoding="async"
                  onError={() => setHeroImgFailed(true)}
                />
              ) : (
                <div className="login-doctor-fallback login-doctor-popout" aria-hidden="true">
                  <ProfileIcon size={72} strokeWidth={1.25} />
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="login-card-side" aria-label="Staff login">
          <div className="login-logo-row">
            <div className="login-logo-icon" aria-hidden="true">
              <Plus size={22} strokeWidth={3} />
            </div>
            <span className="login-logo-text">Bharat Health Bridge</span>
          </div>

          <div className="login-form-container">
            <h2 className="login-title">Staff login</h2>
            <p className="login-subtitle">
              Sign in to your staff account.
            </p>

            {error && (
              <div className="login-error-msg" role="alert">
                <ShieldAlert size={18} aria-hidden="true" />
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1}>
                <div className="login-input-group">
                  <label className="login-label" htmlFor="login-operator-id">
                    Operator ID
                  </label>
                  <div className="login-input-composite">
                    <span className="login-input-prefix">ID</span>
                    <input
                      id="login-operator-id"
                      type="text"
                      required
                      className="login-input"
                      placeholder={
                        loginProfile?.placeholder || 'e.g. DOC-GEN-123'
                      }
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                  {loginProfile && (
                    <p className="login-role-hint">
                      <ProfileIcon size={14} />
                      Role: <strong>{loginProfile.label}</strong>
                    </p>
                  )}
                </div>

                {showDept && (
                  <div className="login-input-group">
                    <label className="login-label" htmlFor="login-department">
                      {loginProfile?.departmentLabel || 'Department'}
                    </label>
                    <select
                      id="login-department"
                      className="login-input"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      style={{ appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="" disabled>
                        Select {loginProfile?.roleKey === 'nurse' ? 'ward' : 'department'}
                      </option>
                      {deptOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="login-input-group">
                  <label className="login-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="login-input-with-icon">
                    <Lock size={18} className="login-input-icon-left" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="login-input"
                      placeholder="Hospital password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign in'}
                </button>

              </form>
            ) : (
              <form onSubmit={handleStep2}>
                <p className="login-otp-hint">
                  Enter verification code for <strong>{tempUser?.name}</strong>.
                </p>
                <div className="login-input-group">
                  <label className="login-label">Secure 2FA token</label>
                  <div className="otp-input-container">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        className="otp-input-field"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="login-otp-actions">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="login-submit-btn login-back-btn"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="login-submit-btn"
                    disabled={loading || otp.join('').length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Authenticate'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
