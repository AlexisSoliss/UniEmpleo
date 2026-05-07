// src/controllers/admin.controller.js
// RF-27 · Panel administrativo con métricas en tiempo real
// RF-28 · Reportes de empleabilidad por carrera, generación y periodo
// RF-29 · Exportación en PDF y Excel
// RF-30 · Estadísticas por generación y carrera
// RF-31 · KPIs de acreditación
// RF-32 · Gestión CRUD de usuarios

const { query } = require('../config/database');
const ExcelJS   = require('exceljs');
const PDFDoc    = require('pdfkit');

// ─────────────────────────────────────────────
// RF-27 · Dashboard — métricas en tiempo real
// ─────────────────────────────────────────────
const dashboard = async (req, res, next) => {
  try {
    const [
      egresados,
      vacantesActivas,
      postulacionesEnProceso,
      empresasValidadas,
      postulacionesRecientes,
      topCarreras,
    ] = await Promise.all([
      query(`SELECT COUNT(*) FROM usuarios WHERE tipo_usuario IN ('egresado','estudiante') AND activo = TRUE`),
      query(`SELECT COUNT(*) FROM vacantes WHERE estado = 'activa'`),
      query(`SELECT COUNT(*) FROM postulaciones WHERE estado NOT IN ('aceptado','rechazado')`),
      query(`SELECT COUNT(*) FROM empresas WHERE estado_validacion = 'aprobada'`),
      // Últimas 5 postulaciones
      query(`
        SELECT po.id_postulacion, po.estado, po.fecha_postulacion,
               u.nombre_completo, v.titulo_puesto, e.razon_social
          FROM postulaciones po
          JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
          JOIN usuarios u ON u.id_usuario = p.id_usuario
          JOIN vacantes v ON v.id_vacante = po.id_vacante
          JOIN empresas e ON e.id_empresa = v.id_empresa
         ORDER BY po.fecha_postulacion DESC
         LIMIT 5
      `),
      // Top 5 carreras con más postulaciones
      query(`
        SELECT p.carrera, COUNT(po.id_postulacion) AS total
          FROM postulaciones po
          JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         GROUP BY p.carrera
         ORDER BY total DESC
         LIMIT 5
      `),
    ]);

    res.json({
      ok: true,
      data: {
        totales: {
          egresados_registrados:      parseInt(egresados.rows[0].count),
          vacantes_activas:           parseInt(vacantesActivas.rows[0].count),
          postulaciones_en_proceso:   parseInt(postulacionesEnProceso.rows[0].count),
          empresas_validadas:         parseInt(empresasValidadas.rows[0].count),
        },
        postulaciones_recientes: postulacionesRecientes.rows,
        top_carreras:            topCarreras.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-28 + RF-30 · Reporte de empleabilidad
// Query params: carrera, generacion, fecha_ini, fecha_fin
// ─────────────────────────────────────────────
const reporteEmpleabilidad = async (req, res, next) => {
  try {
    const { carrera, generacion, fecha_ini, fecha_fin } = req.query;

    const params = [];
    let idx = 1;

    let filtroWhere = 'WHERE u.activo = TRUE AND u.tipo_usuario IN (\'egresado\',\'estudiante\')';

    if (carrera) {
      filtroWhere += ` AND p.carrera ILIKE $${idx++}`;
      params.push(`%${carrera}%`);
    }
    if (generacion) {
      filtroWhere += ` AND p.generacion_egreso = $${idx++}`;
      params.push(parseInt(generacion));
    }

    // Total de candidatos con el filtro aplicado
    const totalResult = await query(
      `SELECT COUNT(DISTINCT p.id_perfil) AS total
         FROM perfiles_candidatos p
         JOIN usuarios u ON u.id_usuario = p.id_usuario
       ${filtroWhere}`,
      params
    );
    const total = parseInt(totalResult.rows[0].total);

    // Filtro de periodo para postulaciones
    let filtroPeriodo = '';
    const paramsPost = [...params];
    if (fecha_ini) {
      filtroPeriodo += ` AND po.fecha_postulacion >= $${idx++}`;
      paramsPost.push(fecha_ini);
    }
    if (fecha_fin) {
      filtroPeriodo += ` AND po.fecha_postulacion <= $${idx++}`;
      paramsPost.push(fecha_fin);
    }

    // Candidatos con al menos una postulación aceptada
    const aceptadosResult = await query(
      `SELECT COUNT(DISTINCT po.id_candidato) AS aceptados
         FROM postulaciones po
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
        ${filtroWhere} AND po.estado = 'aceptado' ${filtroPeriodo}`,
      paramsPost
    );
    const aceptados = parseInt(aceptadosResult.rows[0].aceptados);

    // Tiempo promedio de colocación (días entre registro y primera postulación aceptada)
    const tiempoResult = await query(
      `SELECT ROUND(AVG(
           EXTRACT(DAY FROM po.fecha_postulacion - u.fecha_registro)
         ))::int AS dias_promedio
         FROM postulaciones po
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
        ${filtroWhere} AND po.estado = 'aceptado' ${filtroPeriodo}`,
      paramsPost
    );

    // Distribución por sector
    const sectoresResult = await query(
      `SELECT e.sector_productivo,
              COUNT(po.id_postulacion) AS postulaciones,
              COUNT(CASE WHEN po.estado='aceptado' THEN 1 END) AS aceptados
         FROM postulaciones po
         JOIN vacantes v ON v.id_vacante = po.id_vacante
         JOIN empresas e ON e.id_empresa = v.id_empresa
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
        ${filtroWhere} ${filtroPeriodo}
        GROUP BY e.sector_productivo
        ORDER BY aceptados DESC`,
      paramsPost
    );

    // Detalle por carrera
    const porCarreraResult = await query(
      `SELECT p.carrera,
              COUNT(DISTINCT p.id_perfil) AS total_candidatos,
              COUNT(DISTINCT CASE WHEN po.estado='aceptado' THEN p.id_perfil END) AS colocados,
              ROUND(
                COUNT(DISTINCT CASE WHEN po.estado='aceptado' THEN p.id_perfil END) * 100.0
                / NULLIF(COUNT(DISTINCT p.id_perfil), 0), 2
              ) AS porcentaje_colocacion
         FROM perfiles_candidatos p
         JOIN usuarios u ON u.id_usuario = p.id_usuario
         LEFT JOIN postulaciones po ON po.id_candidato = p.id_perfil ${filtroPeriodo.replace(/AND po\./g, 'AND po.')}
        ${filtroWhere}
        GROUP BY p.carrera
        ORDER BY colocados DESC`,
      paramsPost
    );

    const reporte = {
      filtros: { carrera, generacion, fecha_ini, fecha_fin },
      resumen: {
        total_candidatos:         total,
        candidatos_colocados:     aceptados,
        porcentaje_empleabilidad: total > 0 ? ((aceptados / total) * 100).toFixed(2) : '0.00',
        dias_promedio_colocacion: tiempoResult.rows[0].dias_promedio || 0,
      },
      por_sector:  sectoresResult.rows,
      por_carrera: porCarreraResult.rows,
    };

    // Guardar metadatos del reporte en BD
    await query(
      `INSERT INTO reportes_empleabilidad
         (id_generado_por, tipo_reporte, filtro_carrera, filtro_generacion,
          filtro_periodo_ini, filtro_periodo_fin)
       VALUES ($1, 'empleabilidad', $2, $3, $4, $5)`,
      [
        req.user.id_usuario,
        carrera || null,
        generacion ? parseInt(generacion) : null,
        fecha_ini || null,
        fecha_fin || null,
      ]
    );

    res.json({ ok: true, data: reporte });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-31 · KPIs de acreditación
// ─────────────────────────────────────────────
const kpisAcreditacion = async (req, res, next) => {
  try {
    const { carrera, generacion } = req.query;
    const params = [];
    let idx = 1;
    let filtro = `WHERE u.tipo_usuario IN ('egresado','estudiante') AND u.activo = TRUE`;

    if (carrera) {
      filtro += ` AND p.carrera ILIKE $${idx++}`;
      params.push(`%${carrera}%`);
    }
    if (generacion) {
      filtro += ` AND p.generacion_egreso = $${idx++}`;
      params.push(parseInt(generacion));
    }

    const [total, colocados, tiempoPromedio, relacionAcademica, sectores] = await Promise.all([
      query(`SELECT COUNT(DISTINCT p.id_perfil) AS c FROM perfiles_candidatos p JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro}`, params),
      query(`SELECT COUNT(DISTINCT po.id_candidato) AS c FROM postulaciones po JOIN perfiles_candidatos p ON p.id_perfil=po.id_candidato JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro} AND po.estado='aceptado'`, params),
      query(`SELECT ROUND(AVG(EXTRACT(DAY FROM po.fecha_postulacion - u.fecha_registro)))::int AS dias FROM postulaciones po JOIN perfiles_candidatos p ON p.id_perfil=po.id_candidato JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro} AND po.estado='aceptado'`, params),
      // % empleos relacionados con el perfil académico (carrera del candidato mencionada en requisitos_academicos)
      query(`SELECT
               COUNT(CASE WHEN v.requisitos_academicos ILIKE '%' || p.carrera || '%' THEN 1 END) AS relacionados,
               COUNT(po.id_postulacion) AS total_aceptados
             FROM postulaciones po
             JOIN perfiles_candidatos p ON p.id_perfil=po.id_candidato
             JOIN usuarios u ON u.id_usuario=p.id_usuario
             JOIN vacantes v ON v.id_vacante=po.id_vacante
             ${filtro} AND po.estado='aceptado'`, params),
      query(`SELECT e.sector_productivo, COUNT(*) AS total FROM postulaciones po JOIN vacantes v ON v.id_vacante=po.id_vacante JOIN empresas e ON e.id_empresa=v.id_empresa JOIN perfiles_candidatos p ON p.id_perfil=po.id_candidato JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro} AND po.estado='aceptado' GROUP BY e.sector_productivo ORDER BY total DESC LIMIT 5`, params),
    ]);

    const totalN    = parseInt(total.rows[0].c) || 0;
    const colocadosN = parseInt(colocados.rows[0].c) || 0;
    const rel        = relacionAcademica.rows[0];
    const pctRelacionado = rel.total_aceptados > 0
      ? ((rel.relacionados / rel.total_aceptados) * 100).toFixed(2)
      : '0.00';

    res.json({
      ok: true,
      data: {
        filtros: { carrera, generacion },
        kpis: {
          porcentaje_egresados_empleados: totalN > 0
            ? ((colocadosN / totalN) * 100).toFixed(2) : '0.00',
          tiempo_promedio_colocacion_dias: tiempoPromedio.rows[0].dias || 0,
          porcentaje_empleo_relacionado_academicamente: pctRelacionado,
          principales_sectores_insercion: sectores.rows,
        },
        totales: { candidatos_registrados: totalN, candidatos_colocados: colocadosN },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-29 · Exportar reporte en Excel
// ─────────────────────────────────────────────
const exportarExcel = async (req, res, next) => {
  try {
    const { carrera, generacion, fecha_ini, fecha_fin } = req.query;
    const params = [];
    let idx = 1;
    let filtro = `WHERE u.tipo_usuario IN ('egresado','estudiante') AND u.activo=TRUE`;

    if (carrera)    { filtro += ` AND p.carrera ILIKE $${idx++}`;           params.push(`%${carrera}%`); }
    if (generacion) { filtro += ` AND p.generacion_egreso = $${idx++}`;     params.push(parseInt(generacion)); }
    if (fecha_ini)  { filtro += ` AND po.fecha_postulacion >= $${idx++}`;   params.push(fecha_ini); }
    if (fecha_fin)  { filtro += ` AND po.fecha_postulacion <= $${idx++}`;   params.push(fecha_fin); }

    const result = await query(
      `SELECT u.nombre_completo, u.correo_electronico,
              p.carrera, p.generacion_egreso, p.promedio_general,
              p.modalidad_preferida,
              po.estado AS estado_postulacion,
              v.titulo_puesto, e.razon_social, e.sector_productivo,
              po.fecha_postulacion
         FROM postulaciones po
         JOIN perfiles_candidatos p ON p.id_perfil = po.id_candidato
         JOIN usuarios u ON u.id_usuario = p.id_usuario
         JOIN vacantes v ON v.id_vacante = po.id_vacante
         JOIN empresas e ON e.id_empresa = v.id_empresa
        ${filtro}
        ORDER BY po.fecha_postulacion DESC`,
      params
    );

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte Empleabilidad');

    worksheet.columns = [
      { header: 'Nombre',            key: 'nombre_completo',      width: 30 },
      { header: 'Correo',            key: 'correo_electronico',   width: 35 },
      { header: 'Carrera',           key: 'carrera',              width: 25 },
      { header: 'Generación',        key: 'generacion_egreso',    width: 12 },
      { header: 'Promedio',          key: 'promedio_general',     width: 10 },
      { header: 'Modalidad Preferida', key: 'modalidad_preferida', width: 18 },
      { header: 'Puesto',            key: 'titulo_puesto',        width: 30 },
      { header: 'Empresa',           key: 'razon_social',         width: 30 },
      { header: 'Sector',            key: 'sector_productivo',    width: 20 },
      { header: 'Estado',            key: 'estado_postulacion',   width: 15 },
      { header: 'Fecha Postulación', key: 'fecha_postulacion',    width: 20 },
    ];

    // Estilo del encabezado
    worksheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center' };
    });

    result.rows.forEach(row => worksheet.addRow(row));

    // Guardar metadatos
    await query(
      `INSERT INTO reportes_empleabilidad
         (id_generado_por, tipo_reporte, filtro_carrera, filtro_generacion,
          filtro_periodo_ini, filtro_periodo_fin, formato_exportacion)
       VALUES ($1,'empleabilidad',$2,$3,$4,$5,'xlsx')`,
      [req.user.id_usuario, carrera||null, generacion?parseInt(generacion):null, fecha_ini||null, fecha_fin||null]
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_empleabilidad.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-29 · Exportar reporte en PDF
// ─────────────────────────────────────────────
const exportarPDF = async (req, res, next) => {
  try {
    const { carrera, generacion, fecha_ini, fecha_fin } = req.query;
    const params = [];
    let idx = 1;
    let filtro = `WHERE u.tipo_usuario IN ('egresado','estudiante') AND u.activo=TRUE`;

    if (carrera)    { filtro += ` AND p.carrera ILIKE $${idx++}`;          params.push(`%${carrera}%`); }
    if (generacion) { filtro += ` AND p.generacion_egreso = $${idx++}`;    params.push(parseInt(generacion)); }

    const [totalRes, colocadosRes, porCarreraRes] = await Promise.all([
      query(`SELECT COUNT(DISTINCT p.id_perfil) AS c FROM perfiles_candidatos p JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro}`, params),
      query(`SELECT COUNT(DISTINCT po.id_candidato) AS c FROM postulaciones po JOIN perfiles_candidatos p ON p.id_perfil=po.id_candidato JOIN usuarios u ON u.id_usuario=p.id_usuario ${filtro} AND po.estado='aceptado'`, params),
      query(`SELECT p.carrera, COUNT(DISTINCT p.id_perfil) AS total, COUNT(DISTINCT CASE WHEN po.estado='aceptado' THEN p.id_perfil END) AS colocados FROM perfiles_candidatos p JOIN usuarios u ON u.id_usuario=p.id_usuario LEFT JOIN postulaciones po ON po.id_candidato=p.id_perfil ${filtro} GROUP BY p.carrera ORDER BY colocados DESC`, params),
    ]);

    const total     = parseInt(totalRes.rows[0].c) || 0;
    const colocados = parseInt(colocadosRes.rows[0].c) || 0;
    const pct       = total > 0 ? ((colocados / total) * 100).toFixed(2) : '0.00';

    // Guardar metadatos
    await query(
      `INSERT INTO reportes_empleabilidad
         (id_generado_por, tipo_reporte, filtro_carrera, filtro_generacion,
          filtro_periodo_ini, filtro_periodo_fin, formato_exportacion)
       VALUES ($1,'empleabilidad',$2,$3,$4,$5,'pdf')`,
      [req.user.id_usuario, carrera||null, generacion?parseInt(generacion):null, fecha_ini||null, fecha_fin||null]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_empleabilidad.pdf"');

    const doc = new PDFDoc({ margin: 50 });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).fillColor('#2563EB').text('UniEmpleo', { align: 'center' });
    doc.fontSize(14).fillColor('#000').text('Reporte de Empleabilidad', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#555')
       .text(`Generado: ${new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}`, { align: 'right' });

    if (carrera || generacion) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333').text(
        `Filtros aplicados: ${[carrera && `Carrera: ${carrera}`, generacion && `Generación: ${generacion}`].filter(Boolean).join(' | ')}`
      );
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#2563EB');
    doc.moveDown();

    // Resumen
    doc.fontSize(13).fillColor('#2563EB').text('Resumen General');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#000');
    doc.text(`• Candidatos registrados:    ${total}`);
    doc.text(`• Candidatos colocados:      ${colocados}`);
    doc.text(`• Porcentaje de empleabilidad: ${pct}%`);
    doc.moveDown();

    // Tabla por carrera
    doc.fontSize(13).fillColor('#2563EB').text('Detalle por Carrera');
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#000');

    porCarreraRes.rows.forEach(row => {
      const pctCarrera = row.total > 0
        ? ((row.colocados / row.total) * 100).toFixed(1) : '0.0';
      doc.text(`  ${row.carrera}: ${row.colocados}/${row.total} colocados (${pctCarrera}%)`);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// RF-32 · CRUD de usuarios (administrador)
// ─────────────────────────────────────────────
const listarUsuarios = async (req, res, next) => {
  try {
    const { tipo_usuario, activo, pagina = 1, limite = 20 } = req.query;
    const limiteParsed = Math.min(parseInt(limite) || 20, 100);
    const offset       = (Math.max(parseInt(pagina) || 1, 1) - 1) * limiteParsed;

    const params = [];
    let idx = 1;
    let where = 'WHERE 1=1';

    if (tipo_usuario) { where += ` AND tipo_usuario = $${idx++}`;  params.push(tipo_usuario); }
    if (activo !== undefined) { where += ` AND activo = $${idx++}`; params.push(activo === 'true'); }

    const total   = await query(`SELECT COUNT(*) FROM usuarios ${where}`, params);
    params.push(limiteParsed, offset);

    const result = await query(
      `SELECT id_usuario, nombre_completo, correo_electronico,
              tipo_usuario, activo, verificado, fecha_registro, ultimo_acceso
         FROM usuarios ${where}
         ORDER BY fecha_registro DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    res.json({
      ok: true,
      total: parseInt(total.rows[0].count),
      pagina: parseInt(pagina),
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const editarUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const { nombre_completo, tipo_usuario, activo } = req.body;

    const result = await query(
      `UPDATE usuarios SET
         nombre_completo = COALESCE($1, nombre_completo),
         tipo_usuario    = COALESCE($2, tipo_usuario),
         activo          = COALESCE($3, activo)
       WHERE id_usuario = $4
       RETURNING id_usuario, nombre_completo, correo_electronico, tipo_usuario, activo`,
      [nombre_completo||null, tipo_usuario||null, activo !== undefined ? activo : null, id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    res.json({ ok: true, message: 'Usuario actualizado.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const suspenderUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;

    // No permitir suspender al propio admin
    if (parseInt(id_usuario) === req.user.id_usuario) {
      return res.status(400).json({ ok: false, message: 'No puedes suspender tu propia cuenta.' });
    }

    await query('UPDATE usuarios SET activo = FALSE WHERE id_usuario = $1', [id_usuario]);

    // Log de auditoría
    await query(
      `INSERT INTO logs_actividad (id_usuario, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'SUSPENDER_USUARIO', 'admin', $2, $3)`,
      [req.user.id_usuario, JSON.stringify({ usuario_suspendido: id_usuario }), req.ip]
    );

    res.json({ ok: true, message: 'Usuario suspendido.' });
  } catch (err) {
    next(err);
  }
};

const eliminarUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;

    if (parseInt(id_usuario) === req.user.id_usuario) {
      return res.status(400).json({ ok: false, message: 'No puedes eliminar tu propia cuenta.' });
    }

    // Eliminación lógica — solo desactiva y anonimiza datos básicos (LFPDPPP)
    await query(
      `UPDATE usuarios SET
         activo             = FALSE,
         nombre_completo    = 'Usuario eliminado',
         correo_electronico = CONCAT('eliminado_', id_usuario, '@uniempleo.invalid'),
         contrasena_hash    = '',
         token_verificacion = NULL,
         token_recuperacion = NULL
       WHERE id_usuario = $1`,
      [id_usuario]
    );

    await query(
      `INSERT INTO logs_actividad (id_usuario, accion, modulo, detalle, ip_origen)
       VALUES ($1, 'ELIMINAR_USUARIO', 'admin', $2, $3)`,
      [req.user.id_usuario, JSON.stringify({ usuario_eliminado: id_usuario }), req.ip]
    );

    res.json({ ok: true, message: 'Usuario eliminado (anonimizado) correctamente.' });
  } catch (err) {
    next(err);
  }
};

// RF-32 · Crear usuario desde admin
const crearUsuario = async (req, res, next) => {
  try {
    const bcrypt = require('bcrypt');
    const crypto = require('crypto');
    const { nombre_completo, correo_electronico, contrasena, tipo_usuario } = req.body;

    const existe = await query('SELECT 1 FROM usuarios WHERE correo_electronico=$1', [correo_electronico]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ ok: false, message: 'El correo ya está registrado.' });
    }

    const hash  = await bcrypt.hash(contrasena, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const result = await query(
      `INSERT INTO usuarios
         (nombre_completo, correo_electronico, contrasena_hash, tipo_usuario, token_verificacion)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id_usuario, nombre_completo, correo_electronico, tipo_usuario`,
      [nombre_completo, correo_electronico, hash, tipo_usuario, token]
    );

    res.status(201).json({ ok: true, message: 'Usuario creado exitosamente.', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  dashboard,
  reporteEmpleabilidad,
  kpisAcreditacion,
  exportarExcel,
  exportarPDF,
  listarUsuarios,
  editarUsuario,
  suspenderUsuario,
  eliminarUsuario,
  crearUsuario,
};
