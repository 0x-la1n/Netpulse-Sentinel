import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  Funnel,
  Info,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';

const TYPE_OPTIONS = ['ALL', 'CRITICAL', 'RECOVERY', 'INFO'];
const TIME_OPTIONS = ['ALL', '15M', '1H', '24H', '7D'];

function eventStyle(type) {
  if (type === 'CRITICAL') {
    return {
      icon: <XCircle className="h-5 w-5 text-rose-300" />,
      card: 'border-rose-900/50 bg-rose-950/20',
      badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      text: 'text-rose-200',
    };
  }

  if (type === 'RECOVERY') {
    return {
      icon: <CheckCircle className="h-5 w-5 text-emerald-300" />,
      card: 'border-emerald-900/50 bg-emerald-950/20',
      badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      text: 'text-emerald-200',
    };
  }

  return {
    icon: <Info className="h-5 w-5 text-cyan-300" />,
    card: 'border-slate-800 bg-slate-900/70',
    badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    text: 'text-slate-200',
  };
}

function relativeTime(timestamp) {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();

  if (diff < 60 * 1000) return 'hace segundos';
  if (diff < 60 * 60 * 1000) return `hace ${Math.floor(diff / (60 * 1000))} min`;
  if (diff < 24 * 60 * 60 * 1000) return `hace ${Math.floor(diff / (60 * 60 * 1000))} h`;
  return `hace ${Math.floor(diff / (24 * 60 * 60 * 1000))} d`;
}

function absoluteTime(timestamp) {
  return new Date(timestamp).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function inTimeWindow(timestamp, windowKey) {
  if (windowKey === 'ALL') return true;

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (windowKey === '15M') return ageMs <= 15 * 60 * 1000;
  if (windowKey === '1H') return ageMs <= 60 * 60 * 1000;
  if (windowKey === '24H') return ageMs <= 24 * 60 * 60 * 1000;
  if (windowKey === '7D') return ageMs <= 7 * 24 * 60 * 60 * 1000;

  return true;
}

export const Alerts = ({ events }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('24H');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const serviceOptions = useMemo(() => {
    const set = new Set(events.map((evt) => evt.serviceName).filter(Boolean));
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const next = events.filter((evt) => {
      if (!inTimeWindow(evt.timestamp, timeFilter)) return false;
      if (typeFilter !== 'ALL' && evt.type !== typeFilter) return false;
      if (serviceFilter !== 'ALL' && evt.serviceName !== serviceFilter) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        evt.serviceName,
        evt.type,
        evt.status,
        evt.message,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return haystack.includes(normalizedQuery);
    });

    if (sortBy === 'oldest') {
      next.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === 'severity') {
      const weight = { CRITICAL: 3, RECOVERY: 2, INFO: 1 };
      next.sort((a, b) => {
        const diff = (weight[b.type] || 0) - (weight[a.type] || 0);
        if (diff !== 0) return diff;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    } else {
      next.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return next;
  }, [events, query, typeFilter, timeFilter, serviceFilter, sortBy]);

  const stats = useMemo(() => {
    const critical = filteredEvents.filter((evt) => evt.type === 'CRITICAL').length;
    const recovery = filteredEvents.filter((evt) => evt.type === 'RECOVERY').length;
    const info = filteredEvents.filter((evt) => evt.type === 'INFO').length;

    return {
      total: filteredEvents.length,
      critical,
      recovery,
      info,
    };
  }, [filteredEvents]);

  return (
    <div className="w-full space-y-4 pb-5">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
              <BellRing className="h-3.5 w-3.5" />
              Centro de Alertas
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">Alertas y eventos de monitoreo</h2>
            <p className="mt-1.5 max-w-3xl text-xs text-slate-400 md:text-sm">
              Visualiza incidentes, recuperaciones y eventos informativos con búsqueda avanzada, filtros temporales y priorización por severidad.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
            Ventana activa: <span className="font-semibold text-slate-100">{timeFilter}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Total</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-rose-300/70">Críticas</div>
          <div className="mt-1 text-xl font-semibold text-rose-300">{stats.critical}</div>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">Recuperaciones</div>
          <div className="mt-1 text-xl font-semibold text-emerald-300">{stats.recovery}</div>
        </div>
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Info</div>
          <div className="mt-1 text-xl font-semibold text-cyan-300">{stats.info}</div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-3 md:p-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por servicio, mensaje, estado o tipo"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          <label className="relative">
            <Funnel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'Tipo: Todos' : option}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>

          <label className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'Tiempo: Todo' : `Tiempo: ${option}`}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>

          <label className="relative">
            <ShieldAlert className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="newest">Orden: Más recientes</option>
              <option value="oldest">Orden: Más antiguos</option>
              <option value="severity">Orden: Severidad</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>

          <label className="relative md:col-span-2 xl:col-span-5">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-2.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {serviceOptions.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'Servicio: Todos' : `Servicio: ${option}`}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
        </div>
      </section>

      <section className="space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 py-10 text-center">
            <BellRing className="mx-auto mb-4 h-14 w-14 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-300">No hay alertas para los filtros activos</h3>
            <p className="mt-2 text-sm text-slate-500">Prueba ampliar el rango temporal o limpiar la búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredEvents.map((event, index) => {
            const style = eventStyle(event.type);
            const latencyLabel = event.latencyMs == null ? 'N/A' : `${event.latencyMs} ms`;

            return (
              <article
                key={`${event.id}-${index}`}
                className={`group relative overflow-hidden rounded-lg border px-3 py-2.5 transition-all duration-200 hover:border-slate-700 ${style.card}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">{style.icon}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className={`truncate text-xs font-semibold md:text-sm ${style.text}`}>{event.serviceName || 'Servicio desconocido'}</h4>
                        <p className="mt-0.5 text-[11px] text-slate-500">{absoluteTime(event.timestamp)} · {relativeTime(event.timestamp)}</p>
                      </div>

                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}>
                        {event.type}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300 md:text-sm">{event.message}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">Estado: {event.status || 'UNKNOWN'}</span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">Latencia: {latencyLabel}</span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5">Target ID: {event.targetId || '-'}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        )}
      </section>
    </div>
  );
};