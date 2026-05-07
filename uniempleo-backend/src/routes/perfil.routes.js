// src/routes/perfil.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const perfilCtrl = require('../controllers/perfil.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../utils/validation.helper');
const { uploadCV } = require('../utils/upload.helper');

// Todos los endpoints requieren login
router.use(verifyToken);

// RF-07 · POST /api/perfil  → Crear perfil (solo candidatos)
router.post('/', authorize('egresado', 'estudiante'), [
  body('carrera').trim().notEmpty().withMessage('La carrera es obligatoria.'),
  body('modalidad_preferida')
    .optional()
    .isIn(['presencial', 'remoto', 'hibrido', 'indiferente'])
    .withMessage('Modalidad inválida.'),
  body('promedio_general')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('El promedio debe estar entre 0 y 10.'),
  handleValidationErrors,
], perfilCtrl.crearPerfil);

// RF-09 · PUT /api/perfil  → Editar perfil propio
router.put('/', authorize('egresado', 'estudiante'), [
  body('modalidad_preferida')
    .optional()
    .isIn(['presencial', 'remoto', 'hibrido', 'indiferente'])
    .withMessage('Modalidad inválida.'),
  body('promedio_general')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('El promedio debe estar entre 0 y 10.'),
  handleValidationErrors,
], perfilCtrl.editarPerfil);

// RF-08 · POST /api/perfil/cv  → Subir CV en PDF
router.post('/cv',
  authorize('egresado', 'estudiante'),
  uploadCV.single('cv'),
  perfilCtrl.subirCV
);

// RF-08 · GET /api/perfil/cv/historial  → Historial de CVs
router.get('/cv/historial', authorize('egresado', 'estudiante'), perfilCtrl.historialCV);

// RF-10 · GET /api/perfil/me  → Ver mi perfil (candidato)
router.get('/me', perfilCtrl.verPerfil);

// RF-10 · GET /api/perfil/:id_perfil  → Ver perfil de un candidato (empresa/admin)
router.get('/:id_perfil',
  authorize('empresa', 'administrador', 'coordinador'),
  perfilCtrl.verPerfil
);

module.exports = router;
