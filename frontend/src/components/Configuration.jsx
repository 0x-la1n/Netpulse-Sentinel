import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BellRing,
  Database,
  Gauge,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { buildAuthHeaders } from '../lib/api';
import { hasPermission, resolvePermissions } from '../lib/permissions';

const DEFAULT_SETTINGS = {
  pollInterval: 2000,
  failureThreshold: 3,
  eventLimit: 50,
  latencyHistory: 15,
  historyRefreshMs: 15000,
  denseMode: false,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toLocalSettings(source) {
  return {
    pollInterval: Number(source?.pollInterval || DEFAULT_SETTINGS.pollInterval),
    failureThreshold: Number(source?.failureThreshold || DEFAULT_SETTINGS.failureThreshold),
    eventLimit: Number(source?.eventLimit || DEFAULT_SETTINGS.eventLimit),
    latencyHistory: Number(source?.latencyHistory || DEFAULT_SETTINGS.latencyHistory),
    historyRefreshMs: Number(source?.historyRefreshMs || DEFAULT_SETTINGS.historyRefreshMs),
    denseMode: Boolean(source?.denseMode ?? DEFAULT_SETTINGS.denseMode),
  };
}

const SECTION_ITEMS = [
  { id: 'motor', label: 'Motor de Monitoreo', description: 'Polling, latencias y umbrales', icon: SlidersHorizontal, permissionPath: 'configuration.motor' },
  { id: 'notificaciones', label: 'Notificaciones', description: 'Reglas de alertas y webhooks', icon: BellRing, permissionPath: 'configuration.notifications' },
  { id: 'usuarios', label: 'Usuarios y Roles', description: 'Control de acceso (RBAC)', icon: Users, permissionPath: 'configuration.users' },
  { id: 'seguridad', label: 'Seguridad', description: 'Contraseñas, 2FA y sesiones', icon: Shield, permissionPath: 'configuration.security' },
  { id: 'database', label: 'Base de Datos', description: 'Backups y purga de logs', icon: Database, permissionPath: 'configuration.database' },
];

const OPERATOR_PERMISSION_FIELDS = [
  { key: 'configuration.access', label: 'Acceso a Configuración' },
  { key: 'configuration.motor', label: 'Motor de Monitoreo' },
  { key: 'configuration.users', label: 'Usuarios y Roles' },
  { key: 'configuration.database', label: 'Base de Datos' },
  { key: 'configuration.notifications', label: 'Notificaciones' },
  { key: 'configuration.security', label: 'Seguridad' },
];

function getByPath(source, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  let cursor = source;

  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      return false;
    }
    cursor = cursor[part];
  }

  return Boolean(cursor);
}

function setByPath(source, path, value) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (parts.length === 0) return source;

  const root = { ...(source || {}) };
  let cursor = root;

  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = Boolean(value);
      return;
    }

    const current = cursor[part];
    cursor[part] = current && typeof current === 'object' ? { ...current } : {};
    cursor = cursor[part];
  });

  return root;
}

export const Configuration = ({ settings, onSave, token, apiUrl, updateSession, user }) => {
  const [local, setLocal] = useState(toLocalSettings(settings));
  const [activeSection, setActiveSection] = useState('motor');
  const [saveState, setSaveState] = useState('idle');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordState, setPasswordState] = useState({ status: 'idle', message: '' });
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [savingUserId, setSavingUserId] = useState(null);

  const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
  const currentPermissions = resolvePermissions(user);

  const availableSections = useMemo(
    () => SECTION_ITEMS.filter((section) => isAdmin || hasPermission(user, section.permissionPath)),
    [isAdmin, user]
  );

  const canAccessCurrentSection = useMemo(
    () => availableSections.some((section) => section.id === activeSection),
    [availableSections, activeSection]
  );

  useEffect(() => {
    if (availableSections.length === 0) return;
    if (!canAccessCurrentSection) {
      setActiveSection(availableSections[0].id);
    }
  }, [availableSections, canAccessCurrentSection]);

  useEffect(() => {
    setLocal(toLocalSettings(settings));
  }, [settings]);

  useEffect(() => {
    if (!isAdmin || activeSection !== 'usuarios' || !token || !apiUrl) return;

    let mounted = true;

    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError('');

      try {
        const response = await fetch(`${apiUrl}/users`, {
          headers: buildAuthHeaders(token),
        });

        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo cargar el directorio de usuarios.');
        }

        if (mounted) {
          setUsersList(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (mounted) {
          setUsersError(error.message || 'No se pudo cargar el directorio de usuarios.');
        }
      } finally {
        if (mounted) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [activeSection, apiUrl, isAdmin, token]);

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
    denseMode: Boolean(local.denseMode),
  }), [local]);

  const handleReset = () => {
    setLocal(toLocalSettings(settings));
    setSaveState('idle');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!hasPermission(user, 'configuration.motor')) {
      setSaveState('error');
      return;
    }

    setSaveState('saving');

    const ok = await onSave(normalizedSettings);
    setSaveState(ok ? 'saved' : 'error');
  };

  const handlePasswordFieldChange = (key, value) => {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
    if (passwordState.status !== 'idle') {
      setPasswordState({ status: 'idle', message: '' });
    }
  };

  const togglePasswordVisibility = (key) => {
    setPasswordVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordSubmit = async () => {
    const currentPassword = String(passwordForm.currentPassword || '');
    const newPassword = String(passwordForm.newPassword || '');
    const confirmPassword = String(passwordForm.confirmPassword || '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordState({ status: 'error', message: 'Completa todos los campos de contraseña.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordState({ status: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordState({ status: 'error', message: 'La confirmación no coincide con la nueva contraseña.' });
      return;
    }

    if (!token || !apiUrl) {
      setPasswordState({ status: 'error', message: 'No hay sesión activa para actualizar la contraseña.' });
      return;
    }

    try {
      setPasswordState({ status: 'saving', message: 'Actualizando contraseña...' });

      const response = await fetch(`${apiUrl}/auth/password`, {
        method: 'PUT',
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPasswordState({ status: 'error', message: data?.error || 'No se pudo actualizar la contraseña.' });
        return;
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (typeof updateSession === 'function' && data?.token && data?.user) {
        updateSession({ token: data.token, user: data.user });
      }
      setPasswordState({ status: 'saved', message: data?.message || 'Contraseña actualizada correctamente. Sesión renovada.' });
    } catch {
      setPasswordState({ status: 'error', message: 'Error de red al actualizar la contraseña.' });
    }
  };

  const handleOperatorPermissionToggle = async (targetUser, key, value) => {
    if (!token || !apiUrl) return;

    const nextPermissions = setByPath(targetUser.permissions || {}, key, value);

    if (key === 'configuration.access' && !value) {
      const forced = {
        ...nextPermissions,
        configuration: {
          ...(nextPermissions.configuration || {}),
          motor: false,
          users: false,
          database: false,
          notifications: false,
        },
      };
      await saveOperatorPermissions(targetUser.id, forced);
      return;
    }

    await saveOperatorPermissions(targetUser.id, nextPermissions);
  };

  const saveOperatorPermissions = async (userId, permissions) => {
    try {
      setSavingUserId(userId);
      setUsersError('');

      const response = await fetch(`${apiUrl}/users/${userId}/permissions`, {
        method: 'PUT',
        headers: buildAuthHeaders(token),
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo actualizar permisos.');
      }

      setUsersList((prev) => prev.map((entry) => (entry.id === userId ? data.user : entry)));
    } catch (error) {
      setUsersError(error.message || 'No se pudo actualizar permisos.');
    } finally {
      setSavingUserId(null);
    }
  };

  const statusMessage =
    saveState === 'saved'
      ? 'Configuración guardada y aplicada correctamente.'
      : saveState === 'error'
      ? 'No se pudo guardar la configuración o no tienes permisos suficientes.'
      : saveState === 'saving'
      ? 'Guardando configuración...'
      : 'Los cambios pueden requerir reiniciar el motor de polling.';

  const renderNoAccess = () => (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center px-6">
      <Shield className="h-10 w-10 text-slate-700" />
      <h3 className="mt-3 text-xl font-semibold text-slate-200">Acceso restringido</h3>
      <p className="mt-1.5 max-w-xl text-sm text-slate-500">
        Tu rol actual no tiene permisos para visualizar este apartado. Solicita permisos al Administrador.
      </p>
    </div>
  );

  const renderUsersSection = () => {
    if (!isAdmin) {
      return renderNoAccess();
    }

    return (
      <div className="space-y-3.5">
        <div>
          <h3 className="text-xl font-semibold text-slate-100">Usuarios y Roles</h3>
          <p className="text-sm text-slate-400">El Administrador puede personalizar permisos de cada operador de forma individual.</p>
        </div>

        {usersError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {usersError}
          </div>
        )}

        {usersLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-6 text-sm text-slate-400">Cargando usuarios...</div>
        ) : (
          <div className="space-y-3">
            {usersList.map((entry) => {
              const isOperator = String(entry.role || '').toUpperCase() === 'OPERATOR';
              const entryPermissions = entry.permissions || currentPermissions;

              return (
                <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{entry.name}</div>
                      <div className="text-xs text-slate-400">{entry.email}</div>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${isOperator ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                      {isOperator ? 'Operador' : 'Administrador'}
                    </span>
                  </div>

                  {isOperator ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {OPERATOR_PERMISSION_FIELDS.map((field) => {
                        const checked = getByPath(entryPermissions, field.key);
                        const disabled = savingUserId === entry.id || (field.key !== 'configuration.access' && !getByPath(entryPermissions, 'configuration.access'));

                        return (
                          <label key={field.key} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${disabled ? 'border-slate-800 bg-slate-900/40 text-slate-500' : 'border-slate-700 bg-slate-900 text-slate-200'}`}>
                            <span>{field.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={(e) => handleOperatorPermissionToggle(entry, field.key, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">Acceso total habilitado por rol de Administrador.</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderRightPanel = () => {
    if (!canAccessCurrentSection) {
      return renderNoAccess();
    }

    if (activeSection === 'motor') {
      const isDense = Boolean(local.denseMode);

      return (
        <div className={isDense ? 'space-y-3' : 'space-y-3.5'}>
          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Activity className="h-4 w-4 text-cyan-300" />
              PARAMETROS GLOBALES
            </h3>
          </div>

          <div className={`grid gap-3 md:grid-cols-2 ${isDense ? 'text-[13px]' : ''}`}>
            <label className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <span className="text-sm font-semibold text-slate-100">Intervalo global de polling (ms)</span>
              <input type="number" min="200" max="60000" step="100" value={local.pollInterval} onChange={(e) => handleChange('pollInterval', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100" />
              <span className="mt-2 block text-xs text-slate-500">Rango recomendado: 1000 - 10000 ms.</span>
            </label>

            <label className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <span className="text-sm font-semibold text-slate-100">Umbral de fallos consecutivos</span>
              <input type="number" min="1" max="10" step="1" value={local.failureThreshold} onChange={(e) => handleChange('failureThreshold', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100" />
              <span className="mt-2 block text-xs text-slate-500">El objetivo cambia a DOWN al alcanzar este valor.</span>
            </label>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <Gauge className="h-4 w-4 text-amber-300" />
              INTERFAZ Y RENDERING
            </h3>
          </div>

          <div className={`grid gap-3 md:grid-cols-2 ${isDense ? 'text-[13px]' : ''}`}>
            <label className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <span className="text-sm font-semibold text-slate-100">Puntos por gráfica (Sparkline)</span>
              <input type="number" min="5" max="120" step="1" value={local.latencyHistory} onChange={(e) => handleChange('latencyHistory', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100" />
              <span className="mt-2 block text-xs text-slate-500">Cantidad de picos visuales mostrados en las tarjetas.</span>
            </label>

            <div className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <div className="text-sm font-semibold text-slate-100">Modo Alta Densidad</div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">Reduce márgenes para ver más nodos.</p>
                <button type="button" onClick={() => handleChange('denseMode', !isDense)} className={`relative h-8 w-16 rounded-full border transition-colors ${isDense ? 'border-emerald-500/40 bg-emerald-500/20' : 'border-slate-700 bg-slate-900'}`} aria-label="Alternar modo alta densidad">
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-slate-100 transition-all ${isDense ? 'left-9' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <label className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <span className="text-sm font-semibold text-slate-100">Refresco del historial (ms)</span>
              <input type="number" min="3000" max="60000" step="1000" value={local.historyRefreshMs} onChange={(e) => handleChange('historyRefreshMs', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100" />
              <span className="mt-2 block text-xs text-slate-500">Controla cada cuánto se actualiza la curva de 24h.</span>
            </label>

            <label className={`rounded-xl border border-slate-800 bg-slate-950/40 ${isDense ? 'p-3' : 'p-3.5'}`}>
              <span className="text-sm font-semibold text-slate-100">Eventos en Audit Trail</span>
              <input type="number" min="10" max="500" step="10" value={local.eventLimit} onChange={(e) => handleChange('eventLimit', e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100" />
              <span className="mt-2 block text-xs text-slate-500">Máximo de eventos visibles en el panel principal.</span>
            </label>
          </div>
        </div>
      );
    }

    if (activeSection === 'notificaciones') {
      return (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center px-6">
          <BellRing className="h-10 w-10 text-slate-700" />
          <h3 className="mt-3 text-xl font-semibold text-slate-200">Modulo de alertas</h3>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500">Esta sección está preparada para definir canales, escalamiento y reglas por severidad.</p>
        </div>
      );
    }

    if (activeSection === 'usuarios') {
      return renderUsersSection();
    }

    if (activeSection === 'seguridad') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
            <h3 className="text-xl font-semibold text-slate-100">Autenticación de dos factores (2FA)</h3>
            <p className="mt-1.5 max-w-xl text-sm text-slate-400">Añade una capa extra de seguridad requiriendo un código de tu dispositivo móvil al iniciar sesión.</p>
            <button type="button" className="mt-3 rounded-lg border border-slate-600 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-slate-900">Configurar 2FA</button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
            <h4 className="text-lg font-semibold text-slate-100">Cambiar contraseña</h4>
            <p className="text-sm text-slate-400">Te recomendamos rotar tu contraseña cada 90 días.</p>
            <div className="mt-3 space-y-2">
              <div className="relative">
                <input type={passwordVisible.currentPassword ? 'text' : 'password'} placeholder="Contraseña actual" value={passwordForm.currentPassword} onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-3 pr-10 text-sm text-slate-100" />
                <button type="button" onClick={() => togglePasswordVisibility('currentPassword')} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200" aria-label={passwordVisible.currentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}>
                  {passwordVisible.currentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="relative">
                <input type={passwordVisible.newPassword ? 'text' : 'password'} placeholder="Nueva contraseña" value={passwordForm.newPassword} onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-3 pr-10 text-sm text-slate-100" />
                <button type="button" onClick={() => togglePasswordVisibility('newPassword')} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200" aria-label={passwordVisible.newPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}>
                  {passwordVisible.newPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="relative">
                <input type={passwordVisible.confirmPassword ? 'text' : 'password'} placeholder="Confirmar nueva contraseña" value={passwordForm.confirmPassword} onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-3 pr-10 text-sm text-slate-100" />
                <button type="button" onClick={() => togglePasswordVisibility('confirmPassword')} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200" aria-label={passwordVisible.confirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}>
                  {passwordVisible.confirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className={`text-xs ${passwordState.status === 'error' ? 'text-rose-300' : passwordState.status === 'saved' ? 'text-emerald-300' : 'text-slate-500'}`}>
                {passwordState.message || 'Para seguridad, ingresa tu contraseña actual y confirma la nueva.'}
              </p>
              <button type="button" onClick={handlePasswordSubmit} disabled={passwordState.status === 'saving'} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/15 disabled:opacity-70">
                {passwordState.status === 'saving' ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center px-6">
        <Database className="h-10 w-10 text-slate-700" />
        <h3 className="mt-3 text-xl font-semibold text-slate-200">Base de datos</h3>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">Panel visual listo para gestionar backups, retención de eventos y mantenimiento de logs.</p>
      </div>
    );
  };

  const canEditMotorSettings = hasPermission(user, 'configuration.motor');
  const showFooterActions = activeSection === 'motor' && canEditMotorSettings;

  return (
    <div className="w-full space-y-4 pb-5 text-slate-100">
      <PageHeader
        icon={Settings2}
        chipLabel="Centro de Configuración"
        title="Configuración avanzada"
        rightContent={<span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400 align-middle" />Rol actual: <span className="font-semibold text-slate-100">{isAdmin ? 'Administrador' : 'Operador'}</span></span>}
      />

      <form onSubmit={handleSubmit}>
        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
            <div className="flex gap-2 overflow-x-auto custom-scrollbar">
              {availableSections.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`shrink-0 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                    title={item.description}
                  >
                    <ItemIcon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className={local.denseMode ? 'p-3 md:p-4' : 'p-4 md:p-5'}>{renderRightPanel()}</div>

            {showFooterActions && (
              <div className="border-t border-slate-800 bg-slate-950/70 px-4 py-3 md:px-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-slate-400 md:text-sm">{statusMessage}</p>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleReset} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-900">
                      <RotateCcw className="h-4 w-4" />
                      Descartar
                    </button>
                    <button type="submit" disabled={saveState === 'saving'} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-70">
                      <Save className="h-4 w-4" />
                      {saveState === 'saving' ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
};
