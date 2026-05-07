// src/routes/auth.routes.js
const express = require('express');
const { body, query: qVal } = require('express-validator');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../utils/validation.helper');

// RF-01 · POST /api/auth/register
router.post('/register', [
  body('nombre_completo').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('correo_electronico').isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('contrasena')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número.'),
  body('tipo_usuario')
    .isIn(['egresado', 'estudiante', 'empresa', 'coordinador', 'administrador'])
    .withMessage('Tipo de usuario inválido.'),
  handleValidationErrors,
], authCtrl.register);

// RF-02 · POST /api/auth/login
router.post('/login', [
  body('correo_electronico').isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('contrasena').notEmpty().withMessage('La contraseña es obligatoria.'),
  handleValidationErrors,
], authCtrl.login);

// RF-03 · POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('correo_electronico').isEmail().withMessage('Correo inválido.').normalizeEmail(),
  handleValidationErrors,
], authCtrl.forgotPassword);

// RF-03 · POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token obligatorio.'),
  body('nueva_contrasena')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula.')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número.'),
  handleValidationErrors,
], authCtrl.resetPassword);

// RF-04 · POST /api/auth/logout (requiere token válido)
router.post('/logout', verifyToken, authCtrl.logout);

// RF-06 · GET /api/auth/verify?token=...
router.get('/verify', [
  qVal('token').notEmpty().withMessage('Token obligatorio.'),
  handleValidationErrors,
], authCtrl.verifyAccount);

module.exports = router;
