// src/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const routes       = require('./routes/index');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ─── Middlewares globales ───────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev')); // Log de requests en consola
}

// ─── Ruta de salud (health check) ──────────
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'UniEmpleo API', timestamp: new Date().toISOString() });
});

const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ─── Rutas de la API ────────────────────────
app.use('/api', routes);

// ─── Ruta no encontrada ─────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ─── Manejador global de errores ────────────
app.use(errorHandler);

// ─── Arrancar servidor ──────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 UniEmpleo API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


