const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

// ── GET /api/events ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    const [rows] = await pool.query(
      `SELECT id, target_id, service_name, status, latency_ms, checked_at
       FROM (
         SELECT
           sl.id,
           sl.target_id,
           t.name AS service_name,
           sl.status,
           sl.latency_ms,
           sl.checked_at,
           LAG(sl.status) OVER (
             PARTITION BY sl.target_id
             ORDER BY sl.checked_at, sl.id
           ) AS previous_status
         FROM status_log sl
         INNER JOIN targets t ON t.id = sl.target_id
       ) transitions
       WHERE previous_status IS NULL OR previous_status <> status
       ORDER BY checked_at DESC, id DESC
       LIMIT ?`,
      [limit]
    );

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

    const [rows] = await pool.query(
      `SELECT id, target_id, status, latency_ms, checked_at
      FROM status_log
      WHERE target_id = ?
      ORDER BY checked_at DESC
      LIMIT ?`,
      [targetId, limit]
    );

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

    const [rows] = await pool.query(
      `SELECT checked_at, latency_ms
      FROM status_log
      WHERE target_id = ?
        AND checked_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
      ORDER BY checked_at ASC`,
      [targetId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching latency history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;