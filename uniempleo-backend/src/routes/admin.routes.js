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

router.get('/candidato/:id_usuario', authorize('administrador','coordinador'),
  async (req, res, next) => {
    try {
      const { query } = require('../config/database')
      const id = req.params.id_usuario
      const [p, exp, edu, cv] = await Promise.all([
        query(`SELECT p.*, u.nombre_completo, u.correo_electronico FROM perfiles_candidatos p JOIN usuarios u ON u.id_usuario=p.id_usuario WHERE p.id_usuario=$1`, [id]),
        query(`SELECT * FROM experiencias WHERE id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1) ORDER BY es_actual DESC, fecha_inicio DESC`, [id]),
        query(`SELECT * FROM educacion WHERE id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1) ORDER BY fecha_inicio DESC`, [id]),
        query(`SELECT url_almacenamiento, nombre_archivo FROM cvs WHERE id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1) AND es_activo=TRUE`, [id]),
      ])
      if (p.rows.length === 0) return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' })
      const perfil = p.rows[0]
      if (cv.rows[0]) { perfil.cv_activo_url = cv.rows[0].url_almacenamiento; perfil.cv_nombre = cv.rows[0].nombre_archivo }
      res.json({ ok: true, data: { ...perfil, experiencias: exp.rows, educacion: edu.rows } })
    } catch (err) { next(err) }
  }
)

module.exports = router;
