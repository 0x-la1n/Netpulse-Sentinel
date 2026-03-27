import React, { useState, useEffect } from 'react';

export const Configuration = ({ settings, onSave }) => {
  const [local, setLocal] = useState({
    pollInterval: 2000,
    failureRate: 0.1,
    eventLimit: 50,
    latencyHistory: 15,
  });

  useEffect(() => {
    if (settings) {
      setLocal({
        pollInterval: settings.pollInterval || 2000,
        failureRate: settings.failureRate || 0.1,
        eventLimit: settings.eventLimit || 50,
        latencyHistory: settings.latencyHistory || 15,
      });
    }
  }, [settings]);
//
  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalized = {
      pollInterval: Math.max(200, Number(local.pollInterval)),
      failureRate: Math.min(1, Math.max(0, Number(local.failureRate))),
      eventLimit: Math.max(10, Number(local.eventLimit)),
      latencyHistory: Math.max(5, Number(local.latencyHistory)),
    };
    onSave(normalized);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-slate-900 border border-slate-800 rounded-2xl">
      <h2 className="text-2xl font-semibold text-emerald-400 mb-3">Configuración</h2>
      <p className="text-sm text-slate-400 mb-6">Ajusta los parámetros del motor de monitoreo y guarda los cambios.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-slate-300">Intervalo de Polling</span>
            <input
              type="number"
              min="200"
              step="100"
              value={local.pollInterval}
              onChange={e => handleChange('pollInterval', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 p-2"
            />
            <span className="text-xs text-slate-500">Milisegundos entre ciclos (= 200)</span>
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Probabilidad de fallo</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={local.failureRate}
              onChange={e => handleChange('failureRate', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 p-2"
            />
            <span className="text-xs text-slate-500">Valor entre 0 y 1 (e.g. 0.1 = 10%)</span>
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Límite de eventos</span>
            <input
              type="number"
              min="10"
              step="1"
              value={local.eventLimit}
              onChange={e => handleChange('eventLimit', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 p-2"
            />
            <span className="text-xs text-slate-500">Máximo de eventos mostrados en Audit Trail</span>
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Historial de latencias</span>
            <input
              type="number"
              min="5"
              step="1"
              value={local.latencyHistory}
              onChange={e => handleChange('latencyHistory', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 p-2"
            />
            <span className="text-xs text-slate-500">Cantidad de puntos de latencia guardados por servicio</span>
          </label>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition"
          >
            Guardar Configuración
          </button>
          <span className="text-sm text-slate-400">Tus settings se aplicarán inmediatamente.</span>
        </div>
      </form>
    </div>
  );
};
