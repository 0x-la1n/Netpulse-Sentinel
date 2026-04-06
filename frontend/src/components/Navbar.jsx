import React, { useState } from 'react';
import {
  ArrowUpDown,
  BarChart3,
  BellRing,
  CircleAlert,
  CircleHelp,
  FileText,
  LayoutDashboard,
  ListFilter,
  Menu,
  Play,
  Plus,
  Pause,
  Search,
  Settings,
  UserRound,
  ChevronDown,
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
  targetSearch,
  setTargetSearch,
  targetFilter,
  setTargetFilter,
  targetSort,
  setTargetSort,
  user,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const initials = getInitials(user?.name);
  const ActiveIcon = getTabIcon(activeTab);
  const hasSearchValue = String(targetSearch || '').trim().length > 0;
  const hasNonDefaultFilters = targetFilter !== 'all' || targetSort !== 'priority-desc';

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

          <div className="min-w-0">
            <h1 className="hidden sm:flex items-center gap-2 text-lg font-semibold text-slate-100 capitalize">
              <ActiveIcon className="h-5 w-5 text-emerald-400" />
              {activeTab}
            </h1>
            <p className="hidden xl:block text-[11px] text-slate-500">Búsqueda, filtros y orden para la vista activa</p>
          </div>
        </div>

        <div className="hidden xl:flex flex-1 justify-center px-4 min-w-0">
          <div className="w-full max-w-5xl flex items-center gap-2 min-w-0">
            <div className="relative flex-[1.45] min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                placeholder="Buscar nodo por nombre, target, tipo o estado"
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-700 bg-slate-900/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="relative shrink-0 min-w-[170px] max-w-[200px]">
              <ListFilter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-md border border-slate-700 bg-slate-900/80 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
              >
                <option value="all">Todos</option>
                <option value="up">Estado: UP</option>
                <option value="down">Estado: DOWN</option>
                <option value="paused">Estado: PAUSED</option>
                <option value="http">Tipo: HTTP</option>
                <option value="ping">Tipo: PING</option>
                <option value="port">Tipo: PORT</option>
              </select>
            </div>

            <div className="relative shrink-0 min-w-[210px] max-w-[240px]">
              <ArrowUpDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={targetSort}
                onChange={(e) => setTargetSort(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-md border border-slate-700 bg-slate-900/80 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
              >
                <option value="priority-desc">Orden: Prioridad (Crítico a Bajo)</option>
                <option value="status-risk">Orden: Estado (Riesgo)</option>
                <option value="latency-desc">Orden: Latencia (Mayor a Menor)</option>
                <option value="name-asc">Orden: Nombre (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0 shrink-0">
          {!isSimulating && (
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-500/40 bg-amber-950/50 text-amber-200 text-xs font-semibold tracking-wide animate-pulse whitespace-nowrap">
              <CircleAlert className="w-3.5 h-3.5" />
              Polling en pausa
            </div>
          )}

          <button
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className={`xl:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors focus:outline-none ${
              mobileFiltersOpen || hasSearchValue || hasNonDefaultFilters
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            aria-expanded={mobileFiltersOpen}
            aria-controls="mobile-filter-panel"
          >
            <ListFilter className="w-4 h-4" />
            Filtros
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
          </button>

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
            <span className="hidden sm:inline">{isSimulating ? 'Pausar' : 'Iniciar'}</span>
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-sm font-medium text-white transition-colors focus:outline-none shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo</span>
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
      </div>

      <div
        id="mobile-filter-panel"
        className={`xl:hidden overflow-hidden border-t border-slate-800 bg-slate-900/85 backdrop-blur px-4 transition-all duration-200 ${
          mobileFiltersOpen ? 'max-h-80 py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
        }`}
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Buscar nodo por nombre, target, tipo o estado"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-700 bg-slate-950/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <ListFilter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-md border border-slate-700 bg-slate-950/80 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
              >
                <option value="all">Todos</option>
                <option value="up">Estado: UP</option>
                <option value="down">Estado: DOWN</option>
                <option value="paused">Estado: PAUSED</option>
                <option value="http">Tipo: HTTP</option>
                <option value="ping">Tipo: PING</option>
                <option value="port">Tipo: PORT</option>
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={targetSort}
                onChange={(e) => setTargetSort(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-md border border-slate-700 bg-slate-950/80 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none"
              >
                <option value="priority-desc">Prioridad (Crítico a Bajo)</option>
                <option value="status-risk">Estado (Riesgo)</option>
                <option value="latency-desc">Latencia (Mayor a Menor)</option>
                <option value="name-asc">Nombre (A-Z)</option>
              </select>
            </div>
          </div>

          {(hasSearchValue || hasNonDefaultFilters) && (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              {hasSearchValue && (
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                  Búsqueda activa
                </span>
              )}
              {targetFilter !== 'all' && (
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                  Filtro: {targetFilter}
                </span>
              )}
              {targetSort !== 'priority-desc' && (
                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                  Orden: {targetSort}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
