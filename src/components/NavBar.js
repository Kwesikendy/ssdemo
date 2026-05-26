import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Home,
  Upload,
  AlertTriangle,
  Cpu,
  BarChart3,
  FileText,
  Users,
  Menu,
  X,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../api/axios';

export default function NavBar() {
  const { logout, user, devMode } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotificationsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAnomalyCount = async () => {
    try {
      const { data } = await api.get('/anomalies/groups');
      const total = data.data?.reduce((sum, g) => sum + (g.anomaly_count || 0), 0) || 0;
      setAnomalyCount(total);
    } catch (e) {}
  };

  useEffect(() => { if (user) fetchAnomalyCount(); }, [user]);
  useEffect(() => { if (user && location.pathname === '/anomalies') fetchAnomalyCount(); }, [location.pathname]);
  useEffect(() => {
    const h = () => fetchAnomalyCount();
    window.addEventListener('anomalyResolved', h);
    window.addEventListener('anomalyCreated', h);
    return () => { window.removeEventListener('anomalyResolved', h); window.removeEventListener('anomalyCreated', h); };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Uploads', href: '/uploads', icon: Upload },
    { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle, badge: anomalyCount },
    { name: 'Marking', href: '/marking', icon: Cpu },
    { name: 'Results', href: '/results', icon: BarChart3 },
    { name: 'Schemes', href: '/schemes', icon: FileText },
    { name: 'Groups', href: '/groups', icon: Users },
  ];

  const isActive = (href) => location.pathname.startsWith(href) && (href !== '/dashboard' || location.pathname === '/dashboard');

  const userInitials = user
    ? `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <>
      <nav
        style={{
          background: scrolled
            ? 'rgba(10, 17, 40, 0.97)'
            : 'linear-gradient(135deg, #0a1128 0%, #0d1b3e 60%, #0a2a4a 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 232, 0.12)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/dashboard" className="flex-shrink-0 flex items-center gap-3 group">
              <img
                src="/logo.jpg"
                alt="SmartScript"
                className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110"
                style={{ mixBlendMode: 'multiply' }}
              />
              <div className="flex flex-col leading-none">
                <span style={{
                  background: 'linear-gradient(90deg, #00d4e8, #4fc3f7, #e0f7ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}>
                  SmartScript
                </span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(0,212,232,0.6)', letterSpacing: '0.12em', fontWeight: 500 }}>
                  AI MARKING
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: active ? '#00d4e8' : 'rgba(180,210,240,0.8)',
                      background: active
                        ? 'rgba(0,212,232,0.1)'
                        : 'transparent',
                      border: active
                        ? '1px solid rgba(0,212,232,0.2)'
                        : '1px solid transparent',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#e0f7ff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'rgba(180,210,240,0.8)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                    {active && (
                      <span style={{
                        position: 'absolute',
                        bottom: '-1px',
                        left: '20%',
                        width: '60%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, #00d4e8, transparent)',
                        borderRadius: '2px',
                      }} />
                    )}
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        borderRadius: '999px',
                        minWidth: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        boxShadow: '0 2px 8px rgba(255,71,87,0.5)',
                        animation: 'pulse 2s infinite',
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false); }}
                  className="relative p-2 rounded-lg transition-all duration-200"
                  style={{
                    color: 'rgba(180,210,240,0.8)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      background: 'linear-gradient(135deg, #00d4e8, #0099aa)',
                      color: '#0a1128',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 2px 8px rgba(0,212,232,0.5)',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '320px',
                    background: 'linear-gradient(135deg, #0d1b3e, #0a2a4a)',
                    border: '1px solid rgba(0,212,232,0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,212,232,0.05)',
                    overflow: 'hidden',
                    zIndex: 100,
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(0,212,232,0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ color: '#e0f7ff', fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => { markAllAsRead(); setIsNotificationsOpen(false); }}
                          style={{ color: '#00d4e8', fontSize: '0.75rem', fontWeight: 500 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(180,210,240,0.5)', fontSize: '0.875rem' }}>
                          No notifications
                        </div>
                      ) : notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { if (!n.is_read && !n.read) markAsRead(n.id); }}
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            background: (!n.is_read && !n.read) ? 'rgba(0,212,232,0.06)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.8125rem', color: (!n.is_read && !n.read) ? '#e0f7ff' : 'rgba(180,210,240,0.7)', fontWeight: (!n.is_read && !n.read) ? 600 : 400, margin: 0 }}>
                              {n.title}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(180,210,240,0.4)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(180,210,240,0.5)', margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '28px', background: 'rgba(0,212,232,0.15)' }} />

              {/* User menu */}
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(0,212,232,0.15)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #00d4e8, #0077aa)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#0a1128',
                    flexShrink: 0,
                  }}>
                    {userInitials}
                  </div>
                  <div className="text-left">
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e0f7ff', lineHeight: 1.2 }}>
                      {user ? `${user.first_name} ${user.last_name}` : 'User'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#00d4e8', lineHeight: 1 }}>
                      {devMode === 'custom' || user?.plan === 'enterprise' ? 'Organization' : `${user?.credits || 0} credits`}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(0,212,232,0.6)', transition: 'transform 0.2s', transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {isUserMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '180px',
                    background: 'linear-gradient(135deg, #0d1b3e, #0a2a4a)',
                    border: '1px solid rgba(0,212,232,0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    zIndex: 100,
                    padding: '4px',
                  }}>
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150"
                      style={{ color: 'rgba(180,210,240,0.9)', fontSize: '0.875rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,232,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings className="w-4 h-4" style={{ color: '#00d4e8' }} />
                      Account
                    </Link>
                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150"
                      style={{ color: '#ff6b81', fontSize: '0.875rem' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: '#00d4e8', background: 'rgba(0,212,232,0.08)', border: '1px solid rgba(0,212,232,0.15)' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div style={{
            background: 'rgba(10,17,40,0.98)',
            borderTop: '1px solid rgba(0,212,232,0.1)',
            padding: '8px 16px 16px',
          }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 relative"
                  style={{
                    color: active ? '#00d4e8' : 'rgba(180,210,240,0.8)',
                    background: active ? 'rgba(0,212,232,0.1)' : 'transparent',
                    fontSize: '0.9375rem',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {item.badge > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#ff4757,#ff6b81)', color: 'white', fontSize: '0.65rem', fontWeight: 700, borderRadius: '999px', padding: '1px 6px' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div style={{ borderTop: '1px solid rgba(0,212,232,0.1)', marginTop: '8px', paddingTop: '8px' }}>
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-3 rounded-lg w-full"
                style={{ color: '#ff6b81', fontSize: '0.9375rem' }}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
