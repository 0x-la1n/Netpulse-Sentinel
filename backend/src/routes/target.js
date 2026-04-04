const express = require('express');
const net = require('net');
const { pool } = require('../db/connection');

const router = express.Router();

const ALLOWED_TYPES = new Set(['HTTP', 'PING', 'PORT']);
const ALLOWED_PRIORITIES = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

function normalizeType(rawType) {
  return String(rawType || '')
    .trim()
    .toUpperCase();
}

function normalizePriority(rawPriority) {
  const normalized = String(rawPriority || 'MEDIUM')
    .trim()
    .toUpperCase();

  if (!ALLOWED_PRIORITIES.has(normalized)) {
    return 'MEDIUM';
  }

  return normalized;
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

function isValidDomain(hostname) {
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(hostname);
}

function isValidHost(rawHost) {
  const value = String(rawHost || '').trim();
  if (!value) return false;
  if (net.isIP(value) !== 0) return true;
  return isValidDomain(value);
}

function validateTargetByType(type, rawTarget, resolvedPort) {
  if (type === 'HTTP') {
    try {
      const parsed = new URL(rawTarget);
      const protocol = parsed.protocol.toLowerCase();
      if (!['http:', 'https:'].includes(protocol)) {
        return { valid: false, error: 'HTTP requiere URL con protocolo http:// o https://' };
      }
      return { valid: true, normalizedHost: parsed.toString() };
    } catch {
      return { valid: false, error: 'URL invalida para type HTTP' };
    }
  }

  if (type === 'PING') {
    if (!isValidHost(rawTarget)) {
      return { valid: false, error: 'PING requiere una IP o dominio valido' };
    }
    return { valid: true, normalizedHost: rawTarget };
  }

  if (type === 'PORT') {
    const host = rawTarget.includes(':') ? rawTarget.split(':')[0] : rawTarget;
    if (!isValidHost(host)) {
      return { valid: false, error: 'PORT requiere host valido (IP o dominio)' };
    }
    if (resolvedPort == null) {
      return { valid: false, error: 'PORT requiere puerto valido en rango 1..65535' };
    }
    return { valid: true, normalizedHost: host };
  }

  return { valid: false, error: 'type no soportado' };
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
        t.priority,
        t.host,
        t.port,
        t.interval_sec,
        t.active,
        CASE WHEN t.active = 0 THEN 'PAUSED' ELSE COALESCE(cs.status, 'UNKNOWN') END AS status,
        CASE WHEN t.active = 0 THEN 0 ELSE COALESCE(cs.failure_count, 0) END AS retries,
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

      const isPaused = Number(row.active) === 0;

      targets.push({
        id: row.id,
        name: row.name,
        type: row.type,
        priority: row.priority || 'MEDIUM',
        target: row.type === 'PORT' && row.port ? `${row.host}:${row.port}` : row.host,
        status: row.status,
        uptime: Number(row.uptime),
        latencies: isPaused ? [0] : (latencies.length > 0 ? latencies : [0]),
        retries: row.retries,
        intervalSec: Number(row.interval_sec || 60),
        active: row.active === 1,
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
    const [rows] = await pool.query('SELECT id, name, type, priority, host, port FROM targets WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const row = rows[0];
    res.json({
      id: row.id,
      name: row.name,
      type: row.type,
      priority: row.priority || 'MEDIUM',
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
    const priority = normalizePriority(req.body?.priority);
    const rawTarget = String(req.body?.target || '').trim();

    if (!name || !type || !rawTarget) {
      return res.status(400).json({ error: 'name, type y target son obligatorios' });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: 'type inválido. Valores permitidos: HTTP, PING, PORT' });
    }

    const resolvedPort = parsePort(type, rawTarget, req.body?.port);
    const validation = validateTargetByType(type, rawTarget, resolvedPort);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const host = validation.normalizedHost;

    const dbType = await resolveDbType(type);
    if (!dbType) {
      return res.status(500).json({ error: 'ENUM de type en DB no es compatible con HTTP/PING/PORT' });
    }

    const supportsUrl = await hasTargetsColumn('url');
    const supportsCreatedAt = await hasTargetsColumn('created_at');
    const supportsUpdatedAt = await hasTargetsColumn('updated_at');

    const insertColumns = ['name', 'type', 'priority', 'host', 'port', 'active'];
    const insertValues = [name, dbType, priority, host, resolvedPort, 1];

    if (supportsUrl) {
      insertColumns.push('url');
      insertValues.push(host);
    }

    const now = new Date();
    if (supportsCreatedAt) {
      insertColumns.push('created_at');
      insertValues.push(now);
    }

    if (supportsUpdatedAt) {
      insertColumns.push('updated_at');
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
      priority,
      target: type === 'PORT' && resolvedPort ? `${host}:${resolvedPort}` : host,
      status: 'UNKNOWN',
      uptime: 100.0,
      latencies: [0],
      retries: 0,
      intervalSec: 60,
      active: true,
    });
  } catch (error) {
    console.error('Error creating target:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PUT /api/targets/:id ───
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'id invalido' });
    }

    const name = String(req.body?.name || '').trim();
    const type = normalizeType(req.body?.type);
    const priority = normalizePriority(req.body?.priority);
    const rawTarget = String(req.body?.target || '').trim();
    const active = req.body?.active == null ? 1 : Number(req.body.active) ? 1 : 0;
    const intervalSec = Number(req.body?.interval_sec || 60);

    if (!name || !type || !rawTarget) {
      return res.status(400).json({ error: 'name, type y target son obligatorios' });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ error: 'type invalido. Valores permitidos: HTTP, PING, PORT' });
    }

    if (!Number.isInteger(intervalSec) || intervalSec < 10 || intervalSec > 3600) {
      return res.status(400).json({ error: 'interval_sec debe estar entre 10 y 3600 segundos' });
    }

    const resolvedPort = parsePort(type, rawTarget, req.body?.port);
    const validation = validateTargetByType(type, rawTarget, resolvedPort);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const dbType = await resolveDbType(type);
    if (!dbType) {
      return res.status(500).json({ error: 'ENUM de type en DB no es compatible con HTTP/PING/PORT' });
    }

    const [result] = await pool.query(
      `UPDATE targets
       SET name = ?, type = ?, priority = ?, host = ?, port = ?, interval_sec = ?, active = ?, updated_at = UTC_TIMESTAMP()
       WHERE id = ?`,
      [name, dbType, priority, validation.normalizedHost, resolvedPort, intervalSec, active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }

    res.json({
      id,
      name,
      type,
      priority,
      target: type === 'PORT' ? `${validation.normalizedHost}:${resolvedPort}` : validation.normalizedHost,
      port: resolvedPort,
      interval_sec: intervalSec,
      active,
    });
  } catch (error) {
    console.error('Error updating target:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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