import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage if available
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('hospflow_auth_user');
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    const login = (userData, token) => {
        const normalized = { ...userData, _id: userData._id || userData.id };
        setUser(normalized);
        localStorage.setItem('hospflow_auth_user', JSON.stringify(normalized));
        if (token) {
            localStorage.setItem('hospflow_auth_token', token);
        }
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('hospflow_auth_user');
        localStorage.removeItem('hospflow_auth_token');
    };

    const updateProfile = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('hospflow_auth_user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
