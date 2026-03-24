const express = require('express');
const { pool } = require('../db/connection');

const router = express.Router();

// ── GET /api/targets ───
router.get('/', async (req, res) => {
  // Implementar consulta a la base de datos para listar targets
  res.json([]);
});

// ── GET /api/targets/:id ──
router.get('/:id', async (req, res) => {
  // Obtener un solo target
  res.json({});
});

// ── POST /api/targets ───
router.post('/', async (req, res) => {
  // Crear nuevo target
  res.status(201).json({ message: "No implementado" });
});

// ── PUT /api/targets/:id ───
router.put('/:id', async (req, res) => {
  // Actualizar target existente
  res.json({ message: "No implementado" });
});

// ── DELETE /api/targets/:id ───
router.delete('/:id', async (req, res) => {
  // Eliminar target de la base de datos
  res.json({ message: "No implementado" });
});

module.exports = router;