// index.js
// Archivo principal del servidor Express. Inicializa la app y conecta la base de datos.

require('dotenv').config(); // Carga las variables del archivo .env
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./connection'); // Si connection.js está en la raíz, usa './connection'. Si está en una carpeta db, usa './db/connection'

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite recibir datos en formato JSON

// Ruta de prueba inicial
app.get('/', (req, res) => {
  res.json({
    ok: true,
    msg: '¡Backend corriendo perfectamente listo para Render!'
  });
});

// Aquí irán tus rutas del proyecto más adelante
// Ejemplo: app.use('/api/usuarios', require('./routes/usuarios'));

// Arrancar servidor e intentar conectar a la base de datos
app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
  // Ejecuta la prueba visual que tenías en tu archivo original
  await testConnection();
});
