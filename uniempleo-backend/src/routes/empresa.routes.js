// src/routes/empresa.routes.js
const express = require('express');
const { body } = require('express-validator');
const router  = express.Router();

const empresaCtrl = require('../controllers/empresa.controller');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const { handleValidationErrors } = require('../utils/validation.helper');

router.use(verifyToken);

// ── Empresa ──────────────────────────────────

// RF-12 · POST /api/empresas/registro
router.post('/registro', authorize('empresa'), [
  body('razon_social').trim().notEmpty().withMessage('Razón social obligatoria.'),
  body('rfc').trim().isLength({ min: 12, max: 13 }).withMessage('RFC inválido (12-13 caracteres).'),
  body('sector_productivo').trim().notEmpty().withMessage('Sector obligatorio.'),
  body('tamanio').isIn(['micro','pequena','mediana','grande']).withMessage('Tamaño inválido.'),
  body('nombre_contacto_rh').trim().notEmpty().withMessage('Nombre de contacto RH obligatorio.'),
  body('correo_corporativo').isEmail().withMessage('Correo corporativo inválido.'),
  handleValidationErrors,
], empresaCtrl.registrarEmpresa);

// RF-13 · PATCH /api/empresas/:id_empresa/validar  (solo admin)
router.patch('/:id_empresa/validar', authorize('administrador'), [
  body('decision').isIn(['aprobada','rechazada']).withMessage("Debe ser 'aprobada' o 'rechazada'."),
  body('motivo_rechazo').if(body('decision').equals('rechazada'))
    .notEmpty().withMessage('Motivo de rechazo obligatorio.'),
  handleValidationErrors,
], empresaCtrl.validarEmpresa);

// RF-13 · GET /api/empresas/pendientes  (admin)
router.get('/pendientes', authorize('administrador'), empresaCtrl.listarEmpresasPendientes);

// ── Vacantes ──────────────────────────────────

// RF-14 · POST /api/empresas/vacantes
router.post('/vacantes', authorize('empresa'), [
  body('titulo_puesto').trim().notEmpty().withMessage('El título del puesto es obligatorio.'),
  body('descripcion').trim().notEmpty().withMessage('La descripción es obligatoria.'),
  body('requisitos_academicos').trim().notEmpty().withMessage('Los requisitos académicos son obligatorios.'),
  body('habilidades_requeridas').trim().notEmpty().withMessage('Las habilidades requeridas son obligatorias.'),
  body('modalidad').isIn(['presencial','remoto','hibrido']).withMessage('Modalidad inválida.'),
  body('ubicacion').trim().notEmpty().withMessage('La ubicación es obligatoria.'),
  body('fecha_cierre').isDate().withMessage('Fecha de cierre inválida (YYYY-MM-DD).'),
  body('salario_minimo').optional().isFloat({ min: 0 }).withMessage('Salario mínimo inválido.'),
  body('salario_maximo').optional().isFloat({ min: 0 }).withMessage('Salario máximo inválido.'),
  handleValidationErrors,
], empresaCtrl.publicarVacante);

// RF-15 · PUT /api/empresas/vacantes/:id_vacante
router.put('/vacantes/:id_vacante', authorize('empresa'), [
  body('modalidad').optional().isIn(['presencial','remoto','hibrido']).withMessage('Modalidad inválida.'),
  body('estado').optional().isIn(['activa','pausada','eliminada']).withMessage('Estado inválido.'),
  body('salario_minimo').optional().isFloat({ min: 0 }),
  body('salario_maximo').optional().isFloat({ min: 0 }),
  handleValidationErrors,
], empresaCtrl.editarVacante);

// RF-15 · PATCH /api/empresas/vacantes/:id_vacante/estado
router.patch('/vacantes/:id_vacante/estado', authorize('empresa'), [
  body('estado').isIn(['activa','pausada','eliminada']).withMessage('Estado inválido.'),
  handleValidationErrors,
], empresaCtrl.cambiarEstadoVacante);

// Mis vacantes · GET /api/empresas/vacantes/mis-vacantes
router.get('/vacantes/mis-vacantes', authorize('empresa'), empresaCtrl.misVacantes);

// RF-16 · GET /api/empresas/candidatos/buscar
router.get('/candidatos/buscar', authorize('empresa', 'administrador'), empresaCtrl.buscarCandidatos);

// RF-17 · GET /api/empresas/vacantes/:id_vacante/postulantes
router.get('/vacantes/:id_vacante/postulantes',
  authorize('empresa', 'administrador'),
  empresaCtrl.postulantesDeVacante
);

module.exports = router;
