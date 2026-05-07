// src/routes/busqueda.routes.js
const express = require('express');
const router  = express.Router();

const busquedaCtrl = require('../controllers/busqueda.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Búsqueda pública — no requiere login, pero si viene token se usa para
// indicar si el candidato ya se postuló o tiene la vacante en favoritos
router.get('/vacantes',          (req, res, next) => {
  // Token opcional
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, busquedaCtrl.buscarVacantes);

router.get('/vacantes/:id_vacante', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, busquedaCtrl.detalleVacante);

// Opciones para los dropdowns del frontend (modalidades, sectores, ubicaciones)
router.get('/opciones', busquedaCtrl.opcionesFiltros);

module.exports = router;
