// src/components/AuthWrapper.jsx
// Wrapper component that persists authentication across refreshes

import { useState, useEffect } from 'react';
import { auth } from '../utils/auth';

export function AuthWrapper({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restore user from localStorage on mount
        const storedUser = auth.getUser();
        if (storedUser && auth.isAuthenticated()) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const handleLogin = (token, userData) => {
        auth.login(token, userData);
        setUser(userData);
    };

    const handleLogout = () => {
        auth.logout();
        setUser(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-100 via-indigo-100 to-cyan-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    // Clone children and pass auth props
    return children({
        user,
        isAuthenticated: !!user,
        login: handleLogin,
        logout: handleLogout
    });
}
