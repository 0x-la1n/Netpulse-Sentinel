const express = require('express');
const { pool } = require('../db/connection');
const { requireAdmin } = require('../middleware/auth');
const {
  ROLES,
  parsePermissions,
  permissionsForRole,
  normalizeOperatorPermissions,
  getPersistedPermissions,
} = require('../lib/permissions');

const router = express.Router();

router.use(requireAdmin);

function toUserPayload(row) {
  const role = String(row.role || ROLES.OPERATOR).toUpperCase();
  const parsedPermissions = parsePermissions(row.permissions_json);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    permissions: permissionsForRole(role, parsedPermissions),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, role, permissions_json, created_at, updated_at
       FROM users
       ORDER BY id ASC`
    );

    return res.json(rows.map(toUserPayload));
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/permissions', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id invalido' });
    }

    const [[targetUser]] = await pool.query(
      'SELECT id, role, permissions_json FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetRole = String(targetUser.role || ROLES.OPERATOR).toUpperCase();
    if (targetRole !== ROLES.OPERATOR) {
      return res.status(400).json({ error: 'Solo se pueden personalizar permisos de usuarios OPERATOR' });
    }

    const normalizedPermissions = normalizeOperatorPermissions(req.body?.permissions || {});
    const persistedPermissions = getPersistedPermissions(targetRole, normalizedPermissions);

    await pool.query('UPDATE users SET permissions_json = ? WHERE id = ?', [
      persistedPermissions ? JSON.stringify(persistedPermissions) : null,
      id,
    ]);

    const [[updated]] = await pool.query(
      'SELECT id, name, email, role, permissions_json, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    return res.json({
      message: 'Permisos actualizados correctamente',
      user: toUserPayload(updated),
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
