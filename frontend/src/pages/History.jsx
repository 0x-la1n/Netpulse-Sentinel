import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, BarChart3, Clock3, Gauge, Server } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const History = ({ services, token, apiUrl, refreshIntervalMs = 15000 }) => {
  const [selectedId, setSelectedId] = useState('');
  const [latencyPoints, setLatencyPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const bucketMinutes = 10;

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
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    normalized: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 8,
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.35)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.35)',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  }), []);

  const latestLatency = latencyPoints.at(-1)?.latency_ms ?? null;
  const availablePoints = latencyPoints.length;

  return (
    <div className="w-full space-y-4 pb-5 text-slate-100">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
            <BarChart3 className="h-3.5 w-3.5" />
            Centro de Historial
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100 md:text-2xl">Historial de latencia</h2>
          <p className="mt-1.5 max-w-3xl text-xs text-slate-400 md:text-sm">
            Gráfica de las últimas 24 horas por objetivo, agregada en bloques de {bucketMinutes} minutos para mantener el panel fluido.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
          <Server className="h-4 w-4 text-slate-400" />
          Servicio activo: <span className="font-semibold text-slate-100">{selectedService?.name || 'Sin servicios'}</span>
        </div>
      </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Puntos</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{availablePoints}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Latencia actual</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{latestLatency == null ? 'N/A' : `${latestLatency} ms`}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Cobertura</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">24 h</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ArrowLeftRight className="h-4 w-4 text-emerald-400" />
            Objetivos
          </div>
          <div className="mt-4 space-y-2 max-h-[28rem] overflow-y-auto pr-1 custom-scrollbar">
            {services.map((service) => {
              const isSelected = String(service.id) === String(selectedService?.id);

              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedId(String(service.id))}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-100">{service.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{service.type} · {service.target}</div>
                    </div>
                    <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${service.status === 'UP' ? 'bg-emerald-500/10 text-emerald-300' : service.status === 'DOWN' ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-500/10 text-slate-300'}`}>
                      {service.status}
                    </div>
                  </div>
                </button>
              );
            })}

            {services.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">
                No hay servicios disponibles para graficar.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100 md:text-lg">Latencia de las últimas 24 horas</h3>
              <p className="mt-1 text-xs text-slate-400 md:text-sm">
                {selectedService ? `${selectedService.name} · ${selectedService.target}` : 'Selecciona un servicio para ver su curva.'}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-400">
              <Clock3 className="h-3.5 w-3.5 text-slate-500" />
              UTC / 24h · {bucketMinutes}m
            </div>
          </div>

          <div className="relative mt-5 h-[22rem] rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            {isLoading && latencyPoints.length > 0 && (
              <div className="absolute right-4 top-3 z-10 rounded-full border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-[11px] text-slate-300">
                Actualizando...
              </div>
            )}

            {isLoading && latencyPoints.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Cargando datos de latencia...
              </div>
            ) : loadError ? (
              <div className="flex h-full items-center justify-center text-sm text-rose-300">
                {loadError}
              </div>
            ) : latencyPoints.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No hay registros en las últimas 24 horas.
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5">
              <Gauge className="h-3.5 w-3.5 text-emerald-400" />
              Datos desde /api/events/:targetId/latency
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};