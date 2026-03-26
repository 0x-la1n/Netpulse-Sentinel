const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

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