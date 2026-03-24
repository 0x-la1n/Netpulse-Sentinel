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

module.exports = { pool, testConnection };
