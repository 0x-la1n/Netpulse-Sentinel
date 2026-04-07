import React from 'react';
import { 
  Server, Activity, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, CheckCircle2, XCircle, Trash2, Clock, Pencil, Search, ArrowUpDown, CircleAlert
} from 'lucide-react';
import { Sparkline } from './Sparkline';
import { ServiceLogo } from './ui/ServiceLogo';

const SORT_SEQUENCE = ['priority-desc', 'status-risk', 'latency-desc', 'name-asc'];

const SORT_LABELS = {
  'priority-desc': 'Prioridad',
  'status-risk': 'Estado',
  'latency-desc': 'Latencia',
  'name-asc': 'Nombre A-Z',
};

export const Dashboard = ({
  services,
  hasTargetFilters,
  events,
  isSimulating,
  onEditService,
  handleDeleteService,
  setShowAddModal,
  targetSearch,
  setTargetSearch,
  targetFilter,
  setTargetFilter,
  targetSort,
  setTargetSort,
}) => {
  const isGlobalPaused = !isSimulating;

  const cycleSort = () => {
    const currentIndex = SORT_SEQUENCE.indexOf(targetSort);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SORT_SEQUENCE.length : 0;
    setTargetSort(SORT_SEQUENCE[nextIndex]);
  };

  const priorityLabel = (value) => {
    const normalized = String(value || 'MEDIUM').toUpperCase();
    if (normalized === 'CRITICAL') return 'Critico';
    if (normalized === 'HIGH') return 'Alto';
    if (normalized === 'LOW') return 'Bajo';
    return 'Medio';
  };

  const priorityClass = (value) => {
    const normalized = String(value || 'MEDIUM').toUpperCase();
    if (normalized === 'CRITICAL') return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    if (normalized === 'HIGH') return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    if (normalized === 'LOW') return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
    return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
  };

  const confirmDeleteService = (service) => {
    const accepted = window.confirm(`¿Seguro que deseas eliminar el nodo \"${service.name}\"? Esta acción no se puede deshacer.`);
    if (!accepted) return;
    handleDeleteService(service.id);
  };

  // Cálculos para KPIs
  const totalServices = services.length;
  const upNodes = services.filter(s => s.status === 'UP').length;
  const downNodes = services.filter(s => s.status === 'DOWN').length;
  const globalUptime = totalServices > 0 
    ? (services.reduce((acc, curr) => acc + curr.uptime, 0) / totalServices).toFixed(2) 
    : 0;

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-6 w-full">
      {/* Contenido Principal (KPIs & Grid) */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-900/70 p-3 sm:p-3.5 shadow-[0_0_0_1px_rgba(15,23,42,0.25)]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Buscar por nombre, target, IP..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-950/85 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/70 p-1">
              <button
                onClick={() => setTargetFilter('all')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  targetFilter === 'all'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Todos
              </button>

              <button
                onClick={() => setTargetFilter('critical')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  targetFilter === 'critical'
                    ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CircleAlert className="w-3 h-3" />
                Criticos
              </button>

              <button
                onClick={() => setTargetFilter('issues')}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  targetFilter === 'issues'
                    ? 'bg-amber-500/20 text-amber-100 border border-amber-500/35'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Problemas
              </button>
            </div>

            <button
              onClick={cycleSort}
              className="inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/15 transition-colors"
              title="Cambiar orden"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Ordenar: {SORT_LABELS[targetSort] || 'Prioridad'}
            </button>
          </div>
        </div>

        {/* FAQs/KPIs */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300 ${
          isGlobalPaused ? 'opacity-60 grayscale-[0.45]' : ''
        }`}>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
            <div className="text-sm font-medium text-slate-400 mb-1">Total Servicios</div>
            <div className="text-3xl font-bold text-slate-100">{totalServices}</div>
            <Server className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800/30 pointer-events-none" />
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
            <div className="text-sm font-medium text-slate-400 mb-1">Nodos UP</div>
            <div className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
              {upNodes}
              <ArrowUpRight className="w-5 h-5 text-emerald-500/50" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
            <div className="text-sm font-medium text-slate-400 mb-1">Nodos DOWN</div>
            <div className="text-3xl font-bold text-rose-400 flex items-center gap-2">
              {downNodes}
              {downNodes > 0 && <ArrowDownRight className="w-5 h-5 text-rose-500/50" />}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
            <div className="text-sm font-medium text-slate-400 mb-1">Uptime Global</div>
            <div className="text-3xl font-bold text-slate-100">{globalUptime}%</div>
            <Activity className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800/30 pointer-events-none" />
          </div>
        </div>

        {/* Infrastructure Grid */}
        <div className="relative">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-800 pb-2 lg:flex-row lg:items-center lg:justify-between">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-slate-400" />
              Grid de Nodos a Monitorizar
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 lg:justify-end">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Latencia normal (&lt; 500 ms)
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Latencia media (500 - 999 ms)
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                Latencia alta (&gt;= 1000 ms / Timeout)
              </span>
            </div>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 transition-all duration-300 ${
            isGlobalPaused ? 'opacity-55 grayscale-[0.6]' : ''
          }`}>
            {services.map(service => {
              const isUp = service.status === 'UP';
              const isPaused = service.status === 'PAUSED';
              const currentLat = service.latencies[service.latencies.length - 1] || 0;
              const isHighLatency = currentLat >= 1000;
              const isMediumLatency = currentLat >= 500 && currentLat < 1000;
              const latencyClass = isPaused
                ? 'text-slate-400'
                : isUp
                  ? (isHighLatency ? 'text-rose-400' : isMediumLatency ? 'text-amber-400' : 'text-emerald-300')
                  : 'text-rose-400';
              
              return (
                <div key={service.id} className={`bg-slate-900 border rounded-xl p-4 flex flex-col relative overflow-hidden transition-all duration-300 ${
                  isGlobalPaused
                    ? 'border-slate-700/60 bg-slate-900/70'
                    : isPaused
                    ? 'border-amber-900/40 bg-amber-950/10'
                    : isUp
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-rose-900/50 bg-rose-950/20'
                }`}>
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="min-w-0 pr-2 flex items-start gap-3">
                      <ServiceLogo service={service} sizeClass="h-8 w-8" />

                      <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-100 truncate max-w-[150px]">{service.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${priorityClass(service.priority)}`}>
                          {priorityLabel(service.priority)}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          isPaused
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isUp
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                        }`}>
                          {isPaused ? <Clock className="w-3 h-3" /> : (isUp ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />)}
                          {service.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 w-full">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">{service.type}</span>
                        <span className="truncate">{service.target}</span>
                      </p>
                    </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onEditService(service)}
                        className="text-slate-500 hover:text-amber-300 hover:bg-amber-400/10 p-1.5 rounded-md transition-colors"
                        title="Editar servicio"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => confirmDeleteService(service)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 p-1.5 rounded-md transition-colors"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sparkline & Stats */}
                  <div className="mt-auto pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span className={`flex items-center gap-1 font-mono ${latencyClass}`}>
                        <Clock className="w-3.5 h-3.5" /> 
                          {isPaused ? 'Pausado' : (isUp ? `${currentLat} ms` : 'Timeout')}
                      </span>
                      <span className="font-medium">{service.uptime.toFixed(2)}% SLA</span>
                    </div>

                    <div className="px-1 relative h-10 w-full">
                      <div className="absolute inset-0 flex flex-col justify-between opacity-10 pointer-events-none py-0.5">
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                      </div>
                      <Sparkline data={service.latencies} status={service.status} />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {services.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <Server className="w-10 h-10 text-slate-600 mb-3" />
                {hasTargetFilters ? (
                  <p className="text-slate-400 font-medium">No hay resultados para los filtros aplicados.</p>
                ) : (
                  <>
                    <p className="text-slate-400 font-medium">No hay servicios configurados.</p>
                    <button onClick={() => setShowAddModal(true)} className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                      Añadir el primer objetivo →
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar de Audit Trail */}
      <div className="w-full xl:w-80 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0 xl:h-[calc(100vh-8rem)]">
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-10">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Audit Trail
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Registro de eventos (cronológico inverso)</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {events.map((event, idx) => {
            const isCritical = event.type === 'CRITICAL';
            const isRecovery = event.type === 'RECOVERY';
            const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            return (
              <div key={event.id} className="relative pl-4 pb-1">
                {idx !== events.length - 1 && (
                  <div className="absolute left-[7px] top-4 -bottom-4 w-px bg-slate-800" />
                )}
                
                <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  isCritical ? 'bg-rose-500' : isRecovery ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
                
                <div className={`text-xs p-3 rounded-lg border ${
                  isCritical ? 'bg-rose-950/20 border-rose-900/50 text-rose-200' : 
                  isRecovery ? 'bg-emerald-950/20 border-emerald-900/50 text-emerald-200' : 
                  'bg-slate-800/50 border-slate-700/50 text-slate-300'
                }`}>
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-semibold truncate">{event.serviceName}</span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">{time}</span>
                  </div>
                  <p className={`leading-relaxed ${
                    isCritical ? 'text-rose-300/80' : isRecovery ? 'text-emerald-300/80' : 'text-slate-400'
                  }`}>
                    {event.message}
                  </p>
                </div>
              </div>
            );
          })}
          
          {events.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              No hay eventos recientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
