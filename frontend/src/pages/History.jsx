import React, { useMemo } from 'react';
import { ArrowLeftRight, BarChart3, Clock3, Gauge, Server } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/ui/KpiCard';
import { ServiceLogo } from '../components/ui/ServiceLogo';
import { useHistoryData } from '../hooks/history/useHistoryData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const History = ({ services, token, apiUrl, refreshIntervalMs = 15000 }) => {
  const bucketMinutes = 10;
  const {
    setSelectedId,
    selectedService,
    latencyPoints,
    isLoading,
    loadError,
    chartData,
    latestLatency,
  } = useHistoryData({
    services,
    token,
    apiUrl,
    refreshIntervalMs,
    bucketMinutes,
  });

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

  const availablePoints = latencyPoints.length;

  return (
    <div className="w-full space-y-4 pb-5 text-slate-100">
      <PageHeader
        icon={BarChart3}
        chipLabel="Centro de Historial"
        title="Historial de latencia"
        rightContent={<span className="inline-flex items-center gap-2"><Server className="h-4 w-4 text-slate-400" />Servicio activo: <span className="font-semibold text-slate-100">{selectedService?.name || 'Sin servicios'}</span></span>}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <KpiCard label="Puntos" value={availablePoints} />
        <KpiCard label="Latencia actual" value={latestLatency == null ? 'N/A' : `${latestLatency} ms`} />
        <KpiCard label="Cobertura" value="24 h" />
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
                    <div className="min-w-0 flex items-center gap-3">
                      <ServiceLogo service={service} sizeClass="h-8 w-8" />

                      <div className="min-w-0">
                        <div className="font-medium text-slate-100 truncate">{service.name}</div>
                        <div className="mt-1 text-xs text-slate-500 truncate">{service.type} · {service.target}</div>
                      </div>
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