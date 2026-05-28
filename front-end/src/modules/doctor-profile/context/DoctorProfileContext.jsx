import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { doctorApi } from '../services/doctorApi';
import { useAuth } from '../../../context/AuthContext';

const DoctorProfileContext = createContext(null);

export const useDoctorProfile = () => {
  const ctx = useContext(DoctorProfileContext);
  if (!ctx) throw new Error('useDoctorProfile must be used within DoctorProfileProvider');
  return ctx;
};

export function DoctorProfileProvider({ children }) {
  const { user, updateProfile: updateAuthUser } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await doctorApi.getProfile();
      setDoctor(data.doctor);
      if (data.user?.avatar) {
        updateAuthUser({ avatar: data.user.avatar });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load profile';
      if (err.response?.status !== 403) toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [updateAuthUser]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  const updateLocal = useCallback((updater) => {
    setDoctor((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveSection = useCallback(
    async (payload, { silent = false } = {}) => {
      try {
        setSaving(true);
        const { data } = await doctorApi.updateProfile(payload);
        setDoctor(data.doctor);
        setHasUnsavedChanges(false);
        if (data.doctor?.personal?.fullName) {
          updateAuthUser({
            name: data.doctor.personal.fullName,
            specialization: data.doctor.professional?.specialization,
            avatar: data.doctor.profileImage?.url,
          });
        }
        if (!silent) toast.success('Saved successfully');
        return data.doctor;
      } catch (err) {
        toast.error(err.response?.data?.error || 'Save failed');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [updateAuthUser]
  );

  const uploadProfileImage = useCallback(
    async (file) => {
      const preview = URL.createObjectURL(file);
      setDoctor((d) => ({
        ...d,
        profileImage: { ...d?.profileImage, url: preview },
      }));

      try {
        setUploadProgress(0);
        const { data } = await doctorApi.updateImage(file, setUploadProgress);
        setDoctor((d) => ({
          ...d,
          profileImage: data.profileImage,
        }));
        updateAuthUser({ avatar: data.avatar });
        toast.success('Profile photo updated');
        return data;
      } catch (err) {
        await fetchProfile();
        toast.error(err.response?.data?.error || 'Image upload failed');
        throw err;
      } finally {
        setUploadProgress(0);
      }
    },
    [fetchProfile, updateAuthUser]
  );

  const saveAvailability = useCallback(async (availability) => {
    const { data } = await doctorApi.updateAvailability(availability);
    setDoctor((d) => ({ ...d, availability: data.availability }));
    toast.success('Availability updated');
  }, []);

  const saveSettings = useCallback(async (settings) => {
    const { data } = await doctorApi.updateSettings(settings);
    setDoctor((d) => ({ ...d, settings: data.settings }));
    toast.success('Settings saved');
  }, []);

  return (
    <DoctorProfileContext.Provider
      value={{
        doctor,
        user,
        loading,
        saving,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        activeSection,
        setActiveSection,
        uploadProgress,
        fetchProfile,
        updateLocal,
        saveSection,
        uploadProfileImage,
        saveAvailability,
        saveSettings,
        setDoctor,
      }}
    >
      {children}
    </DoctorProfileContext.Provider>
  );
}
