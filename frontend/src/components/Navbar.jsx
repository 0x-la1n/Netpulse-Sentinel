import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BellRing,
  CircleHelp,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Play,
  Plus,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';

function getInitials(name) {
  const safeName = String(name || '').trim();
  if (!safeName) return 'US';

  const parts = safeName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function getTabIcon(tab) {
  const normalized = String(tab || '').toLowerCase();

  if (normalized === 'dashboard') return LayoutDashboard;
  if (normalized === 'history') return BarChart3;
  if (normalized === 'reportes') return FileText;
  if (normalized === 'alertas') return BellRing;
  if (normalized === 'configuracion') return Settings;
  if (normalized === 'ayuda') return CircleHelp;

  return LayoutDashboard;
}

export const Navbar = ({
  activeTab,
  setIsMobileMenuOpen,
  isSimulating,
  setIsSimulating,
  setShowAddModal,
  user,
  theme,
  onToggleTheme,
  onLogout,
}) => {
  const [isPollingHover, setIsPollingHover] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const initials = getInitials(user?.name);
  const ActiveIcon = getTabIcon(activeTab);
  const roleLabel = String(user?.role || 'SysAdmin');
  const showPauseIntent = isSimulating && isPollingHover;
  const isDark = theme !== 'light';

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  return (
    <header className="shrink-0 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="h-16 flex items-center justify-between px-4 gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-md font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
            <ActiveIcon className="h-4.5 w-4.5 text-emerald-400" />
            <h1 className="text-[1.08rem] font-semibold leading-none text-slate-100 capitalize">
              {activeTab}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            onMouseEnter={() => setIsPollingHover(true)}
            onMouseLeave={() => setIsPollingHover(false)}
            className={`relative h-10 w-[170px] overflow-hidden inline-flex items-center justify-center gap-2 px-4 rounded-xl border text-sm font-semibold transition-colors focus:outline-none ${
              showPauseIntent
                ? 'bg-rose-500/18 border-rose-400/55 text-rose-100 hover:bg-rose-500/22'
                : isSimulating
                ? 'bg-emerald-500/12 border-emerald-400/45 text-emerald-100 hover:bg-emerald-500/18'
                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {isSimulating && (
              <>
                <span
                  className={`absolute inset-0 pointer-events-none ${showPauseIntent ? 'bg-rose-400/10' : 'bg-emerald-400/10'}`}
                />
                <span
                  className={`absolute inset-0 pointer-events-none polling-wave-bg ${showPauseIntent ? 'polling-wave-bg--pause polling-wave-bg--flat' : ''}`}
                />
              </>
            )}

            <span className="relative inline-flex items-center justify-center gap-2 w-full text-center">
              {!isSimulating && <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />}
              <span>{showPauseIntent ? 'Pausar Polling' : isSimulating ? 'Polling Activo' : 'Iniciar Polling'}</span>
            </span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-10 w-[170px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-emerald-950 transition-colors focus:outline-none shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Nodo</span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="hidden md:flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 pl-1 pr-3.5 max-w-60 min-w-[212px] hover:bg-slate-800 transition-colors"
              title={user?.name || 'Usuario'}
            >
              <div className="relative w-8 h-8 rounded-full border border-slate-600 bg-slate-950 text-slate-100 font-semibold text-[11px] flex items-center justify-center">
                <span>{initials}</span>
                <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>

              <div className="leading-tight min-w-0 flex-1 text-left">
                <p className="text-[10px] font-semibold text-emerald-300 truncate">{roleLabel}</p>
                <p className="text-sm text-slate-100 font-semibold truncate block">{user?.name || 'Usuario'}</p>
              </div>

              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="md:hidden w-9 h-9 rounded-full border border-slate-700 bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700/80 transition-colors"
            >
              <UserRound className="w-4 h-4" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] w-72 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-3 shadow-xl shadow-slate-950/40">
                <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300">{roleLabel}</p>
                  <p className="text-sm font-semibold text-slate-100 truncate">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || 'Sin correo'}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme?.();
                  }}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-cyan-300" /> : <Sun className="w-4 h-4 text-amber-300" />}
                    Tema de interfaz
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{isDark ? 'Dark' : 'Light'}</span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-2 w-full flex items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 hover:bg-slate-800 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-slate-400" />
                      Cerrar sesión
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
};
