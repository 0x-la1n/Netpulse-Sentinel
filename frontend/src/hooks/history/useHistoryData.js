import { useEffect, useMemo, useState } from 'react';
import { buildAuthHeaders } from '../../lib/api';

export function useHistoryData({ services, token, apiUrl, refreshIntervalMs = 15000, bucketMinutes = 10 }) {
  const [selectedId, setSelectedId] = useState('');
  const [latencyPoints, setLatencyPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedServiceId = useMemo(() => {
    if (services.length === 0) return '';

    const hasSelected = services.some((service) => String(service.id) === String(selectedId));
    return hasSelected ? String(selectedId) : String(services[0].id);
  }, [services, selectedId]);

  const selectedService = useMemo(
    () => services.find((service) => String(service.id) === String(selectedServiceId)) || null,
    [services, selectedServiceId]
  );

  useEffect(() => {
    if (!selectedServiceId) {
      if (selectedId !== '') {
        setSelectedId('');
      }
      setLatencyPoints([]);
      return;
    }

    if (selectedId !== selectedServiceId) {
      setSelectedId(selectedServiceId);
    }
  }, [selectedId, selectedServiceId]);

  useEffect(() => {
    if (!token || !selectedServiceId) return;

    const controller = new AbortController();

    const loadLatency = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${apiUrl}/events/${selectedServiceId}/latency?bucketMinutes=${bucketMinutes}`, {
          headers: buildAuthHeaders(token),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar el historial de latencia.');
        }

        const data = await response.json();
        setLatencyPoints(Array.isArray(data) ? data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLatencyPoints([]);
          setLoadError(error.message || 'Error cargando la gráfica.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadLatency();

    const safeInterval = Math.max(3000, Number(refreshIntervalMs) || 15000);
    const refreshTimer = setInterval(() => {
      loadLatency();
    }, safeInterval);

    return () => {
      clearInterval(refreshTimer);
      controller.abort();
    };
  }, [apiUrl, bucketMinutes, refreshIntervalMs, selectedServiceId, token]);

  const chartData = useMemo(() => {
    const labels = latencyPoints.map((point) => {
      const date = new Date(point.checked_at);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const values = latencyPoints.map((point) => (point.latency_ms == null ? 0 : Number(point.latency_ms)));

    return {
      labels,
      datasets: [
        {
          label: 'Latencia (ms)',
          data: values,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.16)',
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
          spanGaps: true,
        },
      ],
    };
  }, [latencyPoints]);

  const latestLatency = latencyPoints.at(-1)?.latency_ms ?? null;

  return {
    selectedId,
    setSelectedId,
    selectedService,
    latencyPoints,
    isLoading,
    loadError,
    chartData,
    latestLatency,
  };
}
