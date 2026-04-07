import { useMemo, useState } from 'react';
import { inTimeWindow } from '../../lib/time';

const TYPE_OPTIONS = ['ALL', 'CRITICAL', 'RECOVERY', 'INFO'];
const TIME_OPTIONS = ['ALL', '15M', '1H', '24H', '7D'];

export function useAlertsData(events) {
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

      const haystack = [evt.serviceName, evt.type, evt.status, evt.message]
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

  return {
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
  };
}
