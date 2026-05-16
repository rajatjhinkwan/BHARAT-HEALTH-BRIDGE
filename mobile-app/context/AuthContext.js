import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
});

export const AuthProvider = ({ children }) => {
    // TEMPORARY: Bypass login screen by setting a dummy user immediately
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const authDataSerialized = await SecureStore.getItemAsync('auth_data');
            if (authDataSerialized) {
                const _authData = JSON.parse(authDataSerialized);
                setUser(_authData.user);
            }
        } catch (error) {
            console.error('Failed to load auth data', error);
        } finally {
            setLoading(false);
        }
    }

    const login = async (authData) => {
        setUser(authData.user);
        await SecureStore.setItemAsync('auth_data', JSON.stringify(authData));
        router.replace('/(tabs)');
    };

    const logout = async () => {
        setUser(null);
        await SecureStore.deleteItemAsync('auth_data');
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
