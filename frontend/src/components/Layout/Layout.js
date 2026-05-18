import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet, Navigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CpuChipIcon,
  HeartIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Monitor', href: '/monitor', icon: HeartIcon },
    { name: 'Sessions', href: '/sessions', icon: ChartBarIcon },
    { name: 'Analysis', href: '/analysis', icon: Cog6ToothIcon },
    { name: 'Risk Score', href: '/risk-score', icon: ShieldCheckIcon },
    { name: 'Summary', href: '/weekly-summary', icon: CalendarDaysIcon },
    { name: 'Diet', href: '/ai-diet', icon: SparklesIcon },
    { name: 'AI Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Devices', href: '/devices', icon: CpuChipIcon },
  ];

  const isCurrentPath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1E1A1D' }}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-t-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: '#3A3438', borderTopColor: '#F0ABFC' }}></div>
          <p className="mt-4" style={{ color: '#A89DA3' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#1E1A1D' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full" style={{ backgroundColor: '#17151A' }}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" style={{ color: '#F5F0F2' }} />
              </button>
            </div>
            <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto scrollbar-thin">
              <div className="flex items-center px-6 mb-8">
                <span className="text-lg font-semibold tracking-wider"
                  style={{ color: '#F0ABFC', fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.05em' }}>
                  heartwise
                </span>
              </div>
              <nav className="px-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isCurrentPath(item.href)
                        ? ''
                        : 'hover:bg-white/5'
                      }`}
                    style={isCurrentPath(item.href)
                      ? { backgroundColor: 'rgba(240, 171, 252, 0.1)', color: '#F0ABFC' }
                      : { color: '#A89DA3' }
                    }
                  >
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5"
                      style={{ color: isCurrentPath(item.href) ? '#F0ABFC' : '#7A7078' }} />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col" style={{ width: '240px' }}>
          <div className="flex flex-col h-full" style={{ backgroundColor: '#17151A' }}>
            {/* Logo */}
            <div className="flex items-center px-6 pt-6 pb-8">
              <span className="text-lg font-semibold"
                style={{
                  color: '#F0ABFC',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  letterSpacing: '0.05em'
                }}>
                heartwise
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isCurrentPath(item.href)
                      ? ''
                      : 'hover:bg-white/5'
                    }`}
                  style={isCurrentPath(item.href)
                    ? { backgroundColor: 'rgba(240, 171, 252, 0.1)', color: '#F0ABFC' }
                    : { color: '#A89DA3' }
                  }
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5"
                    style={{ color: isCurrentPath(item.href) ? '#F0ABFC' : '#7A7078' }} />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User section */}
            <div className="flex-shrink-0 p-4" style={{ borderTop: '1px solid #2A2528' }}>
              <Link to="/profile" className="flex items-center group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(240, 171, 252, 0.15)', color: '#F0ABFC' }}>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium" style={{ color: '#F5F0F2' }}>
                    {user?.firstName || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs" style={{ color: '#7A7078' }}>View profile</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 items-center px-4 md:px-8"
          style={{ backgroundColor: '#1E1A1D', borderBottom: '1px solid #2A2528' }}>
          {/* Mobile menu button */}
          <button
            className="p-2 rounded-lg md:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ color: '#A89DA3' }}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Page title area */}
          <div className="flex-1 flex items-center">
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold"
                style={{ color: '#F5F0F2', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {navigation.find(n => isCurrentPath(n.href))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Date */}
            <span className="hidden md:block text-sm" style={{ color: '#7A7078' }}>{today}</span>

            {/* Notification bell */}
            <button className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: '#A89DA3' }}>
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: '#F0ABFC' }}></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(240, 171, 252, 0.15)', color: '#F0ABFC' }}>
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium" style={{ color: '#F5F0F2' }}>
                  {user?.firstName || user?.email?.split('@')[0]}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl py-1 z-50"
                  style={{ backgroundColor: '#2A2528', border: '1px solid #3A3438', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    onClick={() => setProfileMenuOpen(false)}
                    style={{ color: '#F5F0F2' }}
                  >
                    <UserCircleIcon className="h-5 w-5 mr-2" style={{ color: '#A89DA3' }} />
                    My Profile
                  </Link>
                  <button
                    onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                    className="flex items-center w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: '#FB7185' }}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto scrollbar-thin" style={{ backgroundColor: '#1E1A1D' }}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;