// Prueba la conexión a la base de datos al iniciar.

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'netpulse',
  user: process.env.DB_USER || 'jozexo',
  password: process.env.DB_PASSWORD || 'superclave123',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Genera una excepción si la base de datos no está disponible.

async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected successfully');
  conn.release();
}

async function hasColumn(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
}

async function getColumnType(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows?.[0]?.COLUMN_TYPE || '';
}

async function ensureSchema() {
  const connection = await pool.getConnection();

  try {
    await connection.query(
      `CREATE TABLE IF NOT EXISTS targets (
        id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        name          VARCHAR(100)    NOT NULL,
        type          ENUM('HTTP','PING','PORT') NOT NULL DEFAULT 'HTTP',
        priority      ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
        host          VARCHAR(255)    NOT NULL,
        port          SMALLINT UNSIGNED DEFAULT NULL,
        interval_sec  SMALLINT UNSIGNED NOT NULL DEFAULT 60,
        active        TINYINT(1)      NOT NULL DEFAULT 1,
        created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS status_log (
        id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
        target_id     INT UNSIGNED     NOT NULL,
        status        ENUM('UP','DOWN','UNKNOWN') NOT NULL,
        latency_ms    SMALLINT UNSIGNED DEFAULT NULL,
        checked_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_target_checked (target_id, checked_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS current_status (
        target_id       INT UNSIGNED    NOT NULL,
        status          ENUM('UP','DOWN','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
        latency_ms      SMALLINT UNSIGNED DEFAULT NULL,
        failure_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,
        last_checked    DATETIME DEFAULT NULL,
        PRIMARY KEY (target_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS users (
        id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name            VARCHAR(100) NOT NULL,
        email           VARCHAR(190) NOT NULL,
        password_hash   VARCHAR(255) NOT NULL,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    const hasTarget = await hasColumn(connection, 'targets', 'target');
    const hasUrl = await hasColumn(connection, 'targets', 'url');
    const hasHost = await hasColumn(connection, 'targets', 'host');
    const hasPort = await hasColumn(connection, 'targets', 'port');
    const hasInterval = await hasColumn(connection, 'targets', 'interval_sec');
    const hasActive = await hasColumn(connection, 'targets', 'active');
    const hasPriority = await hasColumn(connection, 'targets', 'priority');

    if (!hasHost) {
      await connection.query('ALTER TABLE targets ADD COLUMN host VARCHAR(255) NULL AFTER type');
    }

    if (!hasPort) {
      await connection.query('ALTER TABLE targets ADD COLUMN port SMALLINT UNSIGNED DEFAULT NULL AFTER host');
    }

    if (!hasInterval) {
      await connection.query('ALTER TABLE targets ADD COLUMN interval_sec SMALLINT UNSIGNED NOT NULL DEFAULT 60 AFTER port');
    }

    if (!hasActive) {
      await connection.query('ALTER TABLE targets ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER interval_sec');
    }

    if (!hasPriority) {
      await connection.query("ALTER TABLE targets ADD COLUMN priority ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM' AFTER type");
    }

    if (hasTarget) {
      await connection.query('UPDATE targets SET host = target WHERE (host IS NULL OR host = "") AND target IS NOT NULL');
    }

    if (hasUrl) {
      await connection.query('UPDATE targets SET host = url WHERE (host IS NULL OR host = "") AND url IS NOT NULL');
    }

    const typeColumnDef = await getColumnType(connection, 'targets', 'type');
    if (typeColumnDef && !typeColumnDef.includes("'PORT'")) {
      await connection.query("ALTER TABLE targets MODIFY COLUMN type ENUM('HTTP','PING','PORT') NOT NULL DEFAULT 'HTTP'");
    }

    const priorityColumnDef = await getColumnType(connection, 'targets', 'priority');
    if (priorityColumnDef && !priorityColumnDef.includes("'CRITICAL'")) {
      await connection.query("ALTER TABLE targets MODIFY COLUMN priority ENUM('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM'");
    }

    await connection.query('UPDATE targets SET host = "unknown" WHERE host IS NULL OR host = ""');

    await connection.query(
      `INSERT IGNORE INTO current_status (target_id, status, failure_count, last_checked)
       SELECT id, 'UNKNOWN', 0, NULL
       FROM targets`
    );
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, ensureSchema };
