import { useMemo, useState } from 'react';
import { inTimeWindow } from '../../lib/time';

const REPORT_PRESETS = [
  { value: 'overview', label: 'Resumen operativo' },
  { value: 'critical', label: 'Incidencias criticas' },
  { value: 'performance', label: 'Rendimiento de servicios' },
  { value: 'inventory', label: 'Inventario de targets' },
];

const TIME_OPTIONS = ['ALL', '24H', '7D', '30D'];
const STATUS_OPTIONS = ['ALL', 'UP', 'DOWN', 'PAUSED', 'UNKNOWN'];

function formatPercent(value) {
  return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}%` : 'N/A';
}

export function useReportsData(services, events) {
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
      if (!inTimeWindow(event.timestamp, timeFilter)) return false;
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

  return {
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
  };
}
