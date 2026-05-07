// src/controllers/empresa.controller.js
// RF-12 · Registro de empresa
// RF-13 · Validación/aprobación por admin
// RF-14 · Publicación de vacantes
// RF-15 · Gestión de vacantes (editar, pausar, eliminar)
// RF-16 · Búsqueda de perfiles de candidatos
// RF-17 · Lista de postulantes por vacante

const { query } = require('../config/database');

// ─────────────────────────────────────────────
// RF-12 · Registrar empresa
// ─────────────────────────────────────────────
const registrarEmpresa = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const existe = await query(
      'SELECT id_empresa FROM empresas WHERE id_usuario = $1',
      [id_usuario]
    );
    if (existe.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'Ya tienes una empresa registrada.' });
    }

    const {
      razon_social, rfc, sector_productivo, tamanio,
      nombre_contacto_rh, correo_corporativo, telefono,
    } = req.body;

    const result = await query(
      `INSERT INTO empresas
         (id_usuario, razon_social, rfc, sector_productivo, tamanio,
          nombre_contacto_rh, correo_corporativo, telefono)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id_empresa, razon_social, rfc, estado_validacion`,
      [id_usuario, razon_social, rfc, sector_productivo, tamanio,
       nombre_contacto_rh, correo_corporativo, telefono || null]
    );

    res.status(201).json({
      ok: true,
      message: 'Empresa registrada. Pendiente de validación por el administrador.',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-13 · Aprobar o rechazar empresa (admin)
// ─────────────────────────────────────────────
const validarEmpresa = async (req, res, next) => {
  try {
    const { id_empresa } = req.params;
    const { decision, motivo_rechazo } = req.body; // decision: 'aprobada' | 'rechazada'

    if (!['aprobada', 'rechazada'].includes(decision)) {
      return res.status(400).json({ ok: false, message: "La decisión debe ser 'aprobada' o 'rechazada'." });
    }

    if (decision === 'rechazada' && !motivo_rechazo) {
      return res.status(400).json({ ok: false, message: 'Debes proporcionar el motivo de rechazo.' });
    }

    const result = await query(
      `UPDATE empresas
       SET estado_validacion = $1,
           motivo_rechazo    = $2,
           fecha_validacion  = NOW()
       WHERE id_empresa = $3
       RETURNING id_empresa, razon_social, estado_validacion`,
      [decision, motivo_rechazo || null, id_empresa]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada.' });
    }

    res.json({ ok: true, message: `Empresa ${decision} exitosamente.`, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-13 · Listar empresas pendientes (admin)
// ─────────────────────────────────────────────
const listarEmpresasPendientes = async (req, res, next) => {
  try {
    const { estado = 'pendiente' } = req.query;
    const result = await query(
      `SELECT e.*, u.nombre_completo, u.correo_electronico
         FROM empresas e
         JOIN usuarios u ON u.id_usuario = e.id_usuario
        WHERE e.estado_validacion = $1
        ORDER BY e.fecha_registro DESC`,
      [estado]
    );
    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-14 · Publicar vacante
// ─────────────────────────────────────────────
const publicarVacante = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    // Verificar que la empresa esté aprobada
    const empResult = await query(
      `SELECT id_empresa FROM empresas
        WHERE id_usuario = $1 AND estado_validacion = 'aprobada'`,
      [id_usuario]
    );
    if (empResult.rows.length === 0) {
      return res.status(403).json({
        ok: false,
        message: 'Tu empresa debe estar aprobada para publicar vacantes.',
      });
    }
    const id_empresa = empResult.rows[0].id_empresa;

    const {
      titulo_puesto, descripcion, requisitos_academicos,
      habilidades_requeridas, modalidad, ubicacion,
      salario_minimo, salario_maximo, fecha_cierre,
    } = req.body;

    const result = await query(
      `INSERT INTO vacantes
         (id_empresa, titulo_puesto, descripcion, requisitos_academicos,
          habilidades_requeridas, modalidad, ubicacion,
          salario_minimo, salario_maximo, fecha_cierre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id_empresa, titulo_puesto, descripcion, requisitos_academicos,
        habilidades_requeridas, modalidad, ubicacion,
        salario_minimo || null, salario_maximo || null, fecha_cierre,
      ]
    );

    res.status(201).json({ ok: true, message: 'Vacante publicada exitosamente.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-15 · Editar vacante
// ─────────────────────────────────────────────
const editarVacante = async (req, res, next) => {
  try {
    const id_usuario  = req.user.id_usuario;
    const { id_vacante } = req.params;

    // Verificar propiedad
    const owns = await query(
      `SELECT v.id_vacante FROM vacantes v
         JOIN empresas e ON e.id_empresa = v.id_empresa
        WHERE v.id_vacante = $1 AND e.id_usuario = $2`,
      [id_vacante, id_usuario]
    );
    if (owns.rows.length === 0) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para editar esta vacante.' });
    }

    const {
      titulo_puesto, descripcion, requisitos_academicos,
      habilidades_requeridas, modalidad, ubicacion,
      salario_minimo, salario_maximo, fecha_cierre, estado,
    } = req.body;

    const result = await query(
      `UPDATE vacantes SET
         titulo_puesto         = COALESCE($1, titulo_puesto),
         descripcion           = COALESCE($2, descripcion),
         requisitos_academicos = COALESCE($3, requisitos_academicos),
         habilidades_requeridas= COALESCE($4, habilidades_requeridas),
         modalidad             = COALESCE($5, modalidad),
         ubicacion             = COALESCE($6, ubicacion),
         salario_minimo        = COALESCE($7, salario_minimo),
         salario_maximo        = COALESCE($8, salario_maximo),
         fecha_cierre          = COALESCE($9, fecha_cierre),
         estado                = COALESCE($10, estado),
         fecha_actualizacion   = NOW()
       WHERE id_vacante = $11
       RETURNING *`,
      [
        titulo_puesto || null, descripcion || null, requisitos_academicos || null,
        habilidades_requeridas || null, modalidad || null, ubicacion || null,
        salario_minimo || null, salario_maximo || null, fecha_cierre || null,
        estado || null, id_vacante,
      ]
    );

    res.json({ ok: true, message: 'Vacante actualizada.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-15 · Cambiar estado de vacante (pausar / reactivar / eliminar)
// ─────────────────────────────────────────────
const cambiarEstadoVacante = async (req, res, next) => {
  try {
    const id_usuario     = req.user.id_usuario;
    const { id_vacante } = req.params;
    const { estado }     = req.body; // 'activa' | 'pausada' | 'eliminada'

    if (!['activa', 'pausada', 'eliminada'].includes(estado)) {
      return res.status(400).json({ ok: false, message: 'Estado inválido.' });
    }

    const owns = await query(
      `SELECT v.id_vacante FROM vacantes v
         JOIN empresas e ON e.id_empresa = v.id_empresa
        WHERE v.id_vacante = $1 AND e.id_usuario = $2`,
      [id_vacante, id_usuario]
    );
    if (owns.rows.length === 0) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso sobre esta vacante.' });
    }

    await query(
      'UPDATE vacantes SET estado = $1, fecha_actualizacion = NOW() WHERE id_vacante = $2',
      [estado, id_vacante]
    );

    res.json({ ok: true, message: `Vacante ${estado}.` });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-16 · Buscar perfiles de candidatos (empresa)
// ─────────────────────────────────────────────
const buscarCandidatos = async (req, res, next) => {
  try {
    const { carrera, modalidad_preferida, generacion_egreso, habilidades } = req.query;

    let sql = `
      SELECT p.id_perfil, u.nombre_completo, p.carrera,
             p.generacion_egreso, p.habilidades_tecnicas,
             p.habilidades_blandas, p.modalidad_preferida,
             p.experiencia_laboral, p.areas_interes
        FROM perfiles_candidatos p
        JOIN usuarios u ON u.id_usuario = p.id_usuario
       WHERE u.activo = TRUE
    `;
    const params = [];
    let idx = 1;

    if (carrera) {
      sql += ` AND p.carrera ILIKE $${idx++}`;
      params.push(`%${carrera}%`);
    }
    if (modalidad_preferida) {
      sql += ` AND p.modalidad_preferida = $${idx++}`;
      params.push(modalidad_preferida);
    }
    if (generacion_egreso) {
      sql += ` AND p.generacion_egreso = $${idx++}`;
      params.push(parseInt(generacion_egreso));
    }
    if (habilidades) {
      // Búsqueda simple en el JSON de habilidades técnicas
      sql += ` AND p.habilidades_tecnicas::text ILIKE $${idx++}`;
      params.push(`%${habilidades}%`);
    }

    sql += ' ORDER BY p.fecha_actualizacion DESC LIMIT 50';

    const result = await query(sql, params);
    res.json({ ok: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-17 · Lista de postulantes por vacante
// ─────────────────────────────────────────────
const postulantesDeVacante = async (req, res, next) => {
  try {
    const id_usuario     = req.user.id_usuario;
    const { id_vacante } = req.params;

    // Verificar que la vacante es de su empresa (o es admin)
    if (req.user.tipo_usuario === 'empresa') {
      const owns = await query(
        `SELECT v.id_vacante FROM vacantes v
           JOIN empresas e ON e.id_empresa = v.id_empresa
          WHERE v.id_vacante = $1 AND e.id_usuario = $2`,
        [id_vacante, id_usuario]
      );
      if (owns.rows.length === 0) {
        return res.status(403).json({ ok: false, message: 'Acceso denegado.' });
      }
    }

    const result = await query(
      `SELECT po.id_postulacion, po.estado, po.fecha_postulacion,
              po.fecha_actualizacion_estado,
              u.nombre_completo, u.correo_electronico,
              p.carrera, p.generacion_egreso, p.habilidades_tecnicas,
              p.id_perfil,
              c.url_almacenamiento AS cv_url, c.nombre_archivo AS cv_nombre
         FROM postulaciones po
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
         LEFT JOIN cvs c ON c.id_cv = po.id_cv
        WHERE po.id_vacante = $1
        ORDER BY po.fecha_postulacion DESC`,
      [id_vacante]
    );

    res.json({ ok: true, total: result.rows.length, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Mis vacantes (empresa autenticada)
// ─────────────────────────────────────────────
const misVacantes = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario;

    const result = await query(
      `SELECT v.*,
              (SELECT COUNT(*) FROM postulaciones po WHERE po.id_vacante = v.id_vacante) AS total_postulantes
         FROM vacantes v
         JOIN empresas e ON e.id_empresa = v.id_empresa
        WHERE e.id_usuario = $1
        ORDER BY v.fecha_publicacion DESC`,
      [id_usuario]
    );

    res.json({ ok: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registrarEmpresa, validarEmpresa, listarEmpresasPendientes,
  publicarVacante, editarVacante, cambiarEstadoVacante,
  buscarCandidatos, postulantesDeVacante, misVacantes,
};
