// src/controllers/busqueda.controller.js
// RF-23 · Búsqueda de vacantes por palabras clave
// RF-24 · Filtros combinados (carrera, modalidad, ubicación, salario, sector)
// RF-25 · Ordenamiento por fecha y relevancia

const { query } = require('../config/database');

// ─────────────────────────────────────────────
// RF-23 + RF-24 + RF-25 · Buscar vacantes
// GET /api/busqueda/vacantes
// Query params:
//   q            → palabras clave (título o descripción)
//   carrera      → carrera requerida
//   modalidad    → presencial | remoto | hibrido
//   ubicacion    → ciudad/estado
//   sector       → sector productivo de la empresa
//   salario_min  → salario mínimo deseado
//   salario_max  → salario máximo deseado
//   orden        → reciente (default) | antiguo | relevancia
//   pagina       → número de página (default 1)
//   limite       → resultados por página (default 20, máx 50)
// ─────────────────────────────────────────────
const buscarVacantes = async (req, res, next) => {
  try {
    const {
      q,
      carrera,
      modalidad,
      ubicacion,
      sector,
      salario_min,
      salario_max,
      orden   = 'reciente',
      pagina  = 1,
      limite  = 20,
    } = req.query;

    const limiteParsed = Math.min(parseInt(limite) || 20, 50);
    const offset       = (Math.max(parseInt(pagina) || 1, 1) - 1) * limiteParsed;

    const params = [];
    let idx = 1;

    // Base de la consulta — solo vacantes activas de empresas aprobadas
    let sql = `
      SELECT
        v.id_vacante,
        v.titulo_puesto,
        v.descripcion,
        v.requisitos_academicos,
        v.habilidades_requeridas,
        v.modalidad,
        v.ubicacion,
        v.salario_minimo,
        v.salario_maximo,
        v.fecha_publicacion,
        v.fecha_cierre,
        e.razon_social,
        e.sector_productivo,
        (SELECT COUNT(*) FROM postulaciones po WHERE po.id_vacante = v.id_vacante) AS total_postulantes
      FROM vacantes v
      JOIN empresas e ON e.id_empresa = v.id_empresa
      WHERE v.estado = 'activa'
        AND e.estado_validacion = 'aprobada'
        AND v.fecha_cierre >= CURRENT_DATE
    `;

    // RF-23 · Búsqueda por palabras clave (título o descripción)
    if (q) {
      sql += ` AND (
        v.titulo_puesto     ILIKE $${idx}
        OR v.descripcion    ILIKE $${idx}
        OR v.habilidades_requeridas ILIKE $${idx}
      )`;
      params.push(`%${q}%`);
      idx++;
    }

    // RF-24 · Filtros
    if (carrera) {
      sql += ` AND v.requisitos_academicos ILIKE $${idx++}`;
      params.push(`%${carrera}%`);
    }

    if (modalidad) {
      sql += ` AND v.modalidad = $${idx++}`;
      params.push(modalidad);
    }

    if (ubicacion) {
      sql += ` AND v.ubicacion ILIKE $${idx++}`;
      params.push(`%${ubicacion}%`);
    }

    if (sector) {
      sql += ` AND e.sector_productivo ILIKE $${idx++}`;
      params.push(`%${sector}%`);
    }

    if (salario_min) {
      sql += ` AND (v.salario_maximo >= $${idx++} OR v.salario_maximo IS NULL)`;
      params.push(parseFloat(salario_min));
    }

    if (salario_max) {
      sql += ` AND (v.salario_minimo <= $${idx++} OR v.salario_minimo IS NULL)`;
      params.push(parseFloat(salario_max));
    }

    // RF-25 · Ordenamiento
    if (orden === 'antiguo') {
      sql += ' ORDER BY v.fecha_publicacion ASC';
    } else if (orden === 'relevancia' && q) {
      // Relevancia simple: más apariciones del término en el título primero
      sql += ` ORDER BY (
        CASE WHEN v.titulo_puesto ILIKE $${idx} THEN 2 ELSE 0 END +
        CASE WHEN v.descripcion   ILIKE $${idx} THEN 1 ELSE 0 END
      ) DESC, v.fecha_publicacion DESC`;
      params.push(`%${q}%`);
      idx++;
    } else {
      sql += ' ORDER BY v.fecha_publicacion DESC'; // reciente (default)
    }

    // Consulta de conteo total (para paginación)
    const countSql = `SELECT COUNT(*) FROM (${sql}) AS subq`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    // Paginación
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limiteParsed, offset);

    const result = await query(sql, params);

    res.json({
      ok: true,
      total,
      pagina:   parseInt(pagina) || 1,
      limite:   limiteParsed,
      paginas:  Math.ceil(total / limiteParsed),
      data:     result.rows,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/busqueda/vacantes/:id_vacante
// Detalle de una vacante pública
// ─────────────────────────────────────────────
const detalleVacante = async (req, res, next) => {
  try {
    const { id_vacante } = req.params;

    const result = await query(
      `SELECT
         v.*,
         e.razon_social, e.sector_productivo,
         e.nombre_contacto_rh, e.correo_corporativo,
         (SELECT COUNT(*) FROM postulaciones po WHERE po.id_vacante = v.id_vacante) AS total_postulantes
       FROM vacantes v
       JOIN empresas e ON e.id_empresa = v.id_empresa
       WHERE v.id_vacante = $1
         AND e.estado_validacion = 'aprobada'`,
      [id_vacante]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Vacante no encontrada.' });
    }

    // Si el usuario está autenticado, indicar si ya se postuló o la tiene en favoritos
    let ya_postulado = false;
    let es_favorita  = false;

    if (req.user) {
      const perfilResult = await query(
        'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
        [req.user.id_usuario]
      );
      if (perfilResult.rows.length > 0) {
        const id_candidato = perfilResult.rows[0].id_perfil;

        const [postResult, favResult] = await Promise.all([
          query('SELECT 1 FROM postulaciones WHERE id_candidato=$1 AND id_vacante=$2', [id_candidato, id_vacante]),
          query('SELECT 1 FROM vacantes_favoritas WHERE id_candidato=$1 AND id_vacante=$2', [id_candidato, id_vacante]),
        ]);

        ya_postulado = postResult.rows.length > 0;
        es_favorita  = favResult.rows.length  > 0;
      }
    }

    res.json({
      ok: true,
      data: { ...result.rows[0], ya_postulado, es_favorita },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/busqueda/opciones
// Devuelve valores únicos para los filtros del frontend
// (carreras, sectores, ubicaciones, modalidades disponibles)
// ─────────────────────────────────────────────
const opcionesFiltros = async (req, res, next) => {
  try {
    const [modalidades, sectores, ubicaciones] = await Promise.all([
      query(`SELECT DISTINCT modalidad FROM vacantes WHERE estado='activa' ORDER BY modalidad`),
      query(`SELECT DISTINCT sector_productivo FROM empresas WHERE estado_validacion='aprobada' ORDER BY sector_productivo`),
      query(`SELECT DISTINCT ubicacion FROM vacantes WHERE estado='activa' ORDER BY ubicacion LIMIT 100`),
    ]);

    res.json({
      ok: true,
      data: {
        modalidades: modalidades.rows.map(r => r.modalidad),
        sectores:    sectores.rows.map(r => r.sector_productivo),
        ubicaciones: ubicaciones.rows.map(r => r.ubicacion),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { buscarVacantes, detalleVacante, opcionesFiltros };
