import React, { useContext, useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function NavBar() {
  const { logout, user, devMode } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [anomalyCount, setAnomalyCount] = useState(0);

  const fetchAnomalyCount = async () => {
    try {
      const response = await fetch('/api/v1/anomalies/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const totalAnomalies = data.data?.reduce((sum, group) => sum + (group.anomaly_count || 0), 0) || 0;
        setAnomalyCount(totalAnomalies);
      }
    } catch (error) {
      console.error('Failed to fetch anomaly count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnomalyCount();
    }
  }, [user]);

  // Refresh anomaly count when location changes (e.g., after resolving anomalies)
  useEffect(() => {
    if (user && location.pathname === '/anomalies') {
      fetchAnomalyCount();
    }
  }, [location.pathname, user]);

  // Listen for custom events to refresh anomaly count
  useEffect(() => {
    const handleAnomalyUpdate = () => {
      fetchAnomalyCount();
    };

    window.addEventListener('anomalyResolved', handleAnomalyUpdate);
    window.addEventListener('anomalyCreated', handleAnomalyUpdate);

    return () => {
      window.removeEventListener('anomalyResolved', handleAnomalyUpdate);
      window.removeEventListener('anomalyCreated', handleAnomalyUpdate);
    };
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

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1400px]">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="font-bold text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Smartscript
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 lg:ml-8 md:flex md:space-x-1 lg:space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 relative ${isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium shadow-sm animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-3 lg:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-md shadow-xl py-1 z-30 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => { markAllAsRead(); setIsNotificationsOpen(false); }}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              // If link exists, we might want to navigate
                            }}
                            className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <p className={`text-sm ${!notif.is_read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                {notif.title}
                              </p>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                {new Date(notif.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{user ? `${user.first_name} ${user.last_name}` : 'User'}</div>
                  {/* Hide credits if devMode is custom or user plan indicates organization/enterprise */}
                  {user && (devMode !== 'custom' && user.plan !== 'enterprise' && user.plan !== 'custom') && (
                    <div className="text-xs text-gray-500">Credits: {user.credits || 0}</div>
                  )}
                  {user && (devMode === 'custom' || user.plan === 'enterprise' || user.plan === 'custom') && (
                    <div className="text-xs text-xs text-purple-600 font-medium">Organization</div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                    <UserIcon className="w-6 h-6 text-gray-600" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-md shadow-lg py-1 z-20">
                      <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account</Link>
                      <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 p-2 rounded-md"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center space-x-3 relative ${isActive(item.href)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium shadow-sm animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
