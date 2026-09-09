// db.js
// Importa el pool de conexiones y expone un método limpio para ejecutar consultas SQL.

const { getPool } = require('./connection');

/**
 * Ejecuta una consulta SQL en la base de datos usando el pool de conexiones.
 * @param {string} sql - La consulta SQL (ej. 'SELECT * FROM usuarios WHERE id = ?')
 * @param {Array} params - Los parámetros para reemplazar en los signos de interrogación
 */
async function query(sql, params) {
  try {
    const pool = getPool();
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Error ejecutando la consulta SQL:', error.message);
    throw error;
  }
}

module.exports = { query };
