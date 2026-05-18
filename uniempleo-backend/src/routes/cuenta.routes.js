// src/routes/cuenta.routes.js
const express  = require('express')
const multer   = require('multer')
const path     = require('path')
const bcrypt   = require('bcrypt')
const fs       = require('fs')
const { query }      = require('../config/database')
const { verifyToken } = require('../middlewares/auth.middleware')
const router   = express.Router()

router.use(verifyToken)

// Carpeta donde se guardan las fotos
const FOTO_DIR = path.join(__dirname, '../../uploads/fotos')
if (!fs.existsSync(FOTO_DIR)) fs.mkdirSync(FOTO_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FOTO_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `foto_${req.user.id_usuario}_${Date.now()}${ext}`)
  },
})

const uploadFoto = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
  limits: { fileSize: 2 * 1024 * 1024 },
})

// POST /api/cuenta/foto
router.post('/foto', uploadFoto.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No se recibió imagen.' })

    const foto_url = `/uploads/fotos/${req.file.filename}`
    const tipo     = req.user.tipo_usuario

    if (['egresado', 'estudiante'].includes(tipo)) {
      await query(
        'UPDATE perfiles_candidatos SET foto_url = $1 WHERE id_usuario = $2',
        [foto_url, req.user.id_usuario]
      )
    } else if (tipo === 'empresa') {
      await query(
        'UPDATE empresas SET logo_url = $1 WHERE id_usuario = $2',
        [foto_url, req.user.id_usuario]
      )
    }

    await query(
      'UPDATE usuarios SET foto_url = $1 WHERE id_usuario = $2',
      [foto_url, req.user.id_usuario]
    )

    res.json({ ok: true, foto_url })
  } catch (err) { next(err) }
})

// POST /api/cuenta/cambiar-password
router.post('/cambiar-password', async (req, res, next) => {
  try {
    const { contrasena_actual, nueva_contrasena } = req.body

    const result = await query(
      'SELECT contrasena_hash FROM usuarios WHERE id_usuario = $1',
      [req.user.id_usuario]
    )
    const ok = await bcrypt.compare(contrasena_actual, result.rows[0].contrasena_hash)
    if (!ok) return res.status(400).json({ ok: false, message: 'Contraseña actual incorrecta.' })

    if (nueva_contrasena.length < 8)
      return res.status(400).json({ ok: false, message: 'Mínimo 8 caracteres.' })

    const hash = await bcrypt.hash(nueva_contrasena, 10)
    await query(
      'UPDATE usuarios SET contrasena_hash = $1 WHERE id_usuario = $2',
      [hash, req.user.id_usuario]
    )

    res.json({ ok: true, message: 'Contraseña actualizada correctamente.' })
  } catch (err) { next(err) }
})

module.exports = router