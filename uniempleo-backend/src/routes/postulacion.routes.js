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

module.exports = router;
