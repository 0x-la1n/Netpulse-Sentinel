import React from 'react';
import { CircleAlert, Menu, Play, Plus, Pause, UserRound } from 'lucide-react';

function getInitials(name) {
  const safeName = String(name || '').trim();
  if (!safeName) return 'US';

  const parts = safeName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export const Navbar = ({ activeTab, setIsMobileMenuOpen, isSimulating, setIsSimulating, setShowAddModal, user }) => {
  const initials = getInitials(user?.name);

  return (
    <header className="h-16 shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-md font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-xl font-semibold text-slate-100 hidden sm:block capitalize">
          {activeTab}
        </h1>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        {!isSimulating && (
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-500/40 bg-amber-950/50 text-amber-200 text-xs font-semibold tracking-wide animate-pulse whitespace-nowrap">
            <CircleAlert className="w-3.5 h-3.5" />
            Polling en pausa: vista congelada temporalmente.
          </div>
        )}

        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors focus:outline-none ${
            isSimulating 
              ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 hover:bg-rose-500/20' 
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isSimulating ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 text-emerald-400" fill="currentColor" />
          )}
          <span className="hidden sm:inline">{isSimulating ? 'Pausar Polling' : 'Iniciar Polling'}</span>
        </button>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-colors focus:outline-none shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Objetivo</span>
        </button>

        <div
          className="hidden md:flex items-center gap-2 pl-2 pr-2 py-1 rounded-full border border-slate-700/80 bg-slate-900/80 shadow-inner shadow-slate-800/60 max-w-60 min-w-0 group relative"
          title={user?.name || 'Usuario'}
        >
          <div className="relative w-9 h-9 rounded-full bg-linear-to-br from-emerald-400 to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/20">
            {initials}
            <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-900" />
          </div>
          <div className="leading-tight min-w-0 w-32.5 lg:w-41.25">
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 truncate">Usuario</p>
            <p className="text-sm text-slate-100 font-medium truncate block">{user?.name || 'Usuario'}</p>
          </div>

          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] whitespace-nowrap px-3 py-1.5 rounded-md border border-slate-700 bg-slate-950 text-xs text-slate-100 shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-40">
            {user?.name || 'Usuario'}
          </div>
        </div>

        <div className="md:hidden w-9 h-9 rounded-full border border-slate-700 bg-slate-800/80 flex items-center justify-center text-slate-300">
          <UserRound className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
