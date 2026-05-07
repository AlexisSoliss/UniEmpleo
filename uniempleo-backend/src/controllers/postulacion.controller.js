// src/controllers/postulacion.controller.js
// RF-18 · Postularse a vacante activa con un clic
// RF-19 · Seguimiento del estado de postulaciones
// RF-20 · Historial completo de postulaciones
// RF-21 · Notificación por correo al cambiar estado
// RF-22 · Actualización del estado por empresa

const { query } = require('../config/database');
const emailService = require('../services/email.service');

// ─────────────────────────────────────────────
// RF-18 · Postularse a una vacante
// ─────────────────────────────────────────────
const postularse = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { id_vacante } = req.params;

    // Obtener perfil del candidato
    const perfilResult = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (perfilResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Debes crear tu perfil antes de postularte.' });
    }
    const id_candidato = perfilResult.rows[0].id_perfil;

    // Obtener CV activo
    const cvResult = await query(
      'SELECT id_cv FROM cvs WHERE id_perfil = $1 AND es_activo = TRUE',
      [id_candidato]
    );
    if (cvResult.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Debes subir tu CV antes de postularte.' });
    }
    const id_cv = cvResult.rows[0].id_cv;

    // Verificar que la vacante exista y esté activa
    const vacanteResult = await query(
      `SELECT id_vacante, titulo_puesto, fecha_cierre
         FROM vacantes
        WHERE id_vacante = $1 AND estado = 'activa'`,
      [id_vacante]
    );
    if (vacanteResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'La vacante no existe o no está activa.' });
    }

    const vacante = vacanteResult.rows[0];

    // Verificar fecha de cierre
    if (new Date() > new Date(vacante.fecha_cierre)) {
      return res.status(400).json({ ok: false, message: 'Esta vacante ya cerró su período de postulación.' });
    }

    // Verificar que no haya postulación duplicada (índice UNIQUE en BD, pero validamos aquí también)
    const duplicado = await query(
      'SELECT id_postulacion FROM postulaciones WHERE id_candidato = $1 AND id_vacante = $2',
      [id_candidato, id_vacante]
    );
    if (duplicado.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'Ya te postulaste a esta vacante.' });
    }

    // Registrar la postulación
    const result = await query(
      `INSERT INTO postulaciones (id_candidato, id_vacante, id_cv)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_candidato, id_vacante, id_cv]
    );

    res.status(201).json({
      ok: true,
      message: `Te postulaste exitosamente a: ${vacante.titulo_puesto}`,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-19 · Ver estado de mis postulaciones
// ─────────────────────────────────────────────
const misPostulaciones = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const result = await query(
      `SELECT po.id_postulacion, po.estado, po.fecha_postulacion,
              po.fecha_actualizacion_estado,
              v.titulo_puesto, v.modalidad, v.ubicacion, v.estado AS estado_vacante,
              e.razon_social
         FROM postulaciones po
         JOIN vacantes v ON v.id_vacante = po.id_vacante
         JOIN empresas e ON e.id_empresa = v.id_empresa
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
        WHERE p.id_usuario = $1
        ORDER BY po.fecha_postulacion DESC`,
      [id_usuario]
    );

    res.json({ ok: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-20 · Historial completo (incluyendo cerradas)
// ─────────────────────────────────────────────
const historialPostulaciones = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { estado } = req.query; // filtro opcional por estado

    let sql = `
      SELECT po.id_postulacion, po.estado, po.fecha_postulacion,
             po.fecha_actualizacion_estado, po.notificacion_enviada,
             v.titulo_puesto, v.modalidad, v.ubicacion,
             v.estado AS estado_vacante, v.fecha_cierre,
             e.razon_social, e.sector_productivo,
             c.url_almacenamiento AS cv_enviado_url
        FROM postulaciones po
        JOIN vacantes v ON v.id_vacante = po.id_vacante
        JOIN empresas e ON e.id_empresa = v.id_empresa
        JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
        LEFT JOIN cvs c ON c.id_cv = po.id_cv
       WHERE p.id_usuario = $1
    `;
    const params = [id_usuario];

    if (estado) {
      sql += ' AND po.estado = $2';
      params.push(estado);
    }

    sql += ' ORDER BY po.fecha_postulacion DESC';

    const result = await query(sql, params);
    res.json({ ok: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-22 · Actualizar estado de postulación (empresa)
// RF-21 · Enviar notificación por correo al cambiar estado
// ─────────────────────────────────────────────
const actualizarEstado = async (req, res, next) => {
  try {
    const id_usuario       = req.user.id_usuario;
    const { id_postulacion } = req.params;
    const { estado }         = req.body;

    const estadosValidos = ['en_revision', 'preseleccionado', 'aceptado', 'rechazado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        ok: false,
        message: `Estado inválido. Opciones: ${estadosValidos.join(', ')}`
      });
    }

    // Verificar que la postulación pertenece a una vacante de la empresa
    const verResult = await query(
      `SELECT po.id_postulacion, po.estado AS estado_actual,
              v.titulo_puesto,
              u.correo_electronico, u.nombre_completo
         FROM postulaciones po
         JOIN vacantes v ON v.id_vacante = po.id_vacante
         JOIN empresas e ON e.id_empresa = v.id_empresa
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
        WHERE po.id_postulacion = $1 AND e.id_usuario = $2`,
      [id_postulacion, id_usuario]
    );

    if (verResult.rows.length === 0) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso sobre esta postulación.' });
    }

    const postulacion = verResult.rows[0];

    // Actualizar estado
    await query(
      `UPDATE postulaciones
       SET estado = $1, fecha_actualizacion_estado = NOW(), notificacion_enviada = FALSE
       WHERE id_postulacion = $2`,
      [estado, id_postulacion]
    );

    // RF-21 · Enviar correo de notificación al candidato
    try {
      await emailService.sendStatusChangeEmail(
        postulacion.correo_electronico,
        postulacion.nombre_completo,
        postulacion.titulo_puesto,
        estado
      );

      // Registrar que la notificación fue enviada
      await query(
        `UPDATE postulaciones SET notificacion_enviada = TRUE WHERE id_postulacion = $1`,
        [id_postulacion]
      );

      // Insertar en tabla notificaciones
      await query(
        `INSERT INTO notificaciones
           (id_postulacion, id_usuario_destino, tipo, asunto, estado_envio, fecha_envio)
         SELECT $1, p.id_usuario, 'cambio_estado',
                'Actualización de postulación: ' || $2, 'enviado', NOW()
           FROM perfiles_candidatos p
           JOIN postulaciones po ON po.id_candidato = p.id_perfil
          WHERE po.id_postulacion = $1`,
        [id_postulacion, postulacion.titulo_puesto]
      );
    } catch (emailErr) {
      // El correo falló pero la actualización de estado sí se guardó
      console.error('⚠️ Error al enviar correo de notificación:', emailErr.message);
    }

    res.json({
      ok: true,
      message: `Estado actualizado a: ${estado}`,
      data: { id_postulacion, estado_anterior: postulacion.estado_actual, estado_nuevo: estado },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-26 · Guardar/quitar vacante como favorita
// ─────────────────────────────────────────────
const toggleFavorita = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { id_vacante } = req.params;

    const perfilResult = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    );
    if (perfilResult.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' });
    }
    const id_candidato = perfilResult.rows[0].id_perfil;

    // ¿Ya existe?
    const existe = await query(
      'SELECT id_favorito FROM vacantes_favoritas WHERE id_candidato = $1 AND id_vacante = $2',
      [id_candidato, id_vacante]
    );

    if (existe.rows.length > 0) {
      // Quitar de favoritos
      await query(
        'DELETE FROM vacantes_favoritas WHERE id_candidato = $1 AND id_vacante = $2',
        [id_candidato, id_vacante]
      );
      return res.json({ ok: true, message: 'Vacante eliminada de favoritos.', favorita: false });
    }

    // Agregar a favoritos
    await query(
      'INSERT INTO vacantes_favoritas (id_candidato, id_vacante) VALUES ($1, $2)',
      [id_candidato, id_vacante]
    );

    res.status(201).json({ ok: true, message: 'Vacante guardada en favoritos.', favorita: true });
  } catch (err) {
    next(err);
  }
};

// RF-26 · Listar mis favoritas
const misFavoritas = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const result = await query(
      `SELECT vf.id_favorito, vf.fecha_guardado,
              v.id_vacante, v.titulo_puesto, v.modalidad,
              v.ubicacion, v.estado, v.fecha_cierre,
              v.salario_minimo, v.salario_maximo,
              e.razon_social
         FROM vacantes_favoritas vf
         JOIN vacantes v ON v.id_vacante = vf.id_vacante
         JOIN empresas e ON e.id_empresa = v.id_empresa
         JOIN perfiles_candidatos p ON p.id_perfil = vf.id_candidato
        WHERE p.id_usuario = $1
        ORDER BY vf.fecha_guardado DESC`,
      [id_usuario]
    );

    res.json({ ok: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  postularse, misPostulaciones, historialPostulaciones,
  actualizarEstado, toggleFavorita, misFavoritas,
};
