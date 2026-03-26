const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

// ── GET /api/status ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        t.id AS target_id,
        t.name,
        t.type,
        t.host,
        t.port,
        COALESCE(cs.status, 'UNKNOWN') AS status,
        cs.latency_ms,
        cs.failure_count,
        cs.last_checked
      FROM targets t
      LEFT JOIN current_status cs ON cs.target_id = t.id
      ORDER BY t.id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching status list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/status/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [[current]] = await pool.query(
      `SELECT
        t.id AS target_id,
        t.name,
        t.type,
        t.host,
        t.port,
        COALESCE(cs.status, 'UNKNOWN') AS status,
        cs.latency_ms,
        cs.failure_count,
        cs.last_checked
      FROM targets t
      LEFT JOIN current_status cs ON cs.target_id = t.id
      WHERE t.id = ?`,
      [id]
    );

    if (!current) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const [[uptimeRow]] = await pool.query(
      `SELECT
        ROUND(SUM(status = 'UP') * 100 / COUNT(*), 2) AS uptime,
        COUNT(*) AS total_checks
      FROM status_log
      WHERE target_id = ?`,
      [id]
    );

    res.json({
      ...current,
      uptime: uptimeRow?.uptime ?? 100,
      total_checks: uptimeRow?.total_checks ?? 0,
    });
  } catch (error) {
    console.error('Error fetching target status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;