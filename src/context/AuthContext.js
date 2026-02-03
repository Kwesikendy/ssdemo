import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Keep loading state
  // Dev Mode State
  const [devMode, setDevMode] = useState(() => localStorage.getItem('devMode'));
  const [showDevModal, setShowDevModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if in development and no mode selected
    if (process.env.NODE_ENV === 'development' && !devMode) {
      setShowDevModal(true);
    }
  }, [devMode]);

  const confirmDevMode = (mode) => {
    setDevMode(mode);
    localStorage.setItem('devMode', mode);
    setShowDevModal(false);

    // Automatically log in as mock user relative to that mode
    // Pass 'mock-auto-login' as email to trigger the mock logic inside login()
    // We already have devMode state updating, but to be safe we can rely on the 'mode' arg or wait for state
    // Actually, login() checks devMode STATE. React state updates are scheduled, so 'devMode' might not be updated yet inside login() if called immediately.
    // However, login() logic checks: (email.startsWith('mock') || devMode).
    // If we pass a special mock email that signifies "use the mode I just picked", we might need to be careful.
    // Better approach: Let's refactor login to accept an explicit mode override or just handle it here.
    // Simplest: just call login with a mock email. 
    // BUT devMode state won't be ready.
    // Let's pass the mode explicitly to login or handle the mock login logic directly here.

    // Let's call login with a special mock email that tells it to use the `mode` passing in.
    // Limitation: login() signature is (email, password).
    // Instead, let's just do the mock login logic RIGHT HERE to avoid race conditions.
    performMockLogin(mode);
  };

  const performMockLogin = async (mode) => {
    console.log(`Doing auto mock login for ${mode} mode`);
    const mockUser = {
      id: 'mock-user-id',
      email: `mock-${mode}@smartscript.com`,
      first_name: 'Dev',
      last_name: 'User',
      role: 'admin',
      credits: mode === 'standard' ? 1000 : 0,
      plan: mode === 'standard' ? 'pro' : 'enterprise',
      tenant_id: 'mock-tenant-id'
    };

    // Simulate network delay
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    setUser(mockUser);
    persistToken('mock-jwt-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    setLoading(false);
    navigate('/dashboard');
  };

  // Helper to persist token and keep axios in sync via interceptors
  const persistToken = (t) => { // Persist token helper
    setToken(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
    // Also set axios default header immediately to avoid any race with interceptors
    try {
      if (t) {
        api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    } catch (e) {
      // noop
    }
  };

  // Fetch current user's profile from /auth/me
  // Fetch current user's profile from /auth/me
  const fetchMe = async () => { // Fetch current user profile
    const currentToken = localStorage.getItem('token');

    // Check for mock token first
    if (currentToken === 'mock-jwt-token' && process.env.NODE_ENV === 'development') {
      console.log('Restoring mock user session');
      const savedMode = localStorage.getItem('devMode') || 'standard';
      const mockUser = {
        id: 'mock-user-id',
        email: `mock-${savedMode}@smartscript.com`,
        first_name: 'Dev',
        last_name: 'User',
        role: 'admin',
        credits: savedMode === 'standard' ? 1000 : 0,
        plan: savedMode === 'standard' ? 'pro' : 'enterprise',
        tenant_id: 'mock-tenant-id'
      };
      setUser(mockUser);
      setLoading(false);
      return;
    }

    try {
      // Explicitly include Authorization header to avoid timing issues
      const res = await api.get('/auth/me', {
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : undefined,
      });
      const payload = res.data && res.data.success ? res.data.data : res.data;
      setUser(payload || null);
    } catch (err) {
      // If unauthorized, clear tokens and user
      if (err.response && err.response.status === 401) {
        persistToken(null);
        localStorage.removeItem('refreshToken');
        setUser(null);
        // don't navigate automatically on mount
      } else {
        console.error('Failed to fetch user profile', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // On mount, if token exists, fetch profile
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    // Mock login if in development and mode is selected OR using mock credentials
    if (process.env.NODE_ENV === 'development' && (email.startsWith('mock') || devMode)) {
      console.log(`Doing mock login in ${devMode} mode`);
      const mockUser = {
        id: 'mock-user-id',
        email: email,
        first_name: 'Dev',
        last_name: 'User',
        role: 'admin',
        credits: devMode === 'standard' ? 1000 : 0,
        plan: devMode === 'standard' ? 'pro' : 'enterprise',
        tenant_id: 'mock-tenant-id'
      };
      // Simulate network delay
      await new Promise(r => setTimeout(r, 500));

      setUser(mockUser);
      persistToken('mock-jwt-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');
      navigate('/dashboard');
      return;
    }

    const res = await api.post('/auth/login', { email, password });
    const tokenData = res.data.data; // Backend returns: { success: true, data: { token: "...", refresh_token: "..." } }
    persistToken(tokenData.token);

    // Store refresh token if provided
    if (tokenData.refresh_token) {
      localStorage.setItem('refreshToken', tokenData.refresh_token);
    }

    // Fetch and set user, then navigate
    await fetchMe();
    navigate('/dashboard');
  };

  const logout = () => {
    persistToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{
      token, user, setUser, login, logout, isAuthenticated: !!token, loading,
      devMode, showDevModal, confirmDevMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
