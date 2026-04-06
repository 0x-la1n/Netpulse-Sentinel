import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Gauge, History, Save, ShieldAlert, SlidersHorizontal } from 'lucide-react';

const DEFAULT_SETTINGS = {
  pollInterval: 2000,
  failureThreshold: 3,
  eventLimit: 50,
  latencyHistory: 15,
  historyRefreshMs: 15000,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export const Configuration = ({ settings, onSave }) => {
  const [local, setLocal] = useState(DEFAULT_SETTINGS);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (!settings) return;

    setLocal({
      pollInterval: Number(settings.pollInterval || DEFAULT_SETTINGS.pollInterval),
      failureThreshold: Number(settings.failureThreshold || DEFAULT_SETTINGS.failureThreshold),
      eventLimit: Number(settings.eventLimit || DEFAULT_SETTINGS.eventLimit),
      latencyHistory: Number(settings.latencyHistory || DEFAULT_SETTINGS.latencyHistory),
      historyRefreshMs: Number(settings.historyRefreshMs || DEFAULT_SETTINGS.historyRefreshMs),
    });
  }, [settings]);

  const handleChange = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    if (saveState !== 'idle') {
      setSaveState('idle');
    }
  };

  const normalizedSettings = useMemo(() => ({
    pollInterval: clamp(Number(local.pollInterval) || DEFAULT_SETTINGS.pollInterval, 200, 60000),
    failureThreshold: clamp(Number(local.failureThreshold) || DEFAULT_SETTINGS.failureThreshold, 1, 10),
    eventLimit: clamp(Number(local.eventLimit) || DEFAULT_SETTINGS.eventLimit, 10, 500),
    latencyHistory: clamp(Number(local.latencyHistory) || DEFAULT_SETTINGS.latencyHistory, 5, 120),
    historyRefreshMs: clamp(Number(local.historyRefreshMs) || DEFAULT_SETTINGS.historyRefreshMs, 3000, 60000),
  }), [local]);

  const handleReset = () => {
    setLocal({ ...DEFAULT_SETTINGS });
    setSaveState('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaveState('saving');

    const ok = await onSave(normalizedSettings);
    setSaveState(ok ? 'saved' : 'error');
  };

  return (
    <div className="w-full space-y-4 pb-5">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-[11px] font-semibold text-emerald-300">
              <SlidersHorizontal className="h-3 w-3" />
              Control Center
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-100 md:text-2xl">Configuración avanzada de monitoreo</h2>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-400 md:text-sm">
              Ajusta comportamiento del poller, sensibilidad de fallos y densidad visual del dashboard e historial.
              Los cambios se aplican inmediatamente al guardar.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-400">
            Entorno activo: <span className="font-semibold text-slate-200">Producción local</span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-100">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Motor de monitoreo</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <span className="text-sm font-medium text-slate-200">Intervalo global de polling (ms)</span>
              <input
                type="number"
                min="200"
                max="60000"
                step="100"
                value={local.pollInterval}
                onChange={(e) => handleChange('pollInterval', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100"
              />
              <span className="mt-1.5 block text-[11px] text-slate-500">Rango recomendado: 1000 - 10000 ms.</span>
            </label>

            <label className="block rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <span className="text-sm font-medium text-slate-200">Refresco de historial (ms)</span>
              <input
                type="number"
                min="3000"
                max="60000"
                step="1000"
                value={local.historyRefreshMs}
                onChange={(e) => handleChange('historyRefreshMs', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100"
              />
              <span className="mt-1.5 block text-[11px] text-slate-500">Controla cada cuánto se actualiza la curva de 24h.</span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-100">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Resiliencia y alertas</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <span className="text-sm font-medium text-slate-200">Umbral de fallos consecutivos</span>
              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={local.failureThreshold}
                onChange={(e) => handleChange('failureThreshold', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100"
              />
              <span className="mt-1.5 block text-[11px] text-slate-500">El objetivo cambia a DOWN al alcanzar este valor.</span>
            </label>

            <label className="block rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <span className="text-sm font-medium text-slate-200">Límite de eventos en Audit Trail</span>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={local.eventLimit}
                onChange={(e) => handleChange('eventLimit', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100"
              />
              <span className="mt-1.5 block text-[11px] text-slate-500">Máximo de eventos visibles en el panel principal.</span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-3 flex items-center gap-2 text-slate-100">
            <History className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Dashboard e historial</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <span className="text-sm font-medium text-slate-200">Ventana de latencias por servicio</span>
              <input
                type="number"
                min="5"
                max="120"
                step="1"
                value={local.latencyHistory}
                onChange={(e) => handleChange('latencyHistory', e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-100"
              />
              <span className="mt-1.5 block text-[11px] text-slate-500">Cantidad de puntos de sparkline para cada tarjeta.</span>
            </label>

            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Gauge className="h-4 w-4 text-emerald-400" />
                Vista previa normalizada
              </div>
              <ul className="mt-2.5 space-y-1.5 text-[11px] text-slate-400">
                <li>Polling global: {normalizedSettings.pollInterval} ms</li>
                <li>Umbral DOWN: {normalizedSettings.failureThreshold} fallos</li>
                <li>Eventos visibles: {normalizedSettings.eventLimit}</li>
                <li>Sparkline puntos: {normalizedSettings.latencyHistory}</li>
                <li>Refresco historial: {normalizedSettings.historyRefreshMs} ms</li>
              </ul>
            </div>
          </div>
        </section>

        <div className="sticky bottom-4 z-10 rounded-xl border border-slate-800 bg-slate-900/95 p-3 backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-400 md:text-sm">
              {saveState === 'saved' && 'Configuración guardada y aplicada correctamente.'}
              {saveState === 'error' && 'No se pudo guardar la configuración. Revisa los datos e intenta nuevamente.'}
              {saveState === 'saving' && 'Guardando configuración...'}
              {saveState === 'idle' && 'Puedes ajustar cualquier parámetro y guardar para aplicar cambios.'}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                Restablecer
              </button>
              <button
                type="submit"
                disabled={saveState === 'saving'}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-70"
              >
                <Save className="h-3.5 w-3.5" />
                {saveState === 'saving' ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
