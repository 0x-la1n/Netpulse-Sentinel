import React from 'react';
import { CircleHelp, PlusCircle, Play, Pause, Globe, Activity, ShieldCheck } from 'lucide-react';

const exampleTargets = [
  {
    type: 'HTTP',
    value: 'https://mi-sitio.com',
    useCase: 'Paginas web, APIs REST, landing pages',
  },
  {
    type: 'HTTP',
    value: 'https://api.midominio.com/health',
    useCase: 'Endpoints de salud de servicios',
  },
  {
    type: 'PING',
    value: '8.8.8.8',
    useCase: 'IP publica o privada para validar conectividad',
  },
  {
    type: 'PING',
    value: '1.1.1.1',
    useCase: 'DNS publicos o routers de red',
  },
  {
    type: 'PORT',
    value: '127.0.0.1:3306',
    useCase: 'Base de datos, SSH, servicios TCP internos',
  },
  {
    type: 'PORT',
    value: '10.0.0.15:22',
    useCase: 'Puertos especificos en servidores de infraestructura',
  },
];

export const HelpManual = () => {
  return (
    <section className="w-full space-y-6 pb-4">
      <header className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-5 lg:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CircleHelp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-slate-100">Guia Rapida de Uso</h2>
            <p className="text-sm text-slate-300 mt-1">
              Mini manual para usar Nuevo Objetivo y Polling sin errores.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-4.5 h-4.5 text-emerald-400" />
            Como usar Nuevo Objetivo
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-lg bg-slate-950/50 p-3">
              <p className="font-medium text-slate-200">1) Nombre del Servicio</p>
              <p className="text-slate-400 mt-1">Pon un nombre claro: API Pagos, Web Principal, DB Produccion.</p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3">
              <p className="font-medium text-slate-200">2) Tipo de Protocolo</p>
              <p className="text-slate-400 mt-1">HTTP para URLs, PING para IP/DNS, PORT para host:puerto.</p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3">
              <p className="font-medium text-slate-200">3) Objetivo</p>
              <p className="text-slate-400 mt-1">HTTP: URL completa. PING: IP o host. PORT: host:puerto.</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-emerald-400" />
            Que hace el boton de Polling
          </h3>

          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-lg bg-slate-950/50 p-3 flex items-start gap-2">
              <Play className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <p>
                Iniciar Polling: comienza la actualizacion periodica de estado, latencia, reintentos y eventos.
              </p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3 flex items-start gap-2">
              <Pause className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
              <p>
                Pausar Polling: congela las comprobaciones para analizar el tablero sin cambios en tiempo real.
              </p>
            </div>

            <div className="rounded-lg bg-slate-950/50 p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 text-sky-400 shrink-0" />
              <p>
                Recomendacion: deja Polling activo en operacion normal, pausalo solo para inspeccion puntual.
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Globe className="w-4.5 h-4.5 text-emerald-400" />
          Ejemplos de objetivos que puedes monitorear
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-l-lg">Tipo</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2">Ejemplo de valor</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-r-lg">Uso recomendado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {exampleTargets.map((row, index) => (
                <tr key={`${row.type}-${index}`} className="bg-slate-950/20">
                  <td className="px-3 py-2 text-emerald-300 whitespace-nowrap">{row.type}</td>
                  <td className="px-3 py-2 text-slate-200 break-all">{row.value}</td>
                  <td className="px-3 py-2 text-slate-400">{row.useCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};
