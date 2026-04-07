const express = require('express');
const statusRepository = require('../repositories/statusRepository');

const router = express.Router();

// ── GET /api/status ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rows = await statusRepository.getStatusList();

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

    const current = await statusRepository.getCurrentStatusByTargetId(id);

    if (!current) {
      return res.status(404).json({ error: 'Target not found' });
    }

    const uptimeRow = await statusRepository.getTargetUptime(id);

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