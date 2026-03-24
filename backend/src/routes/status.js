const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

// ── GET /api/status ──────────────────────────────────────────
router.get('/', async (req, res) => {
  // Retornar todos los targets con su estatus actual
  res.json([]);
});

// ── GET /api/status/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  // Retornar estatus actual de un target específico y calcular % Uptime
  res.json({});
});

module.exports = router;