// src/routes/admin.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const adminCtrl = require('../controllers/admin.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../utils/validation.helper');

// Todos los endpoints requieren admin (coordinador puede ver reportes)
router.use(verifyToken);

// RF-27 · GET /api/admin/dashboard
router.get('/dashboard', authorize('administrador', 'coordinador'), adminCtrl.dashboard);

// RF-28 + RF-30 · GET /api/admin/reportes/empleabilidad
router.get('/reportes/empleabilidad',
  authorize('administrador', 'coordinador'),
  adminCtrl.reporteEmpleabilidad
);

// RF-31 · GET /api/admin/reportes/kpis
router.get('/reportes/kpis',
  authorize('administrador', 'coordinador'),
  adminCtrl.kpisAcreditacion
);

// RF-29 · GET /api/admin/reportes/exportar/excel
router.get('/reportes/exportar/excel',
  authorize('administrador', 'coordinador'),
  adminCtrl.exportarExcel
);

// RF-29 · GET /api/admin/reportes/exportar/pdf
router.get('/reportes/exportar/pdf',
  authorize('administrador', 'coordinador'),
  adminCtrl.exportarPDF
);

// ── Gestión de usuarios RF-32 ─────────────────

// GET  /api/admin/usuarios
router.get('/usuarios', authorize('administrador'), adminCtrl.listarUsuarios);

// POST /api/admin/usuarios
router.post('/usuarios', authorize('administrador'), [
  body('nombre_completo').trim().notEmpty().withMessage('Nombre obligatorio.'),
  body('correo_electronico').isEmail().withMessage('Correo inválido.').normalizeEmail(),
  body('contrasena').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres.'),
  body('tipo_usuario')
    .isIn(['egresado','estudiante','empresa','coordinador','administrador'])
    .withMessage('Tipo de usuario inválido.'),
  handleValidationErrors,
], adminCtrl.crearUsuario);

// PUT  /api/admin/usuarios/:id_usuario
router.put('/usuarios/:id_usuario', authorize('administrador'), [
  body('tipo_usuario').optional()
    .isIn(['egresado','estudiante','empresa','coordinador','administrador'])
    .withMessage('Tipo de usuario inválido.'),
  handleValidationErrors,
], adminCtrl.editarUsuario);

// PATCH /api/admin/usuarios/:id_usuario/suspender
router.patch('/usuarios/:id_usuario/suspender', authorize('administrador'), adminCtrl.suspenderUsuario);

// DELETE /api/admin/usuarios/:id_usuario
router.delete('/usuarios/:id_usuario', authorize('administrador'), adminCtrl.eliminarUsuario);

module.exports = router;
