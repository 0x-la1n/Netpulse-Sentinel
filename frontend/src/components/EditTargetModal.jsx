import React, { useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';

function getInitialTargetValue(service) {
  if (!service) return '';

  if (service.type === 'PORT') {
    const raw = String(service.target || '');
    const pieces = raw.split(':');
    if (pieces.length >= 2) {
      return raw;
    }

    return `${raw}:443`;
  }

  return String(service.target || '');
}

export const EditTargetModal = ({ service, onClose, onSave }) => {
  const [name, setName] = useState(String(service?.name || ''));
  const [type, setType] = useState(String(service?.type || 'HTTP'));
  const [priority, setPriority] = useState(String(service?.priority || 'MEDIUM'));
  const [target, setTarget] = useState(getInitialTargetValue(service));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const placeholder = useMemo(() => {
    if (type === 'HTTP') return 'Ej. https://api.midominio.com';
    if (type === 'PING') return 'Ej. 10.0.0.15 o servidor.local';
    return 'Ej. 10.0.0.15:22';
  }, [type]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setIsSaving(true);

    const result = await onSave({
      id: service.id,
      name: name.trim(),
      type,
      priority,
      target: target.trim(),
      intervalSec: service.intervalSec,
      active: service.status !== 'PAUSED',
    });

    setIsSaving(false);

    if (!result?.ok) {
      setError(result?.error || 'No se pudo guardar los cambios.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/20">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-400" />
            Editar Objetivo
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors" disabled={isSaving}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Nombre del Servicio</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              placeholder="Ej. API de Pagos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Tipo de Protocolo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none"
            >
              <option value="HTTP">HTTP/HTTPS</option>
              <option value="PING">ICMP Ping</option>
              <option value="PORT">TCP Port</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none"
            >
              <option value="CRITICAL">Critico</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Medio</option>
              <option value="LOW">Bajo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Objetivo (URL, IP o host:puerto)</label>
            <input
              required
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              placeholder={placeholder}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
