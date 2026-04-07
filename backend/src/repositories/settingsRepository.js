const { pool } = require('../db/connection');

const DEFAULT_SETTINGS = {
  poll_interval_ms: 2000,
  global_polling_interval_sec: null,
  failure_threshold: 3,
  event_limit: 50,
  latency_history: 15,
  history_refresh_ms: 15000,
  dense_mode: 0,
};

function normalizeRow(row) {
  const pollIntervalMs = Number(row?.poll_interval_ms ?? DEFAULT_SETTINGS.poll_interval_ms);
  return {
    globalPollingIntervalSec: row?.global_polling_interval_sec == null ? null : Number(row.global_polling_interval_sec),
    pollIntervalMs,
    failureThreshold: Number(row?.failure_threshold ?? DEFAULT_SETTINGS.failure_threshold),
    eventLimit: Number(row?.event_limit ?? DEFAULT_SETTINGS.event_limit),
    latencyHistory: Number(row?.latency_history ?? DEFAULT_SETTINGS.latency_history),
    historyRefreshMs: Number(row?.history_refresh_ms ?? DEFAULT_SETTINGS.history_refresh_ms),
    denseMode: Number(row?.dense_mode ?? DEFAULT_SETTINGS.dense_mode) === 1,
  };
}

async function ensureSettingsRow() {
  await pool.query(
    `INSERT INTO app_settings (
      id,
      poll_interval_ms,
      global_polling_interval_sec,
      failure_threshold,
      event_limit,
      latency_history,
      history_refresh_ms
      ,dense_mode
    )
     SELECT 1, ?, ?, ?, ?, ?, ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1)`,
    [
      DEFAULT_SETTINGS.poll_interval_ms,
      DEFAULT_SETTINGS.global_polling_interval_sec,
      DEFAULT_SETTINGS.failure_threshold,
      DEFAULT_SETTINGS.event_limit,
      DEFAULT_SETTINGS.latency_history,
      DEFAULT_SETTINGS.history_refresh_ms,
      DEFAULT_SETTINGS.dense_mode,
    ]
  );
}

async function getSettings() {
  await ensureSettingsRow();

  const [[row]] = await pool.query(
    `SELECT poll_interval_ms, global_polling_interval_sec, failure_threshold, event_limit, latency_history, history_refresh_ms, dense_mode
     FROM app_settings
     WHERE id = 1
     LIMIT 1`
  );

  return normalizeRow(row);
}

async function updateSettings(partialSettings) {
  await ensureSettingsRow();

  const current = await getSettings();
  const next = {
    poll_interval_ms:
      partialSettings.pollIntervalMs == null
        ? current.pollIntervalMs
        : Number(partialSettings.pollIntervalMs),
    global_polling_interval_sec:
      partialSettings.globalPollingIntervalSec == null
        ? current.globalPollingIntervalSec
        : Number(partialSettings.globalPollingIntervalSec),
    failure_threshold:
      partialSettings.failureThreshold == null
        ? current.failureThreshold
        : Number(partialSettings.failureThreshold),
    event_limit:
      partialSettings.eventLimit == null
        ? current.eventLimit
        : Number(partialSettings.eventLimit),
    latency_history:
      partialSettings.latencyHistory == null
        ? current.latencyHistory
        : Number(partialSettings.latencyHistory),
    history_refresh_ms:
      partialSettings.historyRefreshMs == null
        ? current.historyRefreshMs
        : Number(partialSettings.historyRefreshMs),
    dense_mode:
      partialSettings.denseMode == null
        ? (current.denseMode ? 1 : 0)
        : (partialSettings.denseMode ? 1 : 0),
  };

  await pool.query(
    `UPDATE app_settings
     SET poll_interval_ms = ?,
         global_polling_interval_sec = ?,
         failure_threshold = ?,
         event_limit = ?,
         latency_history = ?,
         history_refresh_ms = ?,
         dense_mode = ?
     WHERE id = 1`,
    [
      next.poll_interval_ms,
      next.global_polling_interval_sec,
      next.failure_threshold,
      next.event_limit,
      next.latency_history,
      next.history_refresh_ms,
      next.dense_mode,
    ]
  );

  return normalizeRow(next);
}

module.exports = {
  getSettings,
  updateSettings,
  DEFAULT_SETTINGS,
};