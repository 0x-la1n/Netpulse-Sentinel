const { pool } = require('../db/connection');

async function getCurrentTargetState(targetId) {
  const [rows] = await pool.query(
    'SELECT status, failure_count FROM current_status WHERE target_id = ? LIMIT 1',
    [targetId]
  );

  return rows[0] || null;
}

async function updateCurrentStatus(targetId, status, latencyMs, failureCount) {
  await pool.query(
    `UPDATE current_status
     SET status = ?, latency_ms = ?, failure_count = ?, last_checked = UTC_TIMESTAMP()
     WHERE target_id = ?`,
    [status, latencyMs, failureCount, targetId]
  );
}

async function insertStatusLog(targetId, status, latencyMs) {
  await pool.query(
    'INSERT INTO status_log (target_id, status, latency_ms, checked_at) VALUES (?, ?, ?, UTC_TIMESTAMP())',
    [targetId, status, latencyMs]
  );
}

async function getActiveTargetsForPolling() {
  const [targets] = await pool.query(
    `SELECT id, name, type, host, port, interval_sec
     FROM targets
     WHERE active = 1`
  );

  return targets;
}

module.exports = {
  getCurrentTargetState,
  updateCurrentStatus,
  insertStatusLog,
  getActiveTargetsForPolling,
};
