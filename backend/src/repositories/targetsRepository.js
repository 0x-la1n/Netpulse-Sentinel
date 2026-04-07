const { pool } = require('../db/connection');

async function hasTargetsColumn(columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'targets'
       AND COLUMN_NAME = ?`,
    [columnName]
  );

  return rows[0].count > 0;
}

async function resolveDbType(normalizedType) {
  const [rows] = await pool.query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'targets'
       AND COLUMN_NAME = 'type'
     LIMIT 1`
  );

  const raw = rows?.[0]?.COLUMN_TYPE || '';
  const enumValues = Array.from(raw.matchAll(/'([^']+)'/g)).map((item) => item[1]);

  if (enumValues.length === 0) {
    return normalizedType;
  }

  if (enumValues.includes(normalizedType)) {
    return normalizedType;
  }

  const caseInsensitiveMatch = enumValues.find((value) => value.toUpperCase() === normalizedType);
  return caseInsensitiveMatch || null;
}

async function getTargetsBaseRows() {
  const [rows] = await pool.query(
    `SELECT
      t.id,
      t.name,
      t.type,
      t.priority,
      t.host,
      t.port,
      t.interval_sec,
      t.active,
      CASE WHEN t.active = 0 THEN 'PAUSED' ELSE COALESCE(cs.status, 'UNKNOWN') END AS status,
      CASE WHEN t.active = 0 THEN 0 ELSE COALESCE(cs.failure_count, 0) END AS retries,
      COALESCE(u.uptime, 100.00) AS uptime
    FROM targets t
    LEFT JOIN current_status cs ON cs.target_id = t.id
    LEFT JOIN (
      SELECT target_id, ROUND(SUM(status = 'UP') * 100 / COUNT(*), 2) AS uptime
      FROM status_log
      GROUP BY target_id
    ) u ON u.target_id = t.id
    ORDER BY t.id DESC`
  );

  return rows;
}

async function getLatenciesByTargetId(targetId, limit = 15) {
  const [latencyRows] = await pool.query(
    `SELECT latency_ms
     FROM status_log
     WHERE target_id = ?
     ORDER BY checked_at DESC
     LIMIT ?`,
    [targetId, limit]
  );

  return latencyRows;
}

async function getTargetById(id) {
  const [rows] = await pool.query('SELECT id, name, type, priority, host, port FROM targets WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createTarget(data) {
  const {
    name,
    dbType,
    priority,
    host,
    resolvedPort,
    supportsUrl,
    supportsCreatedAt,
    supportsUpdatedAt,
  } = data;

  const insertColumns = ['name', 'type', 'priority', 'host', 'port', 'active'];
  const insertValues = [name, dbType, priority, host, resolvedPort, 1];

  if (supportsUrl) {
    insertColumns.push('url');
    insertValues.push(host);
  }

  const now = new Date();
  if (supportsCreatedAt) {
    insertColumns.push('created_at');
    insertValues.push(now);
  }

  if (supportsUpdatedAt) {
    insertColumns.push('updated_at');
    insertValues.push(now);
  }

  const placeholders = insertColumns.map(() => '?').join(', ');
  const [result] = await pool.query(
    `INSERT INTO targets (${insertColumns.join(', ')}) VALUES (${placeholders})`,
    insertValues
  );

  await pool.query(
    'INSERT INTO current_status (target_id, status, failure_count, last_checked) VALUES (?, ?, 0, NULL)',
    [result.insertId, 'UNKNOWN']
  );

  return result.insertId;
}

async function updateTarget(data) {
  const { id, name, dbType, priority, host, resolvedPort, intervalSec, active } = data;

  const [result] = await pool.query(
    `UPDATE targets
     SET name = ?, type = ?, priority = ?, host = ?, port = ?, interval_sec = ?, active = ?, updated_at = UTC_TIMESTAMP()
     WHERE id = ?`,
    [name, dbType, priority, host, resolvedPort, intervalSec, active, id]
  );

  return result;
}

async function deleteTarget(id) {
  const [result] = await pool.query('DELETE FROM targets WHERE id = ?', [id]);
  return result;
}

module.exports = {
  hasTargetsColumn,
  resolveDbType,
  getTargetsBaseRows,
  getLatenciesByTargetId,
  getTargetById,
  createTarget,
  updateTarget,
  deleteTarget,
};
