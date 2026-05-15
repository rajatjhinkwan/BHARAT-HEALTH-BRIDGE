import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Camera, Check, X, Save, Edit2, Upload, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const DoctorProfilePanel = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(user?.avatar || '');
    const [isSaving, setIsSaving] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const fileInputRef = useRef(null);

    const avatars = [
        '/images/doctors/Screenshot 2026-05-13 193934.png',
        '/images/doctors/Screenshot 2026-05-13 193937.png',
        '/images/doctors/Screenshot 2026-05-13 193941.png',
        '/images/doctors/Screenshot 2026-05-13 193945.png',
        '/images/doctors/Screenshot 2026-05-13 193948.png',
        '/images/doctors/Screenshot 2026-05-13 193952.png',
        '/images/doctors/Screenshot 2026-05-13 193956.png',
        '/images/doctors/Screenshot 2026-05-13 194003.png',
        '/images/doctors/Screenshot 2026-05-13 194006.png',
        '/images/doctors/Screenshot 2026-05-13 194012.png',
        '/images/doctors/Screenshot 2026-05-13 194025.png',
        '/images/doctors/Screenshot 2026-05-13 194032.png',
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setSelectedAvatar(''); // Clear selected gallery avatar
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGallerySelect = (url) => {
        setSelectedAvatar(url);
        setPreviewUrl(url);
        setSelectedFile(null); // Clear manual file upload
        setShowGallery(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('hospflow_auth_token');
            const formData = new FormData();
            formData.append('name', name);
            
            if (selectedFile) {
                formData.append('avatarFile', selectedFile);
            } else {
                formData.append('avatar', selectedAvatar);
            }

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const updatedUser = await response.json();
                updateProfile(updatedUser);
                onClose();
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Immersive Header */}
                <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl text-white">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Clinical Profile</h2>
                            <p className="text-indigo-100 text-sm">Manage your professional identity</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-10 pb-10 -mt-12">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                        {/* Profile Photo Section */}
                        <div className="md:col-span-5 flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-44 h-44 rounded-[2.5rem] overflow-hidden border-[6px] border-slate-900 shadow-2xl bg-slate-800 ring-1 ring-white/10">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 flex gap-2">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-white text-indigo-600 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                        title="Upload Image"
                                    >
                                        <Upload size={18} />
                                    </button>
                                    <button 
                                        onClick={() => setShowGallery(true)}
                                        className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                        title="Choose from Gallery"
                                    >
                                        <Camera size={18} />
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            
                            <div className="text-center space-y-1">
                                <div className="px-4 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-block">
                                    <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{user?.department || 'Medical Staff'}</span>
                                </div>
                                <p className="text-slate-400 text-xs mt-2 font-medium">Employee ID: <span className="text-slate-300 font-bold">{user?.employeeId}</span></p>
                            </div>
                        </div>

                        {/* Profile Info Section */}
                        <div className="md:col-span-7 space-y-8 pt-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">Professional Name</label>
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 pl-12 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none text-lg font-medium"
                                        placeholder="Dr. Name"
                                    />
                                    <Edit2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Access Level</p>
                                    <p className="text-white font-bold capitalize">{user?.role || 'Clinician'}</p>
                                </div>
                                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verification</p>
                                    <p className="text-emerald-400 font-bold flex items-center gap-1.5">
                                        <Check size={16} /> Verified
                                    </p>
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 text-lg"
                            >
                                {isSaving ? (
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Activity size={24} />
                                    </motion.div>
                                ) : (
                                    <>
                                        <Save size={24} />
                                        Commit Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Ultra-Premium Avatar Gallery */}
                <AnimatePresence>
                    {showGallery && (
                        <motion.div 
                            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                            className="absolute inset-0 bg-slate-900/90 z-20 p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Professional Avatars</h3>
                                    <p className="text-slate-400 text-sm">Choose a pre-defined medical profile photo</p>
                                </div>
                                <button onClick={() => setShowGallery(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
                                {avatars.map((avatar, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleGallerySelect(avatar)}
                                        className={`group relative rounded-[2rem] overflow-hidden border-2 transition-all aspect-square ${previewUrl === avatar ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white/10 hover:border-white/30'}`}
                                    >
                                        <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className={`absolute inset-0 bg-indigo-600/40 flex items-center justify-center transition-opacity ${previewUrl === avatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className="bg-white text-indigo-600 rounded-full p-2 shadow-xl">
                                                <Check size={20} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default DoctorProfilePanel;
