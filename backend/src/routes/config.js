const express = require('express');
const { getPollerConfig, setGlobalPollingIntervalSec } = require('../services/poller');

const router = express.Router();

router.get('/', (req, res) => {
  const config = getPollerConfig();
  res.json({
    globalPollingIntervalSec: config.globalPollingIntervalSec,
    pollIntervalMs: config.globalPollingIntervalSec == null ? null : config.globalPollingIntervalSec * 1000,
  });
});

router.put('/', async (req, res) => {
  try {
    const hasMs = req.body?.pollIntervalMs != null;
    const hasSec = req.body?.globalPollingIntervalSec != null;

    if (!hasMs && !hasSec) {
      return res.status(400).json({ error: 'Debes enviar pollIntervalMs o globalPollingIntervalSec' });
    }

    let rawSec = null;
    if (hasSec) {
      rawSec = Number(req.body.globalPollingIntervalSec);
    } else if (hasMs) {
      const rawMs = Number(req.body.pollIntervalMs);
      rawSec = Number.isFinite(rawMs) ? Math.ceil(rawMs / 1000) : null;
    }

    if (!Number.isInteger(rawSec) || rawSec <= 0) {
      return res.status(400).json({ error: 'Intervalo invalido' });
    }

    const appliedSec = await setGlobalPollingIntervalSec(rawSec);

    return res.json({
      globalPollingIntervalSec: appliedSec,
      pollIntervalMs: appliedSec * 1000,
      message: 'Configuracion global de polling actualizada',
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
