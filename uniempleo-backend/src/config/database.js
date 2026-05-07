// src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verificar conexión al arrancar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado a PostgreSQL →', process.env.DB_NAME);
    release();
  }
});

/**
 * Ejecuta una consulta SQL parametrizada.
 * @param {string} text  - Consulta SQL con $1, $2, etc.
 * @param {Array}  params - Valores para los parámetros
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
