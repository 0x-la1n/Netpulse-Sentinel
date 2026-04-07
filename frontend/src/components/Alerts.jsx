import React from 'react';
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
import { absoluteTime, relativeTime } from '../lib/time';
import { PageHeader } from './ui/PageHeader';
import { KpiCard } from './ui/KpiCard';
import { useAlertsData } from '../hooks/alerts/useAlertsData';

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

export const Alerts = ({ events }) => {
  const {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    timeFilter,
    setTimeFilter,
    serviceFilter,
    setServiceFilter,
    sortBy,
    setSortBy,
    serviceOptions,
    filteredEvents,
    stats,
    TYPE_OPTIONS,
    TIME_OPTIONS,
  } = useAlertsData(events);

  return (
    <div className="w-full space-y-4 pb-5">
      <PageHeader
        icon={BellRing}
        chipLabel="Centro de Alertas"
        title="Alertas y eventos de monitoreo"
        rightContent={<span>Ventana activa: <span className="font-semibold text-slate-100">{timeFilter}</span></span>}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total" value={stats.total} />
        <KpiCard label="Críticas" value={stats.critical} tone="danger" />
        <KpiCard label="Recuperaciones" value={stats.recovery} tone="success" />
        <KpiCard label="Info" value={stats.info} tone="info" />
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