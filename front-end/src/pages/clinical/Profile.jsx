import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, MapPin, Camera, Save, ArrowLeft, ShieldCheck, Heart, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';
import { API_BASE_URL } from '../../config';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        gender: user?.gender || '',
        specialization: user?.specialization || '',
        department: user?.department || '',
        employeeId: user?.employeeId || ''
    });

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const data = new FormData();
        data.append('name', formData.name);
        data.append('dob', formData.dob);
        data.append('gender', formData.gender);
        data.append('specialization', formData.specialization);
        if (avatarFile) {
            data.append('avatarFile', avatarFile);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('hospflow_auth_token')}`
                },
                body: data
            });

            const updatedUser = await res.json();
            if (res.ok) {
                updateProfile(updatedUser);
                setMessage('Profile updated successfully!');
            } else {
                setMessage(updatedUser.error || 'Failed to update profile');
            }
        } catch (err) {
            setMessage('Network error. Failed to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page-container animate-fade-in">
            <div className="profile-header-banner">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="banner-content">
                    <h1>Clinical Identity</h1>
                    <p>Manage your professional profile and credentials</p>
                </div>
            </div>

            <div className="profile-content-grid">
                <aside className="profile-sidebar">
                    <div className="avatar-card">
                        <div className="avatar-upload-wrapper">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Profile" className="large-avatar" />
                            ) : (
                                <div className="large-avatar-placeholder">
                                    <UserCircle size={80} />
                                </div>
                            )}
                            <label htmlFor="avatar-input" className="avatar-edit-btn">
                                <Camera size={20} />
                                <input 
                                    id="avatar-input" 
                                    type="file" 
                                    hidden 
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                            </label>
                        </div>
                        <h2 className="profile-full-name">{formData.name}</h2>
                        <span className="profile-role-badge">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                    </div>

                    <div className="professional-meta-card">
                        <div className="meta-item">
                            <Briefcase size={18} />
                            <div>
                                <label>Department</label>
                                <span>{formData.department || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="meta-item">
                            <Heart size={18} />
                            <div>
                                <label>Specialization</label>
                                <span>{formData.specialization || 'General Practice'}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="profile-form-area">
                    <form onSubmit={handleSubmit} className="premium-form">
                        <section className="form-section">
                            <h3 className="section-title">Personal Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <div className="input-with-icon">
                                        <User size={18} />
                                        <input 
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Employee ID</label>
                                    <div className="input-with-icon disabled">
                                        <ShieldCheck size={18} />
                                        <input value={formData.employeeId} disabled />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} />
                                        <input 
                                            type="date"
                                            name="dob" 
                                            value={formData.dob} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="form-section">
                            <h3 className="section-title">Professional Info</h3>
                            <div className="form-group full-width">
                                <label>Clinical Specialization</label>
                                <div className="input-with-icon">
                                    <Briefcase size={18} />
                                    <input 
                                        name="specialization" 
                                        value={formData.specialization} 
                                        onChange={handleChange} 
                                        placeholder="e.g. Senior Cardiovascular Surgeon"
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="form-footer">
                            {message && (
                                <div className={`status-msg ${message.includes('success') ? 'success' : 'error'}`}>
                                    {message}
                                </div>
                            )}
                            <button type="submit" className="save-profile-btn" disabled={loading}>
                                {loading ? 'Updating...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}
