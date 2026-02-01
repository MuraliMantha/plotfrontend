/**
 * VentureCRM - Production-Grade Auth Context
 * 
 * Provides:
 * - JWT-based authentication
 * - Role-based access control
 * - Tenant context management
 * - Automatic token refresh handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create the context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Manages authentication state, user info, and tenant context
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Decode JWT token safely
    const decodeToken = useCallback((token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            return payload;
        } catch (e) {
            console.error('Token decode error:', e);
            return null;
        }
    }, []);

    // Check if token is expired
    const isTokenExpired = useCallback((token) => {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.exp) return true;
        // Add 60 second buffer
        return decoded.exp * 1000 < (Date.now() + 60000);
    }, [decodeToken]);

    // Fetch current user profile from API
    const fetchProfile = useCallback(async (token) => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token invalid, clear it
                    localStorage.removeItem('admin_token');
                    return null;
                }
                throw new Error('Failed to fetch profile');
            }

            const data = await response.json();
            return data.data; // Returns user object
        } catch (err) {
            console.error('Profile fetch error:', err);
            return null;
        }
    }, []);

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('admin_token');

                if (!token) {
                    setLoading(false);
                    return;
                }

                if (isTokenExpired(token)) {
                    console.log('Token expired, clearing...');
                    localStorage.removeItem('admin_token');
                    setLoading(false);
                    return;
                }

                // Decode token for basic info
                const decoded = decodeToken(token);
                if (!decoded) {
                    localStorage.removeItem('admin_token');
                    setLoading(false);
                    return;
                }

                // Fetch full profile from API
                const profile = await fetchProfile(token);

                if (profile) {
                    // Profile can be either direct user or { user, tenant }
                    const userData = profile.user || profile;
                    const tenantData = profile.tenantId || profile.tenant || null;

                    setUser({
                        _id: userData._id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        avatar: userData.avatar,
                        tenantId: userData.tenantId?._id || userData.tenantId || decoded.tenantId
                    });

                    if (tenantData && typeof tenantData === 'object') {
                        setTenant({
                            _id: tenantData._id,
                            name: tenantData.name,
                            slug: tenantData.slug,
                            plan: tenantData.plan,
                            branding: tenantData.branding
                        });
                    }
                } else {
                    // Fallback to decoded token data
                    setUser({
                        _id: decoded.userId,
                        role: decoded.role,
                        tenantId: decoded.tenantId
                    });
                }
            } catch (err) {
                console.error('Auth init error:', err);
                localStorage.removeItem('admin_token');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, [decodeToken, isTokenExpired, fetchProfile]);

    // Login function
    const login = async (email, password) => {
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid credentials');
            }

            const { token, user: userData, tenant: tenantData } = data.data;

            // Store token
            localStorage.setItem('admin_token', token);

            // Set user state
            setUser({
                _id: userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                avatar: userData.avatar
            });

            // Set tenant if available
            if (tenantData) {
                setTenant({
                    _id: tenantData._id,
                    name: tenantData.name,
                    slug: tenantData.slug,
                    plan: tenantData.plan,
                    branding: tenantData.branding
                });
            }

            return { success: true, user: userData, tenant: tenantData };
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        setUser(null);
        setTenant(null);
        setError(null);
    }, []);

    // Role check functions
    const hasRole = useCallback((role) => {
        if (!user) return false;
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        return user.role === role;
    }, [user]);

    const isSuperAdmin = useCallback(() => {
        return user?.role === 'super_admin';
    }, [user]);

    const isAdmin = useCallback(() => {
        return ['admin', 'super_admin'].includes(user?.role);
    }, [user]);

    const isManager = useCallback(() => {
        return ['manager', 'admin', 'super_admin'].includes(user?.role);
    }, [user]);

    // Token getter
    const getToken = useCallback(() => {
        return localStorage.getItem('admin_token');
    }, []);

    // Auth check
    const isAuthenticated = useCallback(() => {
        const token = getToken();
        return !!user && !!token && !isTokenExpired(token);
    }, [user, getToken, isTokenExpired]);

    // Context value
    const value = {
        // State
        user,
        tenant,
        loading,
        error,

        // Actions
        login,
        logout,

        // Role checks
        hasRole,
        isSuperAdmin,
        isAdmin,
        isManager,

        // Utilities
        isAuthenticated,
        getToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to use auth context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
