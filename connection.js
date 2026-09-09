// db/connection.js
// Crea y expone un pool de conexiones reutilizable hacia MySQL,
// usando exclusivamente la configuración externa (config/db.config.js).

const mysql = require('mysql2/promise');
const dbConfig = require('./db.config');

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: 0,
    });
  }
  return pool;
}

async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    console.log('✅ Conexión exitosa a la base de datos:', dbConfig.database);
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    process.exitCode = 1;
  }
}

async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { getPool, testConnection, cerrarPool };
