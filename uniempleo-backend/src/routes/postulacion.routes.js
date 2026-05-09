// src/routes/postulacion.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const postulacionCtrl = require('../controllers/postulacion.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../utils/validation.helper');

router.use(verifyToken);

// RF-18 · POST /api/postulaciones/vacante/:id_vacante
router.post('/vacante/:id_vacante',
  authorize('egresado', 'estudiante'),
  postulacionCtrl.postularse
);

// RF-19 · GET /api/postulaciones/mis-postulaciones
router.get('/mis-postulaciones',
  authorize('egresado', 'estudiante'),
  postulacionCtrl.misPostulaciones
);

// RF-20 · GET /api/postulaciones/historial
router.get('/historial',
  authorize('egresado', 'estudiante'),
  postulacionCtrl.historialPostulaciones
);

// RF-22 · PATCH /api/postulaciones/:id_postulacion/estado  (empresa actualiza)
router.patch('/:id_postulacion/estado', authorize('empresa'), [
  body('estado')
    .isIn(['en_revision', 'preseleccionado', 'aceptado', 'rechazado'])
    .withMessage('Estado inválido.'),
  handleValidationErrors,
], postulacionCtrl.actualizarEstado);

// RF-26 · POST   /api/postulaciones/favoritas/:id_vacante  (toggle)
router.post('/favoritas/:id_vacante',
  authorize('egresado', 'estudiante'),
  postulacionCtrl.toggleFavorita
);

// RF-26 · GET    /api/postulaciones/favoritas
router.get('/favoritas',
  authorize('egresado', 'estudiante'),
  postulacionCtrl.misFavoritas
);

router.delete('/:id_postulacion',
  verifyToken, authorize('egresado', 'estudiante'),
  async (req, res, next) => {
    try {
      const { query } = require('../config/database')
      const result = await query(
        `SELECT po.id_postulacion, po.estado
           FROM postulaciones po
           JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
          WHERE po.id_postulacion = $1 AND p.id_usuario = $2`,
        [req.params.id_postulacion, req.user.id_usuario]
      )
      if (result.rows.length === 0)
        return res.status(404).json({ ok: false, message: 'Postulación no encontrada.' })
      if (result.rows[0].estado !== 'postulado')
        return res.status(400).json({ ok: false, message: 'Solo puedes cancelar postulaciones en estado postulado.' })
      await query('DELETE FROM postulaciones WHERE id_postulacion = $1', [req.params.id_postulacion])
      res.json({ ok: true, message: 'Postulación cancelada.' })
    } catch (err) { next(err) }
  }
)

module.exports = router;
