// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

/**
 * Verifica que el request traiga un JWT válido en el header Authorization.
 * Si es válido, agrega req.user = { id_usuario, tipo_usuario }.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id_usuario, tipo_usuario, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expirado. Inicia sesión nuevamente.' });
    }
    return res.status(401).json({ ok: false, message: 'Token inválido.' });
  }
};

/**
 * Fábrica de middleware para restringir acceso por rol(es).
 * Uso: authorize('administrador', 'coordinador')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'No autenticado.' });
    }
    if (!roles.includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.`
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorize };
