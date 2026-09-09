const express = require('express');
const cors = require('cors');
const { getPool } = require('./connection');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const jwt = require('jsonwebtoken');
const verificarSesion = require('./auth.middleware');

const app = express();
app.set('etag', false);
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Usuarios',
      version: '1.0.0',
      description: 'Servicio para listar y buscar usuarios en la base de datos',
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: ['./server.js'],
};


const swaggerSpec = swaggerJsdoc(swaggerOptions); app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Lista todos los usuarios (paginado)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página (por defecto 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Cantidad de usuarios por página (por defecto 5)
 *     responses:
 *       200:
 *         description: Listado paginado de usuarios
 *       401:
 *         description: Sesión inválida o expirada
 *       404:
 *         description: No Data Found
 */
app.get('/api/usuarios', verificarSesion, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [rows] = await getPool().query(
      'SELECT id, nombre, username, correo FROM usuarios LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [[{ total }]] = await getPool().query('SELECT COUNT(*) AS total FROM usuarios');

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No Data Found' });
    }

    res.json({
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(' Error al obtener usuarios:', error.message);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

/**
 * @swagger
 * /api/usuarios/{username}:
 *   get:
 *     summary: Busca un usuario por su username
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *       401:
 *         description: Sesión inválida o expirada
 *       404:
 *         description: No Data Found
 */

app.get('/api/usuarios/:username', verificarSesion, async (req, res) => {
  try {
    const { username } = req.params;
    const [rows] = await getPool().query(
      'SELECT id, nombre, username, correo FROM usuarios WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No Data Found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(' Error al buscar el usuario:', error.message);
    res.status(500).json({ error: 'Error al buscar el usuario' });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Valida username y password, y devuelve un token JWT (sesión)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve el token JWT
 *       401:
 *         description: Credenciales inválidas
 *       404:
 *         description: No Data Found
 */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username y password son requeridos' });
    }

    const [rows] = await getPool().query(
      'SELECT id, nombre, username, correo, password FROM usuarios WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No Data Found' });
    }

    const usuario = rows[0];

    if (usuario.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Generar el token JWT (la "sesión")
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
    );

    await getPool().query(
      'INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
      [usuario.id, token]
    );

    res.json({
      message: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        correo: usuario.correo,
      },
    });
  } catch (error) {
    console.error(' Error en login:', error.message);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Cierra la sesión activa
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente
 *       401:
 *         description: Sesión inválida o expirada
 */
app.post('/api/logout', verificarSesion, async (req, res) => {
  try {
    await getPool().query('DELETE FROM sesiones WHERE token = ?', [req.token]);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error(' Error al cerrar sesión:', error.message);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
});

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crea un nuevo usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado
 *       409:
 *         description: El username ya existe
 */
app.post('/api/usuarios', verificarSesion, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username y password son requeridos' });
    }

    const [existe] = await getPool().query(
      'SELECT id FROM usuarios WHERE username = ?',
      [username]
    );

    if (existe.length > 0) {
      return res.status(409).json({ message: 'El username ya está en uso' });
    }

    const [result] = await getPool().query(
      'INSERT INTO usuarios (username, password) VALUES (?, ?)',
      [username, password]
    );

    res.status(201).json({ id: result.insertId, username });
  } catch (error) {
    console.error(' Error al crear usuario:', error.message);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoint disponible en http://localhost:${PORT}/api/usuarios`);
  console.log(`   Documentación Swagger en http://localhost:${PORT}/api-docs`);
});