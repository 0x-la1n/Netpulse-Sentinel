import React from 'react';
import {
  CircleHelp,
  PlusCircle,
  Play,
  Pause,
  Globe,
  Activity,
  ShieldCheck,
  LayoutDashboard,
  BarChart3,
  BellRing,
  FileText,
  Settings2,
  Users,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from './ui/PageHeader';

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
      <PageHeader
        icon={CircleHelp}
        chipLabel="Centro de Ayuda"
        title="Guia Rapida de Uso"
        description="Manual de operacion para dashboard, modulos de analitica, configuracion avanzada y control por roles."
      />

      <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
          Flujo recomendado de uso (inicio rapido)
        </h3>

        <ol className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
          <li className="rounded-lg bg-slate-950/50 p-3">
            <p className="font-medium text-slate-200">1) Verifica sesion y permisos</p>
            <p className="text-slate-400 mt-1">Si eres Operador veras solo modulos habilitados por el Administrador.</p>
          </li>
          <li className="rounded-lg bg-slate-950/50 p-3">
            <p className="font-medium text-slate-200">2) Activa Polling</p>
            <p className="text-slate-400 mt-1">Mantiene estados y latencias actualizadas en tiempo real en Dashboard y Alertas.</p>
          </li>
          <li className="rounded-lg bg-slate-950/50 p-3">
            <p className="font-medium text-slate-200">3) Crea o edita nodos</p>
            <p className="text-slate-400 mt-1">Define tipo (HTTP, PING o PORT), prioridad y objetivo tecnico por servicio.</p>
          </li>
          <li className="rounded-lg bg-slate-950/50 p-3">
            <p className="font-medium text-slate-200">4) Ajusta configuracion del motor</p>
            <p className="text-slate-400 mt-1">Controla frecuencia, umbrales, historial y modo de alta densidad.</p>
          </li>
        </ol>
      </article>

      <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <LayoutDashboard className="w-4.5 h-4.5 text-emerald-400" />
          Que hace cada modulo
        </h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-sm text-slate-300">
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-cyan-300" />Dashboard</p>
            <p className="text-slate-400 mt-1">Vista operativa principal: estado, latencia, SLA y acciones rapidas por nodo.</p>
          </div>
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-300" />Historial</p>
            <p className="text-slate-400 mt-1">Curva de latencia historica por servicio con refresco configurable.</p>
          </div>
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><FileText className="w-4 h-4 text-cyan-300" />Reportes</p>
            <p className="text-slate-400 mt-1">Resumen operativo por periodos y exportes del estado del monitoreo.</p>
          </div>
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><BellRing className="w-4 h-4 text-cyan-300" />Alertas</p>
            <p className="text-slate-400 mt-1">Eventos criticos, recuperaciones y trazabilidad del audit trail.</p>
          </div>
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><Settings2 className="w-4 h-4 text-cyan-300" />Configuracion</p>
            <p className="text-slate-400 mt-1">Motor de monitoreo, seguridad, usuarios/roles y opciones por seccion.</p>
          </div>
          <div className="rounded-lg bg-slate-950/50 p-3 border border-slate-800">
            <p className="font-medium text-slate-100 flex items-center gap-2"><CircleHelp className="w-4 h-4 text-cyan-300" />Ayuda</p>
            <p className="text-slate-400 mt-1">Guia operativa y referencia rapida para uso diario del panel.</p>
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Users className="w-4.5 h-4.5 text-emerald-400" />
          Roles y permisos
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-l-lg">Rol</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2">Alcance</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-r-lg">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-emerald-300 whitespace-nowrap">Administrador</td>
                <td className="px-3 py-2 text-slate-200">Acceso total a todos los modulos y ajustes del sistema.</td>
                <td className="px-3 py-2 text-slate-400">Gestiona usuarios, permisos por operador y configuracion global.</td>
              </tr>
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-cyan-300 whitespace-nowrap">Operador</td>
                <td className="px-3 py-2 text-slate-200">Acceso configurable por usuario segun permisos asignados.</td>
                <td className="px-3 py-2 text-slate-400">Puede ocultar o bloquear secciones como Motor, Usuarios o Base de Datos.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

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

            <div className="rounded-lg bg-slate-950/50 p-3">
              <p className="font-medium text-slate-200">4) Prioridad operativa</p>
              <p className="text-slate-400 mt-1">Usa CRITICO/HIGH para servicios sensibles y mejorar enfoque en incidentes.</p>
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

            <div className="rounded-lg bg-slate-950/50 p-3 flex items-start gap-2">
              <SlidersHorizontal className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
              <p>
                Intervalo Global en Configuracion define el ritmo de chequeo; menor valor = mayor sensibilidad y mayor carga.
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Settings2 className="w-4.5 h-4.5 text-emerald-400" />
          Configuracion avanzada: campos clave
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-l-lg">Campo</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2">Impacto</th>
                <th className="text-left font-semibold text-slate-300 bg-slate-950/60 px-3 py-2 rounded-r-lg">Recomendacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-slate-100">Intervalo global de polling</td>
                <td className="px-3 py-2 text-slate-300">Frecuencia de chequeo y refresco operativo.</td>
                <td className="px-3 py-2 text-slate-400">1000-5000 ms para operación normal.</td>
              </tr>
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-slate-100">Umbral de fallos consecutivos</td>
                <td className="px-3 py-2 text-slate-300">Sensibilidad para marcar DOWN.</td>
                <td className="px-3 py-2 text-slate-400">2-4 para balance entre ruido y detección.</td>
              </tr>
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-slate-100">Puntos por grafica (Sparkline)</td>
                <td className="px-3 py-2 text-slate-300">Longitud visual del historial en tarjetas.</td>
                <td className="px-3 py-2 text-slate-400">10-30 para lectura rapida en grid.</td>
              </tr>
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-slate-100">Modo Alta Densidad</td>
                <td className="px-3 py-2 text-slate-300">Activa tarjetas compactas y mas columnas en Dashboard.</td>
                <td className="px-3 py-2 text-slate-400">Ideal para NOC o alta cantidad de nodos.</td>
              </tr>
              <tr className="bg-slate-950/20">
                <td className="px-3 py-2 text-slate-100">Refresco de historial</td>
                <td className="px-3 py-2 text-slate-300">Frecuencia de actualización de la curva de 24h.</td>
                <td className="px-3 py-2 text-slate-400">5000-15000 ms según carga disponible.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

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
