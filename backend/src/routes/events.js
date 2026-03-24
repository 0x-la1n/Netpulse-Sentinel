const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

// ── GET /api/events/:targetId ─────────────────────────────────
router.get('/:targetId', async (req, res) => {
  // Retornar el histórico (audit trail) en 'status_log' para un target
  res.json([]);
});

// ── GET /api/events/:targetId/latency ────────────────────────
router.get('/:targetId/latency', async (req, res) => {
  // Retornar la latencia de las últimas 24 hrs
  res.json([]);
});

module.exports = router;