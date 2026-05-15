import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Calendar, FileText, ShieldAlert, File, Activity, Briefcase, PlusSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import './Login.css';

export default function Login() {
  const [step, setStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [activeTab, setActiveTab] = useState('business');
   const [department, setDepartment] = useState('');

   const departments = [
     "General Medicine", "Cardiology", "Neurology", "Nephrology", 
     "Orthopedics", "ENT", "Dermatology", "Pediatrics", 
     "Gynecology", "Psychiatry", "Radiology", "Oncology", 
     "Pulmonology", "Urology", "Gastroenterology", "Endocrinology", 
     "Ophthalmology", "Emergency", "ICU", "Ventilator Ward", 
     "Trauma", "Surgery", "Pathology", "Laboratory", "Pharmacy"
   ];
   
   const { login } = useAuth();
   const navigate = useNavigate();

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
     setLoading(true);

     const isEmail = employeeId.includes('@');
     const body = {
         password,
         department: (employeeId.toUpperCase().startsWith('DOC') || employeeId.toUpperCase().startsWith('NUR')) ? department : undefined
     };

     if (isEmail) body.email = employeeId;
     else body.employeeId = employeeId.trim().toUpperCase();

     try {
         const res = await fetch(`${API_BASE_URL}/users/login`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(body)
         });
         const data = await res.json();
         
         if (res.ok) {
             setTempUser(data.user);
             setSessionToken(data.token); // Store the JWT token from backend
             setStep(2);
         } else {
             setError(data.error || 'Authentication failed');
         }
     } catch (err) {
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

        login(tempUser, sessionToken);

        const role = tempUser.role.toUpperCase();
        setLoading(false); // Reset loading before navigating or showing error
        
        switch(role) {
           case 'DOCTOR': navigate('/doctor'); break;
           case 'NURSE': navigate('/nurse'); break;
           case 'ADMIN': case 'HOSPITAL_ADMIN': case 'SUPER_ADMIN': navigate('/admin'); break;
           case 'PHARMACIST': navigate('/pharmacy'); break;
           case 'RECEPTIONIST': navigate('/reception'); break;
           case 'LAB_TECHNICIAN': navigate('/lab'); break;
           case 'RADIOLOGY_STAFF': navigate('/radiology'); break;
           case 'ICU_STAFF': navigate('/icu'); break;
           case 'VENTILATOR_STAFF': navigate('/ventilator'); break;
           case 'WARD_STAFF': navigate('/ward'); break;
           default: navigate('/'); break;
        }
     }, 800);
   };

   return (
     <div className="login-wrapper">
        <div className="login-content-split">
            {/* Left Branding Side */}
            <div className="login-branding-side">
                <h1 className="login-branding-title">Bharat Health<br/>Bridge</h1>
                
                <div className="login-branding-features">
                    <div className="login-feature-item stagger-1"><FileText size={20}/> Electronic Medical Records</div>
                    <div className="login-feature-item stagger-2"><Activity size={20}/> Emergency Triage</div>
                    <div className="login-feature-item stagger-3"><Briefcase size={20}/> Bed Management</div>
                    <div className="login-feature-item stagger-1"><PlusSquare size={20}/> Pharmacy & Inventory</div>
                    <div className="login-feature-item stagger-2"><ShieldAlert size={20}/> Role-Based Access Control</div>
                </div>
            </div>

            {/* Right Login Form Side */}
            <div className="login-card-side">
                <div className="login-form-container">
                    <h2 className="login-title">Secure Node Access</h2>
                    <p className="login-subtitle">Enter your credentials to access the medical network.</p>

                    {error && (
                      <div className="login-error-msg animate-fade-in-up">
                        <ShieldAlert size={18} />
                        {error}
                      </div>
                    )}

                    {step === 1 ? (
                    <form onSubmit={handleStep1} className="animate-fade-in-up stagger-1">
                        <div className="login-input-group">
                           <label className="login-label">Operator ID</label>
                           <div className="login-input-wrapper">
                              <input 
                                 type="text" 
                                 required 
                                 className="login-input"
                                 placeholder="Ex: DOC-902, ADM-14" 
                                 value={employeeId} 
                                 onChange={(e) => setEmployeeId(e.target.value)} 
                              />
                           </div>
                        </div>

                        {(employeeId.toUpperCase().startsWith('DOC') || employeeId.toUpperCase().startsWith('NUR')) && (
                           <div className="login-input-group animate-fade-in-up">
                              <label className="login-label">Assigned Ward / Department</label>
                              <div className="login-input-wrapper">
                                 <select 
                                    className="login-input"
                                    required
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    style={{ appearance: 'none', cursor: 'pointer' }}
                                 >
                                    <option value="" disabled>Select Department</option>
                                    {departments.map(dept => (
                                       <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                        )}

                        <div className="login-input-group" style={{marginBottom: '2rem'}}>
                           <label className="login-label">Password</label>
                           <div className="login-input-wrapper">
                              <input 
                                 type="password" 
                                 required 
                                 className="login-input"
                                 placeholder="••••••••" 
                                 value={password} 
                                 onChange={(e) => setPassword(e.target.value)} 
                              />
                           </div>
                        </div>
                        <button type="submit" className="login-submit-btn" disabled={loading}>
                           {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>
                   ) : (
                   <form onSubmit={handleStep2} className="animate-fade-in-up">
                       <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                          We've sent a 6-digit authentication token to your registered device.
                       </p>
                       
                       <div className="login-input-group">
                          <label className="login-label">Secure 2FA Token</label>
                          <div className="otp-input-container">
                             {otp.map((digit, index) => (
                                 <input
                                     key={index}
                                     ref={(el) => (inputRefs.current[index] = el)}
                                     type="text"
                                     className="otp-input-field"
                                     value={digit}
                                     onChange={(e) => handleOtpChange(index, e.target.value)}
                                     onKeyDown={(e) => handleKeyDown(index, e)}
                                     maxLength={1}
                                 />
                             ))}
                          </div>
                       </div>

                       <div style={{ display: 'flex', gap: '1rem' }}>
                          <button type="button" onClick={() => setStep(1)} className="login-submit-btn" style={{ flex: '1', background: 'var(--background)', color: 'var(--text-main)', border: '1px solid var(--border)', boxShadow: 'none' }}>
                             Back
                          </button>
                          <button type="submit" className="login-submit-btn" disabled={loading || otp.join('').length !== 6} style={{ flex: '2' }}>
                             {loading ? 'Verifying...' : 'Authenticate'}
                          </button>
                       </div>
                   </form>
                   )}
               </div>
           </div>
       </div>
    </div>
  );
}
