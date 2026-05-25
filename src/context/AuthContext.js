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

  const confirmDevMode = (mode, liveEmail, livePassword) => {
    setDevMode(mode);
    localStorage.setItem('devMode', mode);
    setShowDevModal(false);

    if (mode === 'live') {
      // Do a REAL login against the backend
      performLiveLogin(liveEmail || 'admin@smartscript.com', livePassword || 'demo1234');
    } else {
      performMockLogin(mode);
    }
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

  const performLiveLogin = async (email, password) => {
    console.log('Performing live backend login...');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const tokenData = res.data.data;
      persistToken(tokenData.token);
      if (tokenData.refresh_token) {
        localStorage.setItem('refreshToken', tokenData.refresh_token);
      }
      const userPayload = tokenData.user || null;
      setUser(userPayload);
      navigate('/dashboard');
    } catch (err) {
      console.error('Live login failed:', err);
      // Fallback to standard mock if backend unreachable
      performMockLogin('standard');
    } finally {
      setLoading(false);
    }
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
    // But NOT if mode is 'live'
    if (process.env.NODE_ENV === 'development' && devMode !== 'live' && (email.startsWith('mock') || devMode)) {
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
