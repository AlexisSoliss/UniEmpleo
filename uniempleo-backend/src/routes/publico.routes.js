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

router.get('/mis-seguidos', verifyToken, authorize('egresado','estudiante'),
  async (req, res, next) => {
    try {
      const { query } = require('../config/database')
      const perfilRes = await query('SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1', [req.user.id_usuario])
      if (perfilRes.rows.length === 0) return res.json({ ok: true, data: [] })
      const result = await query(
        `SELECT e.id_empresa, e.razon_social, e.sector_productivo, e.logo_url, e.descripcion,
                COUNT(s2.id_seguimiento) AS seguidores
           FROM seguimientos s
           JOIN empresas e ON e.id_empresa = s.id_empresa
           LEFT JOIN seguimientos s2 ON s2.id_empresa = e.id_empresa
          WHERE s.id_candidato = $1
          GROUP BY e.id_empresa ORDER BY e.razon_social`,
        [perfilRes.rows[0].id_perfil]
      )
      res.json({ ok: true, data: result.rows })
    } catch (err) { next(err) }
  }
)

module.exports = router
