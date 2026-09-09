// config/db.config.js
// Este archivo centraliza la configuración de la base de datos.
// Los valores NO están hardcodeados: se leen desde el archivo .env
// mediante la librería "dotenv".

require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  // 🔽 ESTA ES LA ÚNICA LÍNEA NUEVA QUE SE AÑADIÓ PARA AIVEN 🔽
  ssl: { rejectUnauthorized: false } 
};

// Validación básica: evita arrancar la app si falta configuración crítica
const camposRequeridos = ['host', 'user', 'database'];
const faltantes = camposRequeridos.filter((campo) => !dbConfig[campo]);

if (faltantes.length > 0) {
  throw new Error(
    `Faltan variables de entorno para la conexión a la BD: ${faltantes.join(', ')}. ` +
    `Revisa tu archivo .env (usa .env.example como referencia).`
  );
}

module.exports = dbConfig;
