const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

const ALLOWED_TYPES = new Set(['HTTP', 'PING', 'PORT']);

function normalizeType(rawType) {
  return String(rawType || '')
    .trim()
    .toUpperCase();
}

function parsePort(type, target, providedPort) {
  if (type !== 'PORT') return null;

  const direct = Number(providedPort);
  if (Number.isInteger(direct) && direct >= 1 && direct <= 65535) {
    return direct;
  }

  const [hostPart, portPart] = String(target || '').trim().split(':');
  if (!hostPart || !portPart) return null;
  const parsed = Number(portPart);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }

  return parsed;
}

async function resolveDbType(normalizedType) {
  const [rows] = await pool.query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'targets'
       AND COLUMN_NAME = 'type'
     LIMIT 1`
  );

  const raw = rows?.[0]?.COLUMN_TYPE || '';
  const enumValues = Array.from(raw.matchAll(/'([^']+)'/g)).map((item) => item[1]);

  if (enumValues.length === 0) {
    return normalizedType;
  }

  if (enumValues.includes(normalizedType)) {
    return normalizedType;
  }

  const caseInsensitiveMatch = enumValues.find((value) => value.toUpperCase() === normalizedType);
  return caseInsensitiveMatch || null;
}

async function hasTargetsColumn(columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'targets'
       AND COLUMN_NAME = ?`,
    [columnName]
  );

  return rows[0].count > 0;
}

// ── GET /api/targets ───
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        t.id,
        t.name,
        t.type,
        t.host,
        t.port,
        COALESCE(cs.status, 'UNKNOWN') AS status,
        COALESCE(cs.failure_count, 0) AS retries,
        COALESCE(u.uptime, 100.00) AS uptime
      FROM targets t
      LEFT JOIN current_status cs ON cs.target_id = t.id
      LEFT JOIN (
        SELECT target_id, ROUND(SUM(status = 'UP') * 100 / COUNT(*), 2) AS uptime
        FROM status_log
        GROUP BY target_id
      ) u ON u.target_id = t.id
      ORDER BY t.id DESC`
    );

    const targets = [];

    for (const row of rows) {
      const [latencyRows] = await pool.query(
        `SELECT latency_ms
         FROM status_log
         WHERE target_id = ?
         ORDER BY checked_at DESC
         LIMIT 15`,
        [row.id]
      );

      const latencies = latencyRows
        .map((item) => (item.latency_ms == null ? 0 : item.latency_ms))
        .reverse();

      targets.push({
        id: row.id,
        name: row.name,
        type: row.type,
        target: row.type === 'PORT' && row.port ? `${row.host}:${row.port}` : row.host,
        status: row.status,
        uptime: Number(row.uptime),
        latencies: latencies.length > 0 ? latencies : [0],
        retries: row.retries,
      });
    }

    res.json(targets);
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/targets/:id ──
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, type, host, port FROM targets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      target: row.type === 'PORT' && row.port ? `${row.host}:${row.port}` : row.host,
      port: row.port,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/targets ───
router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const type = normalizeType(req.body?.type);
    const rawTarget = String(req.body?.target || '').trim();

    if (!name || !type || !rawTarget) {
      return res.status(400).json({ error: 'name, type y target son obligatorios' });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: 'type inválido. Valores permitidos: HTTP, PING, PORT' });
    }

    const resolvedPort = parsePort(type, rawTarget, req.body?.port);
    if (type === 'PORT' && resolvedPort == null) {
      return res.status(400).json({ error: 'Para type PORT debes enviar target como host:puerto o incluir port válido' });
    }

    const host = type === 'PORT' && rawTarget.includes(':')
      ? rawTarget.split(':')[0]
      : rawTarget;

    const dbType = await resolveDbType(type);
    if (!dbType) {
      return res.status(500).json({ error: 'ENUM de type en DB no es compatible con HTTP/PING/PORT' });
    }

    const supportsUrl = await hasTargetsColumn('url');
    const supportsCreatedAt = await hasTargetsColumn('createdAt');
    const supportsUpdatedAt = await hasTargetsColumn('updatedAt');

    const insertColumns = ['name', 'type', 'host', 'port', 'active'];
    const insertValues = [name, dbType, host, resolvedPort, 1];

    if (supportsUrl) {
      insertColumns.push('url');
      insertValues.push(host);
    }

    const now = new Date();
    if (supportsCreatedAt) {
      insertColumns.push('createdAt');
      insertValues.push(now);
    }

    if (supportsUpdatedAt) {
      insertColumns.push('updatedAt');
      insertValues.push(now);
    }

    const placeholders = insertColumns.map(() => '?').join(', ');
    const [result] = await pool.query(
      `INSERT INTO targets (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues
    );

    await pool.query(
      'INSERT INTO current_status (target_id, status, failure_count, last_checked) VALUES (?, ?, 0, NULL)',
      [result.insertId, 'UNKNOWN']
    );

    res.status(201).json({ 
      id: result.insertId,
      name,
      type,
      target: type === 'PORT' && resolvedPort ? `${host}:${resolvedPort}` : host,
      status: 'UNKNOWN',
      uptime: 100.0,
      latencies: [0],
      retries: 0
    });
  } catch (error) {
    console.error('Error creating target:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/targets/:id ───
router.put('/:id', async (req, res) => {
  res.json({ message: "No implementado" });
});

// ── DELETE /api/targets/:id ───
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM targets WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    res.json({ message: 'Target deleted successfully' });
  } catch (error) {
    console.error('Error deleting target:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;