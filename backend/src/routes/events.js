const express = require('express');
const eventsRepository = require('../repositories/eventsRepository');

const router = express.Router();

// ── GET /api/events ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const rows = await eventsRepository.getRecentTransitionEvents(limit);

    const payload = rows.map((row) => ({
      id: row.id,
      targetId: row.target_id,
      serviceName: row.service_name,
      type: row.status === 'DOWN' ? 'CRITICAL' : row.status === 'UP' ? 'RECOVERY' : 'INFO',
      status: row.status,
      latencyMs: row.latency_ms,
      message: row.status === 'DOWN'
        ? 'El objetivo paso a estado DOWN.'
        : row.status === 'UP'
          ? 'El objetivo se recupero y esta UP.'
          : 'Evento de monitoreo.',
      timestamp: row.checked_at,
    }));

    res.json(payload);
  } catch (error) {
    console.error('Error fetching recent events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/events/:targetId ─────────────────────────────────
router.get('/:targetId', async (req, res) => {
  try {
    const { targetId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const rows = await eventsRepository.getTargetEvents(targetId, limit);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/events/:targetId/latency ────────────────────────
router.get('/:targetId/latency', async (req, res) => {
  try {
    const { targetId } = req.params;
    const rawBucketMinutes = Number(req.query.bucketMinutes);
    const bucketMinutes = Number.isInteger(rawBucketMinutes) && rawBucketMinutes >= 1
      ? Math.min(rawBucketMinutes, 60)
      : 10;

    const rows = await eventsRepository.getLatencyRowsLast24h(targetId);

    if (rows.length === 0) {
      return res.json([]);
    }

    const bucketMs = bucketMinutes * 60 * 1000;
    const buckets = new Map();

    for (const row of rows) {
      const timestamp = new Date(row.checked_at).getTime();
      const bucketStart = Math.floor(timestamp / bucketMs) * bucketMs;
      const bucketKey = String(bucketStart);
      const latency = row.latency_ms == null ? null : Number(row.latency_ms);

      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          checked_at: new Date(bucketStart).toISOString(),
          latencyTotal: 0,
          latencyCount: 0,
          latencyMax: null,
        });
      }

      const bucket = buckets.get(bucketKey);
      if (latency != null) {
        bucket.latencyTotal += latency;
        bucket.latencyCount += 1;
        bucket.latencyMax = bucket.latencyMax == null ? latency : Math.max(bucket.latencyMax, latency);
      }
    }

    const aggregated = Array.from(buckets.values())
      .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
      .map((bucket) => ({
        checked_at: bucket.checked_at,
        latency_ms: bucket.latencyCount > 0 ? Math.round(bucket.latencyTotal / bucket.latencyCount) : null,
        samples: bucket.latencyCount,
        max_latency_ms: bucket.latencyMax,
      }));

    res.json(aggregated);
  } catch (error) {
    console.error('Error fetching latency history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;