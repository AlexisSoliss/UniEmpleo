// src/middlewares/error.middleware.js

/**
 * Middleware global de manejo de errores.
 * Siempre va ÚLTIMO en app.js (después de todas las rutas).
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err.message);

  // Errores de validación de express-validator (se lanzan como array)
  if (Array.isArray(err)) {
    return res.status(400).json({ ok: false, errors: err });
  }

  // Error de clave única en PostgreSQL (correo/RFC duplicado, etc.)
  if (err.code === '23505') {
    return res.status(409).json({
      ok: false,
      message: 'El recurso ya existe (dato duplicado).',
      detail: err.detail
    });
  }

  // Error de FK no encontrada
  if (err.code === '23503') {
    return res.status(400).json({
      ok: false,
      message: 'Referencia no encontrada en la base de datos.',
      detail: err.detail
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    ok: false,
    message: statusCode === 500 ? 'Error interno del servidor.' : err.message
  });
};

module.exports = errorHandler;
