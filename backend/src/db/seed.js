require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'netpulse',
    user: process.env.DB_USER || 'jozexo',
    password: process.env.DB_PASSWORD || 'superclave123',
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const seedSql = await fs.readFile(seedPath, 'utf8');

    await connection.query(schemaSql);
    await connection.query(seedSql);

    console.log('Database schema and seed executed successfully.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Failed to run DB seed:', error.message);
    process.exit(1);
  });
}

module.exports = { run };
