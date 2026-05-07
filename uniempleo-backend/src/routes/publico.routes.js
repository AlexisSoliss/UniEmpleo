// src/routes/publico.routes.js
const express = require('express')
const { body } = require('express-validator')
const router  = express.Router()

const ctrl = require('../controllers/publico.controller')
const { verifyToken, authorize } = require('../middlewares/auth.middleware')
const { handleValidationErrors } = require('../utils/validation.helper')

// Token opcional para feed y perfiles públicos
const tokenOpcional = (req, res, next) => {
  const h = req.headers['authorization']
  if (h && h.startsWith('Bearer ')) return verifyToken(req, res, next)
  next()
}

// ── Perfiles públicos ──────────────────────────
router.get('/perfil/:id_perfil',   tokenOpcional, ctrl.perfilPublico)
router.get('/empresa/:id_empresa', tokenOpcional, ctrl.perfilEmpresa)

// ── Feed ──────────────────────────────────────
router.get('/feed', tokenOpcional, ctrl.feed)

// ── Seguir empresa (requiere login candidato) ──
router.post('/empresa/:id_empresa/seguir',
  verifyToken, authorize('egresado','estudiante'),
  ctrl.toggleSeguir
)

// ── Experiencia laboral ───────────────────────
router.post('/experiencia', verifyToken, authorize('egresado','estudiante'), [
  body('puesto').trim().notEmpty().withMessage('El puesto es obligatorio.'),
  body('empresa').trim().notEmpty().withMessage('La empresa es obligatoria.'),
  body('fecha_inicio').isDate().withMessage('Fecha de inicio inválida.'),
  handleValidationErrors,
], ctrl.agregarExperiencia)

router.put('/experiencia/:id_experiencia',
  verifyToken, authorize('egresado','estudiante'),
  ctrl.editarExperiencia
)

router.delete('/experiencia/:id_experiencia',
  verifyToken, authorize('egresado','estudiante'),
  ctrl.eliminarExperiencia
)

// ── Educación ─────────────────────────────────
router.post('/educacion', verifyToken, authorize('egresado','estudiante'), [
  body('institucion').trim().notEmpty().withMessage('La institución es obligatoria.'),
  body('grado').trim().notEmpty().withMessage('El grado es obligatorio.'),
  handleValidationErrors,
], ctrl.agregarEducacion)

router.delete('/educacion/:id_educacion',
  verifyToken, authorize('egresado','estudiante'),
  ctrl.eliminarEducacion
)

module.exports = router
