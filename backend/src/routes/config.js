const express = require('express');
const {
  getPollerConfig,
  setGlobalPollingIntervalSec,
  setFailureThreshold,
} = require('../services/poller');

const router = express.Router();

router.get('/', (req, res) => {
  const config = getPollerConfig();
  res.json({
    globalPollingIntervalSec: config.globalPollingIntervalSec,
    pollIntervalMs: config.globalPollingIntervalSec == null ? null : config.globalPollingIntervalSec * 1000,
    failureThreshold: config.failureThreshold,
  });
});

router.put('/', async (req, res) => {
  try {
    const hasMs = req.body?.pollIntervalMs != null;
    const hasSec = req.body?.globalPollingIntervalSec != null;
    const hasFailureThreshold = req.body?.failureThreshold != null;

    if (!hasMs && !hasSec && !hasFailureThreshold) {
      return res.status(400).json({ error: 'Debes enviar pollIntervalMs, globalPollingIntervalSec o failureThreshold' });
    }

    let appliedSec = null;
    if (hasMs || hasSec) {
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

      appliedSec = await setGlobalPollingIntervalSec(rawSec);
    }

    let appliedFailureThreshold = null;
    if (hasFailureThreshold) {
      const rawThreshold = Number(req.body.failureThreshold);
      if (!Number.isInteger(rawThreshold) || rawThreshold <= 0) {
        return res.status(400).json({ error: 'failureThreshold invalido' });
      }
      appliedFailureThreshold = await setFailureThreshold(rawThreshold);
    }

    const config = getPollerConfig();

    return res.json({
      globalPollingIntervalSec: config.globalPollingIntervalSec,
      pollIntervalMs: config.globalPollingIntervalSec == null ? null : config.globalPollingIntervalSec * 1000,
      failureThreshold: config.failureThreshold,
      message: 'Configuracion actualizada',
      applied: {
        pollIntervalUpdated: appliedSec != null,
        failureThresholdUpdated: appliedFailureThreshold != null,
      },
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
