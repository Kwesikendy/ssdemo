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
      {/* CSS for pulse and nav-link hover */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes navGlow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(0,212,232,0.6), 0 0 20px rgba(0,212,232,0.35), 0 0 45px rgba(0,212,232,0.15); }
          50% { box-shadow: 0 0 0 2px rgba(0,212,232,0.9), 0 0 28px rgba(0,212,232,0.55), 0 0 60px rgba(0,212,232,0.25); }
        }
        .logo-badge {
          animation: navGlow 3s ease-in-out infinite;
          transition: transform 0.3s ease;
        }
        .logo-badge:hover { transform: scale(1.07); }
        .nav-link-item { position: relative; }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4e8, transparent);
          border-radius: 2px;
          transition: width 0.25s ease;
        }
        .nav-link-item.active::after { width: 70%; }
        .nav-link-item:hover::after { width: 50%; }
      `}</style>

      <nav
        style={{
          background: scrolled
            ? 'rgba(8, 14, 35, 0.97)'
            : 'linear-gradient(135deg, #080e23 0%, #0b1530 50%, #071828 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled
            ? '1px solid rgba(0,212,232,0.18)'
            : '1px solid rgba(0,212,232,0.1)',
          boxShadow: scrolled
            ? '0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(0,212,232,0.08)'
            : '0 2px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.4s ease',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '72px', gap: '24px' }}>

            {/* ── LOGO ── */}
            <Link
              to="/dashboard"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}
            >
              {/* White badge — logo colors are preserved on white */}
              <div
                className="logo-badge"
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '8px',
                  flexShrink: 0,
                  lineHeight: 0,
                }}
              >
                <img
                  src="/logo-transparent.png"
                  alt="SmartScript"
                  style={{ height: '48px', width: '48px', objectFit: 'contain', display: 'block' }}
                />
              </div>

              {/* Wordmark */}
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{
                  background: 'linear-gradient(90deg, #ffffff 0%, #a0e8f5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  letterSpacing: '-0.025em',
                  display: 'block',
                }}>SmartScript</span>
                <span style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'rgba(0,212,232,0.75)',
                  display: 'block',
                  marginTop: '1px',
                }}>AI Marking</span>
              </div>
            </Link>

            {/* ── NAV LINKS (desktop) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'center' }}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link-item${active ? ' active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 13px',
                      borderRadius: '10px',
                      fontSize: '0.8125rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#00d4e8' : 'rgba(160,200,230,0.8)',
                      background: active
                        ? 'rgba(0,212,232,0.12)'
                        : 'transparent',
                      border: active
                        ? '1px solid rgba(0,212,232,0.22)'
                        : '1px solid transparent',
                      textDecoration: 'none',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#e0f7ff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'rgba(160,200,230,0.8)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    <span>{item.name}</span>
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
                        color: 'white',
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        borderRadius: '999px',
                        minWidth: '17px',
                        height: '17px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        boxShadow: '0 2px 10px rgba(255,71,87,0.6)',
                        animation: 'pulse 2s infinite',
                      }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── RIGHT SIDE ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

              {/* Notifications */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsUserMenuOpen(false); }}
                  style={{
                    position: 'relative',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(160,200,230,0.85)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,232,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <Bell style={{ width: '18px', height: '18px' }} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'linear-gradient(135deg, #00d4e8, #0099aa)',
                      color: '#060d1f',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      borderRadius: '999px',
                      minWidth: '17px',
                      height: '17px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      boxShadow: '0 2px 10px rgba(0,212,232,0.6)',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: '320px',
                    background: 'linear-gradient(160deg, #0d1b3e 0%, #091726 100%)',
                    border: '1px solid rgba(0,212,232,0.2)',
                    borderRadius: '14px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,232,0.05)',
                    overflow: 'hidden',
                    zIndex: 100,
                  }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,212,232,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#e0f7ff', fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => { markAllAsRead(); setIsNotificationsOpen(false); }}
                          style={{ color: '#00d4e8', fontSize: '0.75rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '36px 18px', textAlign: 'center', color: 'rgba(160,200,230,0.45)', fontSize: '0.875rem' }}>
                          No notifications
                        </div>
                      ) : notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { if (!n.is_read && !n.read) markAsRead(n.id); }}
                          style={{
                            padding: '11px 18px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            background: (!n.is_read && !n.read) ? 'rgba(0,212,232,0.06)' : 'transparent',
                            transition: 'background 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '0.8125rem', color: (!n.is_read && !n.read) ? '#e0f7ff' : 'rgba(160,200,230,0.7)', fontWeight: (!n.is_read && !n.read) ? 600 : 400, margin: 0 }}>
                              {n.title}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'rgba(160,200,230,0.4)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(160,200,230,0.5)', margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '30px', background: 'rgba(0,212,232,0.12)' }} />

              {/* User menu */}
              <div style={{ position: 'relative' }} ref={userRef}>
                <button
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotificationsOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 12px 6px 6px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(0,212,232,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,232,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(0,212,232,0.15)'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: 'linear-gradient(135deg, #00d4e8 0%, #0066aa 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: '#060d1f',
                    flexShrink: 0,
                    boxShadow: '0 2px 10px rgba(0,212,232,0.35)',
                  }}>
                    {userInitials}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e0f7ff', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                      {user ? `${user.first_name} ${user.last_name}` : 'User'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(0,212,232,0.8)', lineHeight: 1, marginTop: '1px' }}>
                      {devMode === 'custom' || user?.plan === 'enterprise' ? 'Organization' : `${user?.credits || 0} credits`}
                    </div>
                  </div>
                  <ChevronDown style={{ width: '14px', height: '14px', color: 'rgba(0,212,232,0.6)', transition: 'transform 0.2s', transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {isUserMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: '186px',
                    background: 'linear-gradient(160deg, #0d1b3e 0%, #091726 100%)',
                    border: '1px solid rgba(0,212,232,0.2)',
                    borderRadius: '14px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    zIndex: 100,
                    padding: '5px',
                  }}>
                    <Link
                      to="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px',
                        color: 'rgba(160,200,230,0.9)', fontSize: '0.875rem',
                        fontWeight: 500, textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,232,0.09)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Settings style={{ width: '16px', height: '16px', color: '#00d4e8' }} />
                      Account
                    </Link>
                    <button
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', borderRadius: '10px',
                        color: '#ff6b81', fontSize: '0.875rem',
                        fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.09)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut style={{ width: '16px', height: '16px' }} />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#00d4e8', background: 'rgba(0,212,232,0.08)',
                  border: '1px solid rgba(0,212,232,0.2)', cursor: 'pointer',
                }}
              >
                {isMobileMenuOpen ? <X style={{ width: '18px', height: '18px' }} /> : <Menu style={{ width: '18px', height: '18px' }} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div style={{
            background: 'rgba(8,14,35,0.98)',
            borderTop: '1px solid rgba(0,212,232,0.1)',
            padding: '8px 16px 18px',
          }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px', marginBottom: '3px',
                    color: active ? '#00d4e8' : 'rgba(160,200,230,0.8)',
                    background: active ? 'rgba(0,212,232,0.1)' : 'transparent',
                    fontSize: '0.9375rem', fontWeight: active ? 700 : 400,
                    textDecoration: 'none', position: 'relative',
                  }}
                >
                  <Icon style={{ width: '18px', height: '18px' }} />
                  {item.name}
                  {item.badge > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#ff4757,#ff6b81)', color: 'white', fontSize: '0.65rem', fontWeight: 700, borderRadius: '999px', padding: '2px 7px' }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div style={{ borderTop: '1px solid rgba(0,212,232,0.1)', marginTop: '8px', paddingTop: '8px' }}>
              <button
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px', width: '100%',
                  color: '#ff6b81', fontSize: '0.9375rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
