import React from 'react';
import { BellRing, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export const Alerts = ({ events }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'ERROR':
        return 'border-red-800 bg-red-950/20';
      case 'WARNING':
        return 'border-yellow-800 bg-yellow-950/20';
      case 'SUCCESS':
        return 'border-green-800 bg-green-950/20';
      case 'INFO':
      default:
        return 'border-blue-800 bg-blue-950/20';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <BellRing className="w-8 h-8 text-emerald-400" />
        <div>
          <h2 className="text-2xl font-semibold text-emerald-400">Alertas y Eventos</h2>
          <p className="text-sm text-slate-400">Historial de eventos del sistema de monitoreo</p>
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <BellRing className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">Sin eventos</h3>
            <p className="text-slate-500">No hay eventos registrados en el sistema.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-xl border ${getEventColor(event.type)}`}
            >
              <div className="flex items-start gap-3">
                {getEventIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-200">{event.serviceName}</span>
                    <span className="text-xs text-slate-500">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {event.message}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      event.type === 'ERROR' ? 'bg-red-900/50 text-red-300' :
                      event.type === 'WARNING' ? 'bg-yellow-900/50 text-yellow-300' :
                      event.type === 'SUCCESS' ? 'bg-green-900/50 text-green-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};