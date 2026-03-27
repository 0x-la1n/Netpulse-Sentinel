const net = require('net');
const ping = require('ping');
const axios = require('axios');
const { pool } = require('../db/connection');

const DEFAULT_TIMEOUT_MS = 5000;
const MIN_INTERVAL_SEC = 10;
const MAX_INTERVAL_SEC = 3600;
const RELOAD_INTERVAL_MS = 15000;

const pollerState = {
  started: false,
  timers: new Map(),
  io: null,
  globalIntervalSec: null,
  simulatedFlips: new Map(),
};

function targetSignature(target, intervalSec) {
  return `${target.type}|${target.host}|${target.port || ''}|${intervalSec}`;
}

function normalizeInterval(raw) {
  const value = Number(raw);
  if (!Number.isInteger(value)) return 60;
  if (value < MIN_INTERVAL_SEC) return MIN_INTERVAL_SEC;
  if (value > MAX_INTERVAL_SEC) return MAX_INTERVAL_SEC;
  return value;
}

function normalizeGlobalInterval(raw) {
  if (raw == null) return null;

  const value = Number(raw);
  if (!Number.isInteger(value)) return null;
  if (value < 2) return 2;
  if (value > MAX_INTERVAL_SEC) return MAX_INTERVAL_SEC;
  return value;
}

function getEffectiveIntervalSec(target) {
  if (pollerState.globalIntervalSec != null) {
    return pollerState.globalIntervalSec;
  }
  return normalizeInterval(target.interval_sec);
}

function normalizeHttpUrl(rawHost) {
  const value = String(rawHost || '').trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value}`;
}

function probePort(host, port, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startedAt = Date.now();
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      finish({ up: true, latencyMs: Date.now() - startedAt, errorMessage: null });
    });

    socket.once('timeout', () => {
      finish({ up: false, latencyMs: null, errorMessage: 'TCP timeout' });
    });

    socket.once('error', (error) => {
      finish({ up: false, latencyMs: null, errorMessage: error.message || 'TCP error' });
    });

    socket.connect(port, host);
  });
}

async function runHttpCheck(host) {
  const url = normalizeHttpUrl(host);
  if (!url) {
    return { up: false, latencyMs: null, errorMessage: 'URL vacia' };
  }

  const startedAt = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: DEFAULT_TIMEOUT_MS,
      validateStatus: () => true,
    });

    const latencyMs = Date.now() - startedAt;
    const isUp = response.status >= 200 && response.status < 300;
    return {
      up: isUp,
      latencyMs,
      errorMessage: isUp ? null : `HTTP status ${response.status}`,
    };
  } catch (error) {
    return {
      up: false,
      latencyMs: null,
      errorMessage: error.message || 'HTTP error',
    };
  }
}

async function runPingCheck(host) {
  const safeHost = String(host || '').trim();
  if (!safeHost) {
    return { up: false, latencyMs: null, errorMessage: 'Host vacio' };
  }

  try {
    const result = await ping.promise.probe(safeHost, {
      timeout: Math.ceil(DEFAULT_TIMEOUT_MS / 1000),
      min_reply: 1,
    });

    const latency = Number(result.time);
    return {
      up: Boolean(result.alive),
      latencyMs: Number.isFinite(latency) && latency > 0 ? Math.round(latency) : null,
      errorMessage: result.alive ? null : result.output || 'No ICMP response',
    };
  } catch (error) {
    return {
      up: false,
      latencyMs: null,
      errorMessage: error.message || 'Ping error',
    };
  }
}

async function runPortCheck(host, port) {
  const safeHost = String(host || '').trim();
  const safePort = Number(port);

  if (!safeHost || !Number.isInteger(safePort) || safePort < 1 || safePort > 65535) {
    return { up: false, latencyMs: null, errorMessage: 'Host/puerto invalido' };
  }

  return probePort(safeHost, safePort, DEFAULT_TIMEOUT_MS);
}

function evaluateSimulatedTarget(target) {
  const type = String(target.type || '').toUpperCase();
  const host = String(target.host || '').toLowerCase();

  if (type !== 'HTTP') {
    return null;
  }

  // Flaky service: alternates UP/DOWN every poll.
  if (host.includes('sim.inestable.local')) {
    const wasDown = Boolean(pollerState.simulatedFlips.get(target.id));
    const isDown = !wasDown;
    pollerState.simulatedFlips.set(target.id, isDown);

    if (isDown) {
      return {
        up: false,
        latencyMs: null,
        errorMessage: 'Simulated outage',
      };
    }

    return {
      up: true,
      latencyMs: 250 + Math.floor(Math.random() * 450),
      errorMessage: null,
    };
  }

  // Slow service: always UP but with high latency.
  if (host.includes('sim.latencia-alta.local')) {
    return {
      up: true,
      latencyMs: 1200 + Math.floor(Math.random() * 1400),
      errorMessage: null,
    };
  }

  return null;
}

async function evaluateTarget(target) {
  const type = String(target.type || '').toUpperCase();

  const simulated = evaluateSimulatedTarget(target);
  if (simulated) {
    return simulated;
  }

  if (type === 'HTTP') {
    return runHttpCheck(target.host);
  }

  if (type === 'PING') {
    return runPingCheck(target.host);
  }

  if (type === 'PORT') {
    return runPortCheck(target.host, target.port);
  }

  return {
    up: false,
    latencyMs: null,
    errorMessage: `Tipo no soportado: ${type}`,
  };
}

function eventFromStatus(status) {
  if (status === 'DOWN') {
    return { type: 'CRITICAL', message: 'El objetivo paso a estado DOWN.' };
  }
  if (status === 'UP') {
    return { type: 'RECOVERY', message: 'El objetivo se recupero y esta UP.' };
  }
  return { type: 'INFO', message: 'Cambio de estado detectado.' };
}

async function pollTarget(target, io) {
  try {
    const result = await evaluateTarget(target);
    const nextStatus = result.up ? 'UP' : 'DOWN';

    const [currentRows] = await pool.query(
      'SELECT status, failure_count FROM current_status WHERE target_id = ? LIMIT 1',
      [target.id]
    );

    const previousStatus = currentRows[0]?.status || 'UNKNOWN';
    const previousFailures = Number(currentRows[0]?.failure_count || 0);
    const nextFailureCount = nextStatus === 'DOWN' ? previousFailures + 1 : 0;

    await pool.query(
      `UPDATE current_status
       SET status = ?, latency_ms = ?, failure_count = ?, last_checked = UTC_TIMESTAMP()
       WHERE target_id = ?`,
      [nextStatus, result.latencyMs, nextFailureCount, target.id]
    );

    await pool.query(
      'INSERT INTO status_log (target_id, status, latency_ms, checked_at) VALUES (?, ?, ?, UTC_TIMESTAMP())',
      [target.id, nextStatus, result.latencyMs]
    );

    if (previousStatus !== nextStatus) {
      const eventPayload = {
        targetId: target.id,
        serviceName: target.name,
        status: nextStatus,
        latencyMs: result.latencyMs,
        timestamp: new Date().toISOString(),
        ...eventFromStatus(nextStatus),
      };

      io.emit('status:event', eventPayload);
    }

    io.emit('status:update', {
      targetId: target.id,
      serviceName: target.name,
      type: target.type,
      status: nextStatus,
      latencyMs: result.latencyMs,
      retries: nextFailureCount,
      checkedAt: new Date().toISOString(),
      error: result.errorMessage,
    });
  } catch (error) {
    console.error(`[POLL] Error polling target ${target.id}:`, error.message);
  }
}

function stopTargetSchedule(targetId) {
  const entry = pollerState.timers.get(targetId);
  if (entry) {
    clearInterval(entry.timer);
    pollerState.timers.delete(targetId);
  }
}

function scheduleTarget(target, io) {
  const intervalSec = getEffectiveIntervalSec(target);
  const signature = targetSignature(target, intervalSec);
  const current = pollerState.timers.get(target.id);

  if (current && current.signature === signature) {
    return;
  }

  stopTargetSchedule(target.id);

  const timer = setInterval(() => {
    pollTarget(target, io);
  }, intervalSec * 1000);

  pollerState.timers.set(target.id, {
    timer,
    signature,
  });

  pollTarget(target, io);
}

async function syncSchedules(io) {
  const [targets] = await pool.query(
    `SELECT id, name, type, host, port, interval_sec
     FROM targets
     WHERE active = 1`
  );

  const activeIds = new Set(targets.map((target) => target.id));

  for (const existingId of pollerState.timers.keys()) {
    if (!activeIds.has(existingId)) {
      stopTargetSchedule(existingId);
    }
  }

  for (const target of targets) {
    scheduleTarget(target, io);
  }
}

async function startPoller(io) {
  if (pollerState.started) {
    return;
  }

  pollerState.started = true;
  pollerState.io = io;
  console.log('⏰ Polling engine started');

  try {
    await syncSchedules(io);
  } catch (error) {
    console.error('❌ Failed to sync polling schedules:', error.message);
  }

  setInterval(async () => {
    try {
      await syncSchedules(io);
    } catch (error) {
      console.error('❌ Poller schedule refresh failed:', error.message);
    }
  }, RELOAD_INTERVAL_MS);
}

async function setGlobalPollingIntervalSec(rawIntervalSec) {
  const normalized = normalizeGlobalInterval(rawIntervalSec);
  pollerState.globalIntervalSec = normalized;

  if (pollerState.started && pollerState.io) {
    await syncSchedules(pollerState.io);
  }

  return pollerState.globalIntervalSec;
}

function getPollerConfig() {
  return {
    globalPollingIntervalSec: pollerState.globalIntervalSec,
  };
}

module.exports = {
  startPoller,
  setGlobalPollingIntervalSec,
  getPollerConfig,
};