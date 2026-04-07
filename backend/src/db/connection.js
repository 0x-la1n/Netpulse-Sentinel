// Prueba la conexión a la base de datos al iniciar.

const mysql = require('mysql2/promise');
const { DEFAULT_OPERATOR_PERMISSIONS } = require('../lib/permissions');

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
        role            ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
        theme           ENUM('DARK','LIGHT') NOT NULL DEFAULT 'DARK',
        permissions_json JSON DEFAULT NULL,
        token_version   INT UNSIGNED NOT NULL DEFAULT 0,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await connection.query(
      `CREATE TABLE IF NOT EXISTS app_settings (
        id                      TINYINT UNSIGNED NOT NULL,
        poll_interval_ms        INT UNSIGNED NOT NULL DEFAULT 2000,
        global_polling_interval_sec INT UNSIGNED DEFAULT NULL,
        failure_threshold       TINYINT UNSIGNED NOT NULL DEFAULT 3,
        event_limit             SMALLINT UNSIGNED NOT NULL DEFAULT 50,
        latency_history         SMALLINT UNSIGNED NOT NULL DEFAULT 15,
        history_refresh_ms      INT UNSIGNED NOT NULL DEFAULT 15000,
        dense_mode              TINYINT(1) NOT NULL DEFAULT 0,
        updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    );

    await connection.query(
      `INSERT IGNORE INTO app_settings
        (id, global_polling_interval_sec, failure_threshold, event_limit, latency_history, history_refresh_ms)
       VALUES (1, NULL, 3, 50, 15, 15000)`
    );

    if (!(await hasColumn(connection, 'app_settings', 'poll_interval_ms'))) {
      await connection.query('ALTER TABLE app_settings ADD COLUMN poll_interval_ms INT UNSIGNED NOT NULL DEFAULT 2000 AFTER id');
      await connection.query(
        `UPDATE app_settings
         SET poll_interval_ms = CASE
           WHEN global_polling_interval_sec IS NULL THEN 2000
           ELSE global_polling_interval_sec * 1000
         END
         WHERE poll_interval_ms IS NULL OR poll_interval_ms = 0`
      );
    }

    if (!(await hasColumn(connection, 'app_settings', 'dense_mode'))) {
      await connection.query('ALTER TABLE app_settings ADD COLUMN dense_mode TINYINT(1) NOT NULL DEFAULT 0 AFTER history_refresh_ms');
    }

    await connection.query('UPDATE app_settings SET dense_mode = 0 WHERE dense_mode IS NULL');

    if (!(await hasColumn(connection, 'users', 'token_version'))) {
      await connection.query('ALTER TABLE users ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash');
    }

    if (!(await hasColumn(connection, 'users', 'role'))) {
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR' AFTER password_hash");
      await connection.query("UPDATE users SET role = 'ADMIN' WHERE role IS NULL OR role = ''");
    }

    if (!(await hasColumn(connection, 'users', 'theme'))) {
      await connection.query("ALTER TABLE users ADD COLUMN theme ENUM('DARK','LIGHT') NOT NULL DEFAULT 'DARK' AFTER role");
    }

    await connection.query("UPDATE users SET theme = 'DARK' WHERE theme IS NULL OR theme = ''");

    if (!(await hasColumn(connection, 'users', 'permissions_json'))) {
      await connection.query('ALTER TABLE users ADD COLUMN permissions_json JSON DEFAULT NULL AFTER theme');
    }

    const [adminCountRows] = await connection.query("SELECT COUNT(*) AS count FROM users WHERE role = 'ADMIN'");
    if (Number(adminCountRows?.[0]?.count || 0) === 0) {
      await connection.query("UPDATE users SET role = 'ADMIN' ORDER BY id ASC LIMIT 1");
    }

    await connection.query(
      'UPDATE users SET permissions_json = ? WHERE role = \'OPERATOR\' AND permissions_json IS NULL',
      [JSON.stringify(DEFAULT_OPERATOR_PERMISSIONS)]
    );
    await connection.query("UPDATE users SET permissions_json = NULL WHERE role = 'ADMIN'");

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
