// src/routes/index.js — VERSIÓN FINAL CON LINKEDIN
const express = require('express')
const router  = express.Router()

const authRoutes        = require('./auth.routes')
const perfilRoutes      = require('./perfil.routes')
const empresaRoutes     = require('./empresa.routes')
const postulacionRoutes = require('./postulacion.routes')
const busquedaRoutes    = require('./busqueda.routes')
const adminRoutes       = require('./admin.routes')
const publicoRoutes     = require('./publico.routes')
const cuentaRoutes = require('./cuenta.routes')


router.use('/auth',          authRoutes)
router.use('/perfil',        perfilRoutes)
router.use('/empresas',      empresaRoutes)
router.use('/postulaciones', postulacionRoutes)
router.use('/busqueda',      busquedaRoutes)
router.use('/admin',         adminRoutes)
router.use('/publico',       publicoRoutes)
router.use('/cuenta', cuentaRoutes)


module.exports = router
