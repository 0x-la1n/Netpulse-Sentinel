-- NetPulse Sentinel – Datos de partida (7 objetivos de prueba)

INSERT INTO targets (name, type, host, port, interval_sec, active) VALUES
  ('Google DNS',        'PING',  '8.8.8.8',           NULL, 30,  1),
  ('Cloudflare DNS',    'PING',  '1.1.1.1',           NULL, 30,  1),
  ('Google Web',        'HTTP',  'https://google.com', NULL, 60,  1),
  ('GitHub',            'HTTP',  'https://github.com', NULL, 60,  1),
  ('Sim Latencia Alta', 'HTTP',  'sim.latencia-alta.local', NULL, 20, 1),
  ('Sim Caotico',       'HTTP',  'sim.inestable.local', NULL, 15, 1),
  ('Local SSH',         'PORT',  '127.0.0.1',         22,   120, 0);

  -- Inicializa current_status con UNKNOWN para cada objetivo.

  INSERT INTO current_status (target_id, status, failure_count, last_checked)
SELECT id, 'UNKNOWN', 0, NULL FROM targets;

-- Sembrar algunas entradas históricas de status_log

INSERT INTO status_log (target_id, status, latency_ms, checked_at) VALUES
  (1, 'UP',   12, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (1, 'UP',   14, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
  (1, 'UP',   11, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
  (2, 'UP',   8,  DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (2, 'DOWN', NULL, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
  (2, 'UP',   9,  DATE_SUB(NOW(), INTERVAL 1 MINUTE)),
  (3, 'UP',   210, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (3, 'UP',   198, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
  (4, 'UP',   315, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (4, 'UP',   290, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
  (5, 'UP',   1740, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
  (5, 'UP',   1985, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
  (6, 'DOWN', NULL, DATE_SUB(NOW(), INTERVAL 4 MINUTE)),
  (6, 'UP',   612, DATE_SUB(NOW(), INTERVAL 2 MINUTE));