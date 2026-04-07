const { pool } = require('../db/connection');

async function getStatusList() {
  const [rows] = await pool.query(
    `SELECT
      t.id AS target_id,
      t.name,
      t.type,
      t.host,
      t.port,
      COALESCE(cs.status, 'UNKNOWN') AS status,
      cs.latency_ms,
      cs.failure_count,
      cs.last_checked
    FROM targets t
    LEFT JOIN current_status cs ON cs.target_id = t.id
    ORDER BY t.id DESC`
  );

  return rows;
}

async function getCurrentStatusByTargetId(id) {
  const [[row]] = await pool.query(
    `SELECT
      t.id AS target_id,
      t.name,
      t.type,
      t.host,
      t.port,
      COALESCE(cs.status, 'UNKNOWN') AS status,
      cs.latency_ms,
      cs.failure_count,
      cs.last_checked
    FROM targets t
    LEFT JOIN current_status cs ON cs.target_id = t.id
    WHERE t.id = ?`,
    [id]
  );

  return row || null;
}

async function getTargetUptime(targetId) {
  const [[row]] = await pool.query(
    `SELECT
      ROUND(SUM(status = 'UP') * 100 / COUNT(*), 2) AS uptime,
      COUNT(*) AS total_checks
    FROM status_log
    WHERE target_id = ?`,
    [targetId]
  );

  return row || { uptime: 100, total_checks: 0 };
}

module.exports = {
  getStatusList,
  getCurrentStatusByTargetId,
  getTargetUptime,
};
