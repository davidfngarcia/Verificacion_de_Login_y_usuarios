// auth.middleware.js
const jwt = require('jsonwebtoken');
const { getPool } = require('./connection');

async function verificarSesion(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    await getPool().query(
      'INSERT INTO sesiones (usuario_id, token, expira_en) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
      [usuario.id, token]
    );

    res.json({ token, usuario });

    // Verificar que la sesión exista en la BD y no haya expirado
    const [rows] = await getPool().query(
      'SELECT *, NOW() as hora_servidor_bd FROM sesiones WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      console.log('❌ El token no existe en la tabla sesiones.');
      return res.status(401).json({ message: 'Sesión no encontrada en BD' });
    }

    console.log('⏰ Hora BD:', rows[0].hora_servidor_bd, ' Expira en:', rows[0].expira_en);

    if (new Date(rows[0].expira_en) <= new Date(rows[0].hora_servidor_bd)) {
      console.log('❌ La sesión ya expiró según la BD.');
      return res.status(401).json({ message: 'Sesión expirada' });
    }

    // Hubo actividad: refrescar la sesión 30 minutos más
    await getPool().query(
      'UPDATE sesiones SET expira_en = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE token = ?',
      [token]
    );

    req.usuario = payload;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Error validando sesión:', error.message);
    res.status(500).json({ error: 'Error al validar la sesión' });
  }
}

module.exports = verificarSesion;