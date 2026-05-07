// src/utils/validation.helper.js
const { validationResult } = require('express-validator');

/**
 * Middleware que revisa los resultados de express-validator.
 * Si hay errores los devuelve en formato estándar; si no, pasa al siguiente.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      ok: false,
      message: 'Error de validación.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { handleValidationErrors };
