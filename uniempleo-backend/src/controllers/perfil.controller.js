// src/controllers/perfil.controller.js
// RF-07 · Crear perfil profesional
// RF-08 · Carga de CV (historial de versiones)
// RF-09 · Edición de perfil y CV
// RF-10 · Vista previa del perfil
// RF-11 · Promedio y certificaciones

const path = require('path');
const fs   = require('fs');
const { query } = require('../config/database');

// ─────────────────────────────────────────────
// RF-07 · Crear perfil profesional
// ─────────────────────────────────────────────
const crearPerfil = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    // Un usuario solo puede tener un perfil
    const existe = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'Ya tienes un perfil creado. Usa la opción de editar.' });
    }

    const {
      carrera,
      generacion_egreso,
      habilidades_tecnicas,
      habilidades_blandas,
      experiencia_laboral,
      areas_interes,
      modalidad_preferida,
    } = req.body;

    const result = await query(
      `INSERT INTO perfiles_candidatos
         (id_usuario, carrera, generacion_egreso, habilidades_tecnicas,
          habilidades_blandas, experiencia_laboral, areas_interes, modalidad_preferida)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        id_usuario,
        carrera,
        generacion_egreso || null,
        habilidades_tecnicas ? JSON.stringify(habilidades_tecnicas) : null,
        habilidades_blandas ? JSON.stringify(habilidades_blandas) : null,
        experiencia_laboral || null,
        areas_interes ? JSON.stringify(areas_interes) : null,
        modalidad_preferida || null,
      ]
    );

    res.status(201).json({ ok: true, message: 'Perfil creado exitosamente.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-09 · Editar perfil
// ─────────────────────────────────────────────
const editarPerfil = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const perfilResult = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (perfilResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Perfil no encontrado. Crea tu perfil primero.' });
    }
    const id_perfil = perfilResult.rows[0].id_perfil;

    const {
      carrera,
      generacion_egreso,
      habilidades_tecnicas,
      habilidades_blandas,
      experiencia_laboral,
      areas_interes,
      modalidad_preferida,
      promedio_general,      // RF-11
      certificaciones,       // RF-11
    } = req.body;

    const result = await query(
      `UPDATE perfiles_candidatos SET
         carrera              = COALESCE($1, carrera),
         generacion_egreso    = COALESCE($2, generacion_egreso),
         habilidades_tecnicas = COALESCE($3, habilidades_tecnicas),
         habilidades_blandas  = COALESCE($4, habilidades_blandas),
         experiencia_laboral  = COALESCE($5, experiencia_laboral),
         areas_interes        = COALESCE($6, areas_interes),
         modalidad_preferida  = COALESCE($7, modalidad_preferida),
         promedio_general     = COALESCE($8, promedio_general),
         certificaciones      = COALESCE($9, certificaciones),
         fecha_actualizacion  = NOW()
       WHERE id_perfil = $10
       RETURNING *`,
      [
        carrera || null,
        generacion_egreso || null,
        habilidades_tecnicas ? JSON.stringify(habilidades_tecnicas) : null,
        habilidades_blandas  ? JSON.stringify(habilidades_blandas)  : null,
        experiencia_laboral  || null,
        areas_interes        ? JSON.stringify(areas_interes)         : null,
        modalidad_preferida  || null,
        promedio_general     || null,
        certificaciones      ? JSON.stringify(certificaciones)       : null,
        id_perfil,
      ]
    );

    res.json({ ok: true, message: 'Perfil actualizado.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-08 · Subir CV (guarda archivo + registra versión)
// ─────────────────────────────────────────────
const subirCV = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No se recibió ningún archivo.' });
    }

    // Verificar que el usuario tiene perfil
    const perfilResult = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (perfilResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Crea tu perfil antes de subir un CV.' });
    }
    const id_perfil = perfilResult.rows[0].id_perfil;

    // Desactivar CVs anteriores (historial de versiones)
    await query(
      'UPDATE cvs SET es_activo = FALSE WHERE id_perfil = $1',
      [id_perfil]
    );

    // Registrar el nuevo CV
    const result = await query(
      `INSERT INTO cvs (id_perfil, nombre_archivo, url_almacenamiento, tamanio_bytes, es_activo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [
        id_perfil,
        req.file.originalname,
        req.file.path,          // ruta en disco (ajustar si usas S3)
        req.file.size,
      ]
    );

    // Actualizar foto de perfil si se subió una (campo opcional)
    if (req.body.fotografia_url) {
      await query(
        'UPDATE perfiles_candidatos SET fotografia_url = $1 WHERE id_perfil = $2',
        [req.body.fotografia_url, id_perfil]
      );
    }

    res.status(201).json({ ok: true, message: 'CV subido exitosamente.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-08 · Historial de CVs del candidato
// ─────────────────────────────────────────────
const historialCV = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const perfilResult = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (perfilResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' });
    }

    const cvs = await query(
      'SELECT * FROM cvs WHERE id_perfil = $1 ORDER BY fecha_carga DESC',
      [perfilResult.rows[0].id_perfil]
    );

    res.json({ ok: true, data: cvs.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-10 · Ver mi perfil (como lo ven las empresas)
// ─────────────────────────────────────────────
const verPerfil = async (req, res, next) => {
  try {
    // Si viene id_perfil en params lo usa (empresas/admins),
    // si no, usa el propio usuario (candidato)
    let id_perfil = req.params.id_perfil || null;

    let result;
    if (id_perfil) {
      result = await query(
        `SELECT p.*, u.nombre_completo, u.correo_electronico,
                c.url_almacenamiento AS cv_activo_url, c.nombre_archivo AS cv_nombre
           FROM perfiles_candidatos p
           JOIN usuarios u ON u.id_usuario = p.id_usuario
           LEFT JOIN cvs c ON c.id_perfil = p.id_perfil AND c.es_activo = TRUE
          WHERE p.id_perfil = $1`,
        [id_perfil]
      );
    } else {
      result = await query(
        `SELECT p.*, u.nombre_completo, u.correo_electronico,
                c.url_almacenamiento AS cv_activo_url, c.nombre_archivo AS cv_nombre
           FROM perfiles_candidatos p
           JOIN usuarios u ON u.id_usuario = p.id_usuario
           LEFT JOIN cvs c ON c.id_perfil = p.id_perfil AND c.es_activo = TRUE
          WHERE p.id_usuario = $1`,
        [req.user.id_usuario]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' });
    }

    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { crearPerfil, editarPerfil, subirCV, historialCV, verPerfil };
