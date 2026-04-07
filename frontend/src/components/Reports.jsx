import React from 'react';
import {
  BarChart3,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Funnel,
  Printer,
  Search,
  Server,
  ShieldAlert,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { absoluteTime } from '../lib/time';
import { StatusBadge } from './ui/StatusBadge';
import { KpiCard } from './ui/KpiCard';
import { PageHeader } from './ui/PageHeader';
import { useReportsData } from '../hooks/reports/useReportsData';
import { exportReportCsv, printReportPdf } from './reports/exporters';

export const Reports = ({ services, events }) => {
  const {
    preset,
    setPreset,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    query,
    setQuery,
    serviceOptions,
    scopedServices,
    scopedEvents,
    summary,
    reportRows,
    reportTitle,
    REPORT_PRESETS,
    TIME_OPTIONS,
    STATUS_OPTIONS,
    formatPercent,
  } = useReportsData(services, events);

  const latestService = summary.mostUnstable;
  const topIncident = summary.topIncident;

  return (
    <div className="w-full space-y-4 pb-5">
      <PageHeader
        icon={FileText}
        chipLabel="Centro de Reportes"
        title="Reportes operativos y personalizados"
        description="Consulta resúmenes, incidencias críticas y métricas de rendimiento usando datos reales del tablero. Exporta el reporte actual a CSV o PDF."
        rightContent={<span>Vista activa: <span className="font-semibold text-slate-100">{REPORT_PRESETS.find((option) => option.value === preset)?.label}</span></span>}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Objetivos" value={summary.totalServices} helper={`${summary.upServices} UP · ${summary.downServices} DOWN · ${summary.pausedServices} PAUSED`} />
        <KpiCard label="Uptime medio" value={formatPercent(summary.avgUptime)} tone="success" />
        <KpiCard label="Latencia media" value={summary.avgLatency ? `${Math.round(summary.avgLatency)} ms` : 'N/A'} tone="info" />
        <KpiCard label="Alertas críticas" value={summary.criticalEvents} tone="danger" />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por servicio, evento, target o mensaje"
              className="w-full rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          <label className="relative">
            <BarChart3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {REPORT_PRESETS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>

          <label className="relative">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
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
            <Funnel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'Estado: Todos' : `Estado: ${option}`}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>

          <label className="relative md:col-span-2 xl:col-span-5">
            <Server className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950/70 py-1.5 pl-8.5 pr-7.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {serviceOptions.map((option) => (
                <option key={option} value={option}>{option === 'ALL' ? 'Objetivo: Todos' : `Objetivo: ${option}`}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportReportCsv({ preset, timeFilter, reportRows, reportTitle })}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => printReportPdf({ preset, reportRows, reportTitle, summary, formatPercent })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
          >
            <Printer className="h-3.5 w-3.5" />
            Guardar como PDF
          </button>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="flex items-center gap-2 text-slate-100">
            <ShieldAlert className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resumen del reporte</h3>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Vista seleccionada</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{REPORT_PRESETS.find((option) => option.value === preset)?.label}</div>
              <p className="mt-1 text-xs text-slate-400">{reportTitle}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Activo más inestable</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{latestService ? latestService.name : 'Sin datos'}</div>
              <p className="mt-1 text-xs text-slate-400">{latestService ? `${latestService.target} · ${formatPercent(latestService.uptime)}` : 'No hay objetivos disponibles.'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Incidente más frecuente</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{topIncident ? topIncident[0] : 'Sin incidentes'}</div>
              <p className="mt-1 text-xs text-slate-400">{topIncident ? `${topIncident[1]} eventos críticos en la ventana activa.` : 'Sin alertas críticas en el rango actual.'}</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Cobertura temporal</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{timeFilter}</div>
              <p className="mt-1 text-xs text-slate-400">{scopedEvents.length} eventos y {scopedServices.length} objetivos en el rango.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="flex items-center gap-2 text-slate-100">
            <XCircle className="h-4 w-4 text-rose-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Estado operativo</h3>
          </div>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span>Targets arriba</span>
              <span className="font-semibold text-emerald-300">{summary.upServices}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span>Targets abajo</span>
              <span className="font-semibold text-rose-300">{summary.downServices}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span>Eventos críticos</span>
              <span className="font-semibold text-rose-300">{summary.criticalEvents}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
              <span>Recuperaciones</span>
              <span className="font-semibold text-emerald-300">{summary.recoveryEvents}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="flex items-center gap-2 text-slate-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            {preset === 'critical' ? 'Incidencias críticas filtradas' : 'Targets y métricas filtradas'}
          </h3>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
          {preset === 'critical' ? (
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Servicio</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Latencia</th>
                  <th className="px-3 py-2">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.length > 0 ? reportRows.map((row) => (
                  <tr key={`${row.target}-${row.timestamp}`} className="border-b border-slate-800/70 last:border-b-0">
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{absoluteTime(row.timestamp, false)}</td>
                    <td className="px-3 py-2 font-medium text-slate-100">{row.name}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{row.latency}</td>
                    <td className="px-3 py-2 text-slate-400">{row.message}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-3 py-8 text-center text-slate-500">No hay incidencias críticas para los filtros actuales.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-3 py-2">Servicio</th>
                  <th className="px-3 py-2">Objetivo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Prioridad</th>
                  <th className="px-3 py-2">Uptime</th>
                  <th className="px-3 py-2">Latencia</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.length > 0 ? reportRows.map((row) => (
                  <tr key={`${row.name}-${row.target}`} className="border-b border-slate-800/70 last:border-b-0">
                    <td className="px-3 py-2 font-medium text-slate-100">{row.name}</td>
                    <td className="px-3 py-2 text-slate-400">{row.target}</td>
                    <td className="px-3 py-2 text-slate-400">{row.type}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-2 text-slate-400">{row.priority}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{row.uptime}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{row.latency}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-slate-500">No hay datos que coincidan con los filtros activos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};