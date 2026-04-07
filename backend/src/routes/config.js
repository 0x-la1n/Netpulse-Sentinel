const express = require('express');
const settingsRepository = require('../repositories/settingsRepository');
const { requirePermission } = require('../middleware/auth');
const {
  getPollerConfig,
  setGlobalPollingIntervalSec,
  setFailureThreshold,
} = require('../services/poller');

const router = express.Router();

router.use(requirePermission('configuration.access'));

router.get('/', async (req, res) => {
  try {
    const config = await settingsRepository.getSettings();
    const runtime = getPollerConfig();

    res.json({
      globalPollingIntervalSec: config.globalPollingIntervalSec ?? runtime.globalPollingIntervalSec,
      pollIntervalMs: config.pollIntervalMs ?? (runtime.globalPollingIntervalSec == null ? null : runtime.globalPollingIntervalSec * 1000),
      failureThreshold: config.failureThreshold ?? runtime.failureThreshold,
      eventLimit: config.eventLimit,
      latencyHistory: config.latencyHistory,
      historyRefreshMs: config.historyRefreshMs,
      denseMode: config.denseMode,
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', async (req, res) => {
  try {
    if (!req.user || (String(req.user.role || '').toUpperCase() !== 'ADMIN' && !req.user.permissions?.configuration?.motor)) {
      return res.status(403).json({ error: 'Sin permisos para modificar la configuración del motor.' });
    }

    const hasMs = req.body?.pollIntervalMs != null;
    const hasSec = req.body?.globalPollingIntervalSec != null;
    const hasFailureThreshold = req.body?.failureThreshold != null;
    const hasEventLimit = req.body?.eventLimit != null;
    const hasLatencyHistory = req.body?.latencyHistory != null;
    const hasHistoryRefreshMs = req.body?.historyRefreshMs != null;
    const hasDenseMode = req.body?.denseMode != null;

    if (!hasMs && !hasSec && !hasFailureThreshold && !hasEventLimit && !hasLatencyHistory && !hasHistoryRefreshMs && !hasDenseMode) {
      return res.status(400).json({ error: 'Debes enviar al menos un campo de configuración' });
    }

    let appliedSec = null;
    let appliedPollIntervalMs = null;
    if (hasMs || hasSec) {
      let rawSec = null;
      if (hasSec) {
        rawSec = Number(req.body.globalPollingIntervalSec);
        appliedPollIntervalMs = rawSec * 1000;
      } else if (hasMs) {
        const rawMs = Number(req.body.pollIntervalMs);
        if (!Number.isInteger(rawMs) || rawMs < 200 || rawMs > 60000) {
          return res.status(400).json({ error: 'pollIntervalMs invalido (200..60000)' });
        }

        appliedPollIntervalMs = rawMs;
        rawSec = Math.ceil(rawMs / 1000);
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

    const partialSettings = {
      pollIntervalMs: appliedPollIntervalMs,
      globalPollingIntervalSec: appliedSec,
      failureThreshold: appliedFailureThreshold,
      eventLimit: hasEventLimit ? Number(req.body.eventLimit) : undefined,
      latencyHistory: hasLatencyHistory ? Number(req.body.latencyHistory) : undefined,
      historyRefreshMs: hasHistoryRefreshMs ? Number(req.body.historyRefreshMs) : undefined,
      denseMode: hasDenseMode ? Boolean(req.body.denseMode) : undefined,
    };

    const savedSettings = await settingsRepository.updateSettings(partialSettings);

    const runtime = getPollerConfig();

    return res.json({
      globalPollingIntervalSec: savedSettings.globalPollingIntervalSec ?? runtime.globalPollingIntervalSec,
      pollIntervalMs: savedSettings.pollIntervalMs ?? (runtime.globalPollingIntervalSec == null ? null : runtime.globalPollingIntervalSec * 1000),
      failureThreshold: savedSettings.failureThreshold ?? runtime.failureThreshold,
      eventLimit: savedSettings.eventLimit,
      latencyHistory: savedSettings.latencyHistory,
      historyRefreshMs: savedSettings.historyRefreshMs,
      denseMode: savedSettings.denseMode,
      message: 'Configuracion actualizada',
      applied: {
        pollIntervalUpdated: appliedSec != null,
        failureThresholdUpdated: appliedFailureThreshold != null,
        eventLimitUpdated: hasEventLimit,
        latencyHistoryUpdated: hasLatencyHistory,
        historyRefreshMsUpdated: hasHistoryRefreshMs,
        denseModeUpdated: hasDenseMode,
      },
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
