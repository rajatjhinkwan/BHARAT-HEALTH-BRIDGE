import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ToggleSwitch from '../components/ToggleSwitch';
import { useDoctorProfile } from '../context/DoctorProfileContext';
import { doctorApi } from '../services/doctorApi';
import { passwordSchema, getPasswordStrength } from '../utils/validation';

export default function SecuritySection() {
  const { doctor, setDoctor } = useDoctorProfile();
  const security = doctor?.security || {};
  const [twoFa, setTwoFa] = useState(security.twoFactorEnabled);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(passwordSchema),
  });

  const newPass = watch('newPassword') || '';
  const strength = getPasswordStrength(newPass);

  const onPasswordChange = async (data) => {
    await doctorApi.updatePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    toast.success('Password updated');
  };

  const toggle2FA = async (enabled) => {
    setTwoFa(enabled);
    const { data } = await doctorApi.updateSecurity({ twoFactorEnabled: enabled });
    setDoctor((d) => ({ ...d, security: data.security }));
    toast.success(enabled ? '2FA enabled' : '2FA disabled');
  };

  const logoutAll = async () => {
    await doctorApi.updateSecurity({ logoutAllDevices: true });
    toast.success('All other sessions revoked');
  };

  return (
    <motion.div className="dhp-section-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="dhp-section-header">
        <h2><Shield size={20} /> Security Settings</h2>
      </div>

      <form onSubmit={handleSubmit(onPasswordChange)} className="dhp-form-grid" style={{ marginBottom: '2rem' }}>
        <h3 style={{ gridColumn: '1/-1', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} /> Change Password
        </h3>
        <div className="dhp-field">
          <label>Current Password</label>
          <input type="password" {...register('currentPassword')} className={errors.currentPassword ? 'error' : ''} />
          {errors.currentPassword && <span className="dhp-field-error">{errors.currentPassword.message}</span>}
        </div>
        <div className="dhp-field">
          <label>New Password</label>
          <input type="password" {...register('newPassword')} className={errors.newPassword ? 'error' : ''} />
          {errors.newPassword && <span className="dhp-field-error">{errors.newPassword.message}</span>}
        </div>
        <div className="dhp-field">
          <label>Confirm Password</label>
          <input type="password" {...register('confirmPassword')} className={errors.confirmPassword ? 'error' : ''} />
          {errors.confirmPassword && <span className="dhp-field-error">{errors.confirmPassword.message}</span>}
        </div>
        <div className="dhp-field full-width">
          <div className="dhp-password-strength">
            <div
              className="dhp-password-strength-fill"
              style={{
                width: `${strength.percent}%`,
                background: strength.score < 2 ? '#ef4444' : strength.score < 3 ? '#f59e0b' : '#10b981',
              }}
            />
          </div>
          <span className="dhp-char-count">Strength: {strength.label}</span>
        </div>
        <button type="submit" className="dhp-btn dhp-btn-primary">Update Password</button>
      </form>

      <div className="dhp-toggle-row">
        <div className="dhp-toggle-info"><h4>Two-Factor Authentication</h4><p>Extra security for your account</p></div>
        <ToggleSwitch id="2fa" checked={twoFa} onChange={toggle2FA} />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button type="button" className="dhp-btn dhp-btn-ghost" onClick={logoutAll}>Logout All Devices</button>
      </div>

      <h4 style={{ marginTop: '2rem' }}>Recent Login Activity</h4>
      <ul className="dhp-timeline">
        {(security.loginActivity || []).slice(0, 5).map((log, i) => (
          <li key={i}>
            <span className="dhp-timeline-dot" />
            <div>
              <strong>{log.device?.slice(0, 40) || 'Unknown device'}</strong>
              <br />
              <small>{log.ip} · {new Date(log.at).toLocaleString()}</small>
            </div>
          </li>
        ))}
        {!security.loginActivity?.length && <li>No login history yet</li>}
      </ul>
    </motion.div>
  );
}
