SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── users ──
-- Almacena cuentas autenticadas y versión de token para invalidación de sesiones

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(190) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  permissions_json JSON DEFAULT NULL,
  token_version   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── app_settings ──
-- Configuración global persistida de la aplicación

CREATE TABLE IF NOT EXISTS app_settings (
  id                        TINYINT UNSIGNED NOT NULL,
  poll_interval_ms          INT UNSIGNED NOT NULL DEFAULT 2000,
  global_polling_interval_sec INT UNSIGNED DEFAULT NULL,
  failure_threshold         TINYINT UNSIGNED NOT NULL DEFAULT 3,
  event_limit               SMALLINT UNSIGNED NOT NULL DEFAULT 50,
  latency_history           SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  history_refresh_ms        INT UNSIGNED NOT NULL DEFAULT 15000,
  dense_mode                TINYINT(1) NOT NULL DEFAULT 0,
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── targets ──
-- Almacena los hosts/servicios monitorizados

CREATE TABLE IF NOT EXISTS targets (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── registro_de_estado ───
-- Registro de auditoría de cada resultado de verificación

CREATE TABLE IF NOT EXISTS status_log (
  id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  target_id     INT UNSIGNED     NOT NULL,
  status        ENUM('UP','DOWN','UNKNOWN') NOT NULL,
  latency_ms    SMALLINT UNSIGNED DEFAULT NULL,           
  checked_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_target_checked (target_id, checked_at),
  CONSTRAINT fk_log_target FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── current_status ──
-- Último estado conocido por objetivo (desnormalizado para lecturas rápidas del panel de control)

CREATE TABLE IF NOT EXISTS current_status (
  target_id       INT UNSIGNED    NOT NULL,
  status          ENUM('UP','DOWN','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  latency_ms      SMALLINT UNSIGNED DEFAULT NULL,
  failure_count   TINYINT UNSIGNED NOT NULL DEFAULT 0,   -- Consecutive failures (retry logic)
  last_checked    DATETIME DEFAULT NULL,
  PRIMARY KEY (target_id),
  CONSTRAINT fk_cs_target FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;