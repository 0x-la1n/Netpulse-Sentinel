const express = require('express');
const net = require('net');
const targetsRepository = require('../repositories/targetsRepository');
const settingsRepository = require('../repositories/settingsRepository');

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

function clampInt(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

async function resolveLatencyLimit(req) {
  const fromQuery = req.query?.latencyLimit;
  if (fromQuery != null) {
    return clampInt(fromQuery, 5, 120, 15);
  }

  try {
    const settings = await settingsRepository.getSettings();
    return clampInt(settings?.latencyHistory, 5, 120, 15);
  } catch {
    return 15;
  }
}

// ── GET /api/targets ───
router.get('/', async (req, res) => {
  try {
    const latencyLimit = await resolveLatencyLimit(req);
    const rows = await targetsRepository.getTargetsBaseRows();

    const targets = [];

    for (const row of rows) {
      const latencyRows = await targetsRepository.getLatenciesByTargetId(row.id, latencyLimit);

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
    const row = await targetsRepository.getTargetById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

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

    const dbType = await targetsRepository.resolveDbType(type);
    if (!dbType) {
      return res.status(500).json({ error: 'ENUM de type en DB no es compatible con HTTP/PING/PORT' });
    }

    const supportsUrl = await targetsRepository.hasTargetsColumn('url');
    const supportsCreatedAt = await targetsRepository.hasTargetsColumn('created_at');
    const supportsUpdatedAt = await targetsRepository.hasTargetsColumn('updated_at');

    const insertedId = await targetsRepository.createTarget({
      name,
      dbType,
      priority,
      host,
      resolvedPort,
      supportsUrl,
      supportsCreatedAt,
      supportsUpdatedAt,
    });

    res.status(201).json({ 
      id: insertedId,
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

    const dbType = await targetsRepository.resolveDbType(type);
    if (!dbType) {
      return res.status(500).json({ error: 'ENUM de type en DB no es compatible con HTTP/PING/PORT' });
    }

    const result = await targetsRepository.updateTarget({
      id,
      name,
      dbType,
      priority,
      host: validation.normalizedHost,
      resolvedPort,
      intervalSec,
      active,
    });

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
    const result = await targetsRepository.deleteTarget(req.params.id);
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