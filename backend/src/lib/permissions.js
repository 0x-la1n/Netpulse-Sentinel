const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
};

const DEFAULT_OPERATOR_PERMISSIONS = {
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toBool(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value == null) return fallback;
  return Boolean(value);
}

function normalizeOperatorPermissions(input) {
  const source = input && typeof input === 'object' ? input : {};
  const sourceConfig = source.configuration && typeof source.configuration === 'object'
    ? source.configuration
    : {};

  return {
    dashboard: toBool(source.dashboard, DEFAULT_OPERATOR_PERMISSIONS.dashboard),
    history: toBool(source.history, DEFAULT_OPERATOR_PERMISSIONS.history),
    reports: toBool(source.reports, DEFAULT_OPERATOR_PERMISSIONS.reports),
    alerts: toBool(source.alerts, DEFAULT_OPERATOR_PERMISSIONS.alerts),
    help: toBool(source.help, DEFAULT_OPERATOR_PERMISSIONS.help),
    configuration: {
      access: toBool(sourceConfig.access, DEFAULT_OPERATOR_PERMISSIONS.configuration.access),
      motor: toBool(sourceConfig.motor, DEFAULT_OPERATOR_PERMISSIONS.configuration.motor),
      users: toBool(sourceConfig.users, DEFAULT_OPERATOR_PERMISSIONS.configuration.users),
      database: toBool(sourceConfig.database, DEFAULT_OPERATOR_PERMISSIONS.configuration.database),
      notifications: toBool(sourceConfig.notifications, DEFAULT_OPERATOR_PERMISSIONS.configuration.notifications),
      security: toBool(sourceConfig.security, DEFAULT_OPERATOR_PERMISSIONS.configuration.security),
    },
  };
}

function permissionsForRole(role, rawPermissions) {
  if (String(role || '').toUpperCase() === ROLES.ADMIN) {
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

  return normalizeOperatorPermissions(rawPermissions);
}

function parsePermissions(rawPermissions) {
  if (!rawPermissions) return null;
  if (typeof rawPermissions === 'object') return rawPermissions;

  try {
    return JSON.parse(rawPermissions);
  } catch {
    return null;
  }
}

function getPermissionValue(permissions, path) {
  if (!permissions || !path) return false;

  const parts = String(path).split('.').filter(Boolean);
  let cursor = permissions;

  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      return false;
    }
    cursor = cursor[part];
  }

  return Boolean(cursor);
}

function hasPermission(user, path) {
  if (!user) return false;
  if (String(user.role || '').toUpperCase() === ROLES.ADMIN) return true;
  return getPermissionValue(user.permissions, path);
}

function getPersistedPermissions(role, rawPermissions) {
  if (String(role || '').toUpperCase() === ROLES.ADMIN) {
    return null;
  }

  return normalizeOperatorPermissions(rawPermissions);
}

module.exports = {
  ROLES,
  DEFAULT_OPERATOR_PERMISSIONS: clone(DEFAULT_OPERATOR_PERMISSIONS),
  parsePermissions,
  permissionsForRole,
  normalizeOperatorPermissions,
  hasPermission,
  getPersistedPermissions,
};
