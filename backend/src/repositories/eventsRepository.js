const { pool } = require('../db/connection');

async function getRecentTransitionEvents(limit) {
  const [rows] = await pool.query(
    `SELECT id, target_id, service_name, status, latency_ms, checked_at
     FROM (
       SELECT
         sl.id,
         sl.target_id,
         t.name AS service_name,
         sl.status,
         sl.latency_ms,
         sl.checked_at,
         LAG(sl.status) OVER (
           PARTITION BY sl.target_id
           ORDER BY sl.checked_at, sl.id
         ) AS previous_status
       FROM status_log sl
       INNER JOIN targets t ON t.id = sl.target_id
     ) transitions
     WHERE previous_status IS NULL OR previous_status <> status
     ORDER BY checked_at DESC, id DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
}

async function getTargetEvents(targetId, limit) {
  const [rows] = await pool.query(
    `SELECT id, target_id, status, latency_ms, checked_at
     FROM status_log
     WHERE target_id = ?
     ORDER BY checked_at DESC
     LIMIT ?`,
    [targetId, limit]
  );

  return rows;
}

async function getLatencyRowsLast24h(targetId) {
  const [rows] = await pool.query(
    `SELECT checked_at, latency_ms
     FROM status_log
     WHERE target_id = ?
       AND checked_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
     ORDER BY checked_at ASC`,
    [targetId]
  );

  return rows;
}

module.exports = {
  getRecentTransitionEvents,
  getTargetEvents,
  getLatencyRowsLast24h,
};
