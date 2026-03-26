const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool } = require('../db/connection');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(user) {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    {
      subject: String(user.id),
      expiresIn: '7d',
    }
  );
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

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email };
    const token = signToken(user);

    return res.status(201).json({ token, user });
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
      'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in /auth/login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [[user]] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
