import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { resetSocket } from '../lib/socket';

const AuthContext = createContext({
  user: null,
  token: null,
  patientProfileId: null,
  dashboard: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshDashboard: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [patientProfileId, setPatientProfileId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const { getPatientDashboard } = require('../lib/api');
      const data = await getPatientDashboard();
      setDashboard(data);
      if (data?.patient?.id) setPatientProfileId(data.patient.id);
      else if (data?.user?.patientProfileId) setPatientProfileId(data.user.patientProfileId);
      if (data?.user) {
        setUser((prev) => ({ ...prev, ...data.user, patientProfileId: data.patient?.id || data.user.patientProfileId }));
      }
    } catch (err) {
      console.warn('Dashboard refresh failed:', err.message);
    }
  }, [token]);

  useEffect(() => {
    loadStorageData();
  }, []);

  useEffect(() => {
    if (token) refreshDashboard();
  }, [token, refreshDashboard]);

  async function loadStorageData() {
    try {
      const authDataSerialized = await SecureStore.getItemAsync('auth_data');
      if (authDataSerialized) {
        const authData = JSON.parse(authDataSerialized);
        setUser(authData.user);
        setToken(authData.token);
        setPatientProfileId(authData.user?.patientProfileId || null);
      }
    } catch (error) {
      console.error('Failed to load auth data', error);
    } finally {
      setLoading(false);
    }
  }

  const login = async (authData) => {
    setUser(authData.user);
    setToken(authData.token);
    setPatientProfileId(authData.user?.patientProfileId || null);
    await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));
    router.replace('/(tabs)');
  };

  const logout = async () => {
    resetSocket();
    setUser(null);
    setToken(null);
    setPatientProfileId(null);
    setDashboard(null);
    await SecureStore.deleteItemAsync('auth_data');
    try {
      await SecureStore.deleteItemAsync('bypass_dashboard');
    } catch (_) {}
    router.replace('/(auth)/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        patientProfileId,
        dashboard,
        loading,
        login,
        logout,
        refreshDashboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
