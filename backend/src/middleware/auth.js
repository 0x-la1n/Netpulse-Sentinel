const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const { parsePermissions, permissionsForRole, hasPermission } = require('../lib/permissions');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const [[user]] = await pool.query(
      'SELECT id, token_version, role, permissions_json FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    );
    if (!user) {
      return res.status(401).json({ error: 'Token expired or invalid' });
    }

    const tokenVersion = Number(payload.tokenVersion || 0);
    const currentVersion = Number(user.token_version || 0);
    if (tokenVersion !== currentVersion) {
      return res.status(401).json({ error: 'Token expired or invalid' });
    }

    const role = String(user.role || 'OPERATOR').toUpperCase();
    const rawPermissions = parsePermissions(user.permissions_json);

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role,
      permissions: permissionsForRole(role, rawPermissions),
      tokenVersion: currentVersion,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
}

function requireAdmin(req, res, next) {
  if (String(req.user?.role || '').toUpperCase() !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado: requiere rol ADMIN' });
  }

  return next();
}

function requirePermission(permissionPath) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permissionPath)) {
      return res.status(403).json({ error: 'Acceso denegado por permisos' });
    }

    return next();
  };
}

module.exports = { authenticate, requireAdmin, requirePermission, JWT_SECRET };
