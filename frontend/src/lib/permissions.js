export const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
};

export const DEFAULT_OPERATOR_PERMISSIONS = {
  dashboard: true,
  history: true,
  reports: true,
  alerts: true,
  help: true,
  configuration: {
    access: false,
    motor: false,
    users: false,
    database: false,
    notifications: false,
    security: true,
  },
};

function boolOrDefault(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeOperatorPermissions(input) {
  const source = input && typeof input === 'object' ? input : {};
  const sourceConfig = source.configuration && typeof source.configuration === 'object' ? source.configuration : {};

  return {
    dashboard: boolOrDefault(source.dashboard, DEFAULT_OPERATOR_PERMISSIONS.dashboard),
    history: boolOrDefault(source.history, DEFAULT_OPERATOR_PERMISSIONS.history),
    reports: boolOrDefault(source.reports, DEFAULT_OPERATOR_PERMISSIONS.reports),
    alerts: boolOrDefault(source.alerts, DEFAULT_OPERATOR_PERMISSIONS.alerts),
    help: boolOrDefault(source.help, DEFAULT_OPERATOR_PERMISSIONS.help),
    configuration: {
      access: boolOrDefault(sourceConfig.access, DEFAULT_OPERATOR_PERMISSIONS.configuration.access),
      motor: boolOrDefault(sourceConfig.motor, DEFAULT_OPERATOR_PERMISSIONS.configuration.motor),
      users: boolOrDefault(sourceConfig.users, DEFAULT_OPERATOR_PERMISSIONS.configuration.users),
      database: boolOrDefault(sourceConfig.database, DEFAULT_OPERATOR_PERMISSIONS.configuration.database),
      notifications: boolOrDefault(sourceConfig.notifications, DEFAULT_OPERATOR_PERMISSIONS.configuration.notifications),
      security: boolOrDefault(sourceConfig.security, DEFAULT_OPERATOR_PERMISSIONS.configuration.security),
    },
  };
}

export function resolvePermissions(user) {
  const role = String(user?.role || ROLES.OPERATOR).toUpperCase();
  if (role === ROLES.ADMIN) {
    return {
      dashboard: true,
      history: true,
      reports: true,
      alerts: true,
      help: true,
      configuration: {
        access: true,
        motor: true,
        users: true,
        database: true,
        notifications: true,
        security: true,
      },
    };
  }

  return normalizeOperatorPermissions(user?.permissions || {});
}

export function hasPermission(user, path) {
  const permissions = resolvePermissions(user);
  const role = String(user?.role || ROLES.OPERATOR).toUpperCase();
  if (role === ROLES.ADMIN) return true;

  const parts = String(path || '').split('.').filter(Boolean);
  let cursor = permissions;

  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      return false;
    }
    cursor = cursor[part];
  }

  return Boolean(cursor);
}
