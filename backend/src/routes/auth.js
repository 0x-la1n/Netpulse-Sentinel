const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool } = require('../db/connection');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { ROLES, parsePermissions, permissionsForRole, getPersistedPermissions } = require('../lib/permissions');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: String(user.role || ROLES.OPERATOR).toUpperCase(),
      tokenVersion: Number(user.token_version || 0),
    },
    JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: '7d',
    }
  );
}

function buildUserPayload(row) {
  const role = String(row?.role || ROLES.OPERATOR).toUpperCase();
  const parsedPermissions = parsePermissions(row?.permissions_json);
  const theme = String(row?.theme || 'DARK').toUpperCase() === 'LIGHT' ? 'light' : 'dark';

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    theme,
    permissions: permissionsForRole(role, parsedPermissions),
  };
}

router.post('/register', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email y password son obligatorios' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'password debe tener al menos 6 caracteres' });
    }

    const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const [[adminCountRow]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN'");
    const role = Number(adminCountRow?.count || 0) === 0 ? ROLES.ADMIN : ROLES.OPERATOR;
    const permissions = getPersistedPermissions(role, null);

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, theme, permissions_json, token_version) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [name, email, passwordHash, role, 'DARK', permissions ? JSON.stringify(permissions) : null]
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role,
      theme: 'DARK',
      permissions_json: permissions ? JSON.stringify(permissions) : null,
      token_version: 0,
    };
    const token = signToken(user);

    return res.status(201).json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error('Error in /auth/register:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const [[user]] = await pool.query(
      'SELECT id, name, email, role, theme, permissions_json, password_hash, token_version FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error('Error in /auth/login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [[user]] = await pool.query('SELECT id, name, email, role, theme, permissions_json, created_at, token_version FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: { ...buildUserPayload(user), created_at: user.created_at } });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/password', authenticate, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword y newPassword son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const [[user]] = await pool.query(
      'SELECT id, name, email, role, theme, permissions_json, password_hash, token_version FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la actual' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const nextTokenVersion = Number(user.token_version || 0) + 1;
    await pool.query('UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?', [newHash, nextTokenVersion, req.user.id]);

    const renewedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      theme: user.theme,
      permissions_json: user.permissions_json,
      token_version: nextTokenVersion,
    };

    return res.json({
      message: 'Contraseña actualizada correctamente. Sesión renovada.',
      token: signToken(renewedUser),
      user: buildUserPayload(renewedUser),
    });
  } catch (error) {
    console.error('Error in /auth/password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/theme', authenticate, async (req, res) => {
  try {
    const themeInput = String(req.body?.theme || '').trim().toLowerCase();
    if (themeInput !== 'dark' && themeInput !== 'light') {
      return res.status(400).json({ error: 'Theme invalido. Usa dark o light.' });
    }

    const persistedTheme = themeInput === 'light' ? 'LIGHT' : 'DARK';
    await pool.query('UPDATE users SET theme = ? WHERE id = ?', [persistedTheme, req.user.id]);

    const [[user]] = await pool.query(
      'SELECT id, name, email, role, theme, permissions_json, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Tema actualizado correctamente.',
      user: { ...buildUserPayload(user), created_at: user.created_at },
    });
  } catch (error) {
    console.error('Error in /auth/theme:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
