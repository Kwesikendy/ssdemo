import React, { useContext, useState } from 'react';
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

export default function NavBar(){
  const { logout } = useContext(AuthContext);
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Uploads', href: '/uploads', icon: Upload },
  { name: 'Anomalies', href: '/anomalies', icon: AlertTriangle },
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
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.href)
                        ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-3 lg:space-x-4">
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-50">
                <Bell className="w-5 h-5" />
                {/* small unread badge placeholder */}
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">3</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{user ? `${user.first_name} ${user.last_name}` : 'User'}</div>
                  <div className="text-xs text-gray-500">Credits: {user && user.credits ? user.credits : 0}</div>
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
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center space-x-3 ${
                    isActive(item.href)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
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
