import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Server,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../ui/Button';
import { Banner } from '../ui/Banner';

export function AppLayout({ onOpenCreateForm }) {
  const { user, logout, isWakingUp } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Forms', path: '/forms', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Account', path: '/account', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shrink-0">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform">
              EF
            </div>
            <div>
              <span className="font-bold text-stone-900 tracking-tight text-base block leading-none">
                Easy Forms
              </span>
              <span className="text-[11px] font-medium text-stone-400 block mt-1">
                Form Studio
              </span>
            </div>
          </NavLink>
        </div>

        {/* Primary Action Button */}
        {onOpenCreateForm && (
          <div className="px-4 pt-4">
            <Button
              variant="primary"
              className="w-full justify-center shadow-xs"
              icon={Plus}
              onClick={onOpenCreateForm}
            >
              Create Form
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-800 font-semibold border-l-4 border-orange-500 rounded-r-xl rounded-l-xs shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 rounded-xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600 stroke-[2.2]' : 'text-stone-400'}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-stone-200/80 bg-stone-50/60">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">
                {user?.name || 'My Account'}
              </p>
              <p className="text-xs text-stone-500 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-stone-200"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            EF
          </div>
          <span className="font-bold text-stone-900 text-sm tracking-tight">Easy Forms</span>
        </NavLink>

        <div className="flex items-center gap-2">
          {onOpenCreateForm && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onOpenCreateForm}
            >
              New
            </Button>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="bg-white w-64 h-full p-4 flex flex-col justify-between shadow-modal animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="font-bold text-stone-900">Easy Forms Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-800 font-semibold border-l-4 border-orange-500'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-stone-400'}`} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-stone-500 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-stone-500 hover:text-rose-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Cold Start Waking Banner */}
        {isWakingUp && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="max-w-6xl mx-auto flex items-center gap-3 text-sm text-amber-900">
              <Server className="w-4 h-4 shrink-0 animate-pulse text-amber-600" />
              <span>
                <strong>Server waking up:</strong> The backend is running on a free instance and may take up to 60 seconds to respond.
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
