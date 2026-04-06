import React, { useMemo, useState } from 'react';
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

const REPORT_PRESETS = [
  { value: 'overview', label: 'Resumen operativo' },
  { value: 'critical', label: 'Incidencias críticas' },
  { value: 'performance', label: 'Rendimiento de servicios' },
  { value: 'inventory', label: 'Inventario de targets' },
];

const TIME_OPTIONS = ['ALL', '24H', '7D', '30D'];
const STATUS_OPTIONS = ['ALL', 'UP', 'DOWN', 'PAUSED', 'UNKNOWN'];

function matchesWindow(timestamp, windowKey) {
  if (windowKey === 'ALL') return true;

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (windowKey === '24H') return ageMs <= 24 * 60 * 60 * 1000;
  if (windowKey === '7D') return ageMs <= 7 * 24 * 60 * 60 * 1000;
  if (windowKey === '30D') return ageMs <= 30 * 24 * 60 * 60 * 1000;

  return true;
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
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : 'N/A';
}

function statusTone(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'UP') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  if (normalized === 'DOWN') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  if (normalized === 'PAUSED') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
}

export const Reports = ({ services, events }) => {
  const [preset, setPreset] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('24H');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const serviceOptions = useMemo(() => {
    const names = Array.from(new Set(services.map((service) => service.name).filter(Boolean)));
    return ['ALL', ...names.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))];
  }, [services]);

  const scopedServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      if (serviceFilter !== 'ALL' && service.name !== serviceFilter) return false;
      if (statusFilter !== 'ALL' && String(service.status || '').toUpperCase() !== statusFilter) return false;

      if (!normalizedQuery) return true;

      return [service.name, service.target, service.type, service.status, service.priority]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(normalizedQuery));
    });
  }, [query, serviceFilter, services, statusFilter]);

  const scopedEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      if (!matchesWindow(event.timestamp, timeFilter)) return false;
      if (serviceFilter !== 'ALL' && event.serviceName !== serviceFilter) return false;

      if (preset === 'critical' && event.type !== 'CRITICAL') return false;

      if (!normalizedQuery) return true;

      return [event.serviceName, event.status, event.type, event.message, event.targetId]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(normalizedQuery));
    });
  }, [events, preset, query, serviceFilter, timeFilter]);

  const summary = useMemo(() => {
    const totalServices = scopedServices.length;
    const upServices = scopedServices.filter((service) => service.status === 'UP').length;
    const downServices = scopedServices.filter((service) => service.status === 'DOWN').length;
    const pausedServices = scopedServices.filter((service) => service.status === 'PAUSED').length;
    const avgUptime = totalServices > 0
      ? scopedServices.reduce((acc, service) => acc + Number(service.uptime || 0), 0) / totalServices
      : 0;

    const avgLatency = totalServices > 0
      ? scopedServices.reduce((acc, service) => acc + Number(service.latencies?.at(-1) || 0), 0) / totalServices
      : 0;

    const criticalEvents = scopedEvents.filter((event) => event.type === 'CRITICAL').length;
    const recoveryEvents = scopedEvents.filter((event) => event.type === 'RECOVERY').length;

    const groupedByService = new Map();
    for (const event of scopedEvents.filter((event) => event.type === 'CRITICAL')) {
      const key = event.serviceName || String(event.targetId || 'unknown');
      groupedByService.set(key, (groupedByService.get(key) || 0) + 1);
    }

    const topIncident = Array.from(groupedByService.entries())
      .sort((a, b) => b[1] - a[1])
      .at(0);

    const mostUnstable = scopedServices
      .slice()
      .sort((a, b) => Number(a.uptime || 0) - Number(b.uptime || 0))[0] || null;

    return {
      totalServices,
      upServices,
      downServices,
      pausedServices,
      avgUptime,
      avgLatency,
      criticalEvents,
      recoveryEvents,
      topIncident,
      mostUnstable,
    };
  }, [scopedEvents, scopedServices]);

  const reportRows = useMemo(() => {
    if (preset === 'critical') {
      return scopedEvents
        .filter((event) => event.type === 'CRITICAL')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((event) => ({
          kind: 'event',
          timestamp: event.timestamp,
          name: event.serviceName || 'Sistema',
          target: event.targetId || '-',
          type: event.type,
          status: event.status || 'UNKNOWN',
          latency: event.latencyMs == null ? 'N/A' : `${event.latencyMs} ms`,
          message: event.message,
        }));
    }

    return scopedServices
      .slice()
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }))
      .map((service) => ({
        kind: 'service',
        name: service.name,
        target: service.target,
        type: service.type,
        status: service.status,
        priority: service.priority,
        uptime: formatPercent(service.uptime),
        latency: service.latencies?.at(-1) == null ? 'N/A' : `${service.latencies.at(-1)} ms`,
      }));
  }, [preset, scopedEvents, scopedServices]);

  const reportTitle = useMemo(() => {
    const presetLabel = REPORT_PRESETS.find((option) => option.value === preset)?.label || 'Reporte';
    return `${presetLabel} · ${timeFilter}`;
  }, [preset, timeFilter]);

  const handleExportCsv = () => {
    const lines = [];
    lines.push(['Reporte', reportTitle].map(csvEscape).join(','));
    lines.push(['Generado', new Date().toISOString()].map(csvEscape).join(','));
    lines.push('');

    if (preset === 'critical') {
      lines.push(['Fecha', 'Servicio', 'Target ID', 'Tipo', 'Estado', 'Latencia', 'Mensaje'].map(csvEscape).join(','));
      reportRows.forEach((row) => {
        lines.push([
          row.timestamp,
          row.name,
          row.target,
          row.type,
          row.status,
          row.latency,
          row.message,
        ].map(csvEscape).join(','));
      });
    } else {
      lines.push(['Servicio', 'Target', 'Tipo', 'Estado', 'Prioridad', 'Uptime', 'Latencia'].map(csvEscape).join(','));
      reportRows.forEach((row) => {
        lines.push([
          row.name,
          row.target,
          row.type,
          row.status,
          row.priority,
          row.uptime,
          row.latency,
        ].map(csvEscape).join(','));
      });
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${preset}-${timeFilter.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    const rowsHtml = preset === 'critical'
      ? reportRows.map((row) => `
          <tr>
            <td>${escapeHtml(absoluteTime(row.timestamp))}</td>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(row.latency)}</td>
            <td>${escapeHtml(row.message)}</td>
          </tr>
        `).join('')
      : reportRows.map((row) => `
          <tr>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.target)}</td>
            <td>${escapeHtml(row.type)}</td>
            <td>${escapeHtml(row.status)}</td>
            <td>${escapeHtml(row.priority)}</td>
            <td>${escapeHtml(row.uptime)}</td>
            <td>${escapeHtml(row.latency)}</td>
          </tr>
        `).join('');

    const columnsHtml = preset === 'critical'
      ? '<th>Fecha</th><th>Servicio</th><th>Estado</th><th>Latencia</th><th>Mensaje</th>'
      : '<th>Servicio</th><th>Target</th><th>Tipo</th><th>Estado</th><th>Prioridad</th><th>Uptime</th><th>Latencia</th>';

    const metricsHtml = `
      <div class="grid">
        <div class="metric"><span>Total servicios</span><strong>${summary.totalServices}</strong></div>
        <div class="metric"><span>Servicios UP</span><strong>${summary.upServices}</strong></div>
        <div class="metric"><span>Servicios DOWN</span><strong>${summary.downServices}</strong></div>
        <div class="metric"><span>Uptime medio</span><strong>${formatPercent(summary.avgUptime)}</strong></div>
        <div class="metric"><span>Latencia media</span><strong>${summary.avgLatency ? `${Math.round(summary.avgLatency)} ms` : 'N/A'}</strong></div>
        <div class="metric"><span>Alertas críticas</span><strong>${summary.criticalEvents}</strong></div>
      </div>
    `;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(reportTitle)}</title>
          <style>
            :root { color-scheme: dark; }
            body {
              margin: 0;
              padding: 32px;
              background: #0f172a;
              color: #e2e8f0;
              font-family: Inter, Arial, sans-serif;
            }
            h1 { margin: 0 0 8px; font-size: 28px; }
            p { margin: 0; color: #94a3b8; }
            .panel {
              margin-top: 20px;
              padding: 20px;
              border: 1px solid #334155;
              border-radius: 16px;
              background: #111827;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
            }
            .metric {
              padding: 14px;
              border-radius: 12px;
              border: 1px solid #334155;
              background: #0f172a;
            }
            .metric span { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: #94a3b8; }
            .metric strong { display: block; margin-top: 8px; font-size: 20px; color: #f8fafc; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border-bottom: 1px solid #334155; padding: 10px 8px; text-align: left; font-size: 12px; vertical-align: top; }
            th { color: #cbd5e1; text-transform: uppercase; letter-spacing: .08em; font-size: 10px; }
            tr:nth-child(even) td { background: rgba(15, 23, 42, 0.6); }
            .footer { margin-top: 18px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p>Generado el ${escapeHtml(new Date().toLocaleString('es-ES'))}</p>
          <div class="panel">
            ${metricsHtml}
            <table>
              <thead><tr>${columnsHtml}</tr></thead>
              <tbody>${rowsHtml || '<tr><td colspan="7">Sin datos disponibles</td></tr>'}</tbody>
            </table>
            <div class="footer">Usa la opción de impresión del navegador para guardar este reporte como PDF.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  };

  const latestService = summary.mostUnstable;
  const topIncident = summary.topIncident;

  return (
    <div className="w-full space-y-4 pb-5">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
              <FileText className="h-3.5 w-3.5" />
              Centro de Reportes
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">Reportes operativos y personalizados</h2>
            <p className="mt-1.5 max-w-3xl text-xs text-slate-400 md:text-sm">
              Consulta resúmenes, incidencias críticas y métricas de rendimiento usando datos reales del tablero. Exporta el reporte actual a CSV o PDF.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
            Vista activa: <span className="font-semibold text-slate-100">{REPORT_PRESETS.find((option) => option.value === preset)?.label}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Objetivos</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{summary.totalServices}</div>
          <p className="mt-1 text-xs text-slate-500">{summary.upServices} UP · {summary.downServices} DOWN · {summary.pausedServices} PAUSED</p>
        </div>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70">Uptime medio</div>
          <div className="mt-1 text-xl font-semibold text-emerald-300">{formatPercent(summary.avgUptime)}</div>
        </div>
        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">Latencia media</div>
          <div className="mt-1 text-xl font-semibold text-cyan-300">{summary.avgLatency ? `${Math.round(summary.avgLatency)} ms` : 'N/A'}</div>
        </div>
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-rose-300/70">Alertas críticas</div>
          <div className="mt-1 text-xl font-semibold text-rose-300">{summary.criticalEvents}</div>
        </div>
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
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
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
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{absoluteTime(row.timestamp)}</td>
                    <td className="px-3 py-2 font-medium text-slate-100">{row.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone(row.status)}`}>{row.status}</span>
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
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusTone(row.status)}`}>{row.status}</span>
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