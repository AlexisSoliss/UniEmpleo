// src/controllers/publico.controller.js
// Perfil público candidato, perfil empresa, feed, seguimientos

const { query } = require('../config/database')

// ─────────────────────────────────────────────
// GET /api/publico/perfil/:id_perfil
// Perfil público del candidato (visible para todos)
// ─────────────────────────────────────────────
const perfilPublico = async (req, res, next) => {
  try {
    const { id_perfil } = req.params

    const [perfil, experiencias, educacion, cvActivo] = await Promise.all([
      query(`
        SELECT p.id_perfil, p.titulo_profesional, p.sobre_mi,
               p.carrera, p.generacion_egreso, p.promedio_general,
               p.habilidades_tecnicas, p.habilidades_blandas,
               p.modalidad_preferida, p.areas_interes,
               p.certificaciones, p.idiomas, p.logros,
               p.foto_url, p.banner_url,
               p.github_url, p.portfolio_url, p.linkedin_url,
               p.fecha_actualizacion,
               u.nombre_completo, u.correo_electronico
          FROM perfiles_candidatos p
          JOIN usuarios u ON u.id_usuario = p.id_usuario
         WHERE p.id_perfil = $1 AND u.activo = TRUE`,
        [id_perfil]
      ),
      query(`
        SELECT * FROM experiencias
         WHERE id_perfil = $1
         ORDER BY es_actual DESC, fecha_inicio DESC`,
        [id_perfil]
      ),
      query(`
        SELECT * FROM educacion
         WHERE id_perfil = $1
         ORDER BY fecha_inicio DESC`,
        [id_perfil]
      ),
      query(`
        SELECT url_almacenamiento, nombre_archivo
          FROM cvs
         WHERE id_perfil = $1 AND es_activo = TRUE`,
        [id_perfil]
      ),
    ])

    if (perfil.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' })
    }

    // Si el usuario está autenticado, contar seguidores de sus empresas (para contexto)
    res.json({
      ok: true,
      data: {
        ...perfil.rows[0],
        experiencias: experiencias.rows,
        educacion:    educacion.rows,
        cv_activo:    cvActivo.rows[0] || null,
      }
    })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────
// GET /api/publico/empresa/:id_empresa
// Perfil público de empresa
// ─────────────────────────────────────────────
const perfilEmpresa = async (req, res, next) => {
  try {
    const { id_empresa } = req.params

    const [empresa, vacantes, seguidores] = await Promise.all([
      query(`
        SELECT e.id_empresa, e.razon_social, e.sector_productivo,
               e.tamanio, e.descripcion, e.logo_url, e.banner_url,
               e.sitio_web, e.linkedin_empresa, e.anio_fundacion,
               e.num_empleados, e.correo_corporativo, e.nombre_contacto_rh,
               e.estado_validacion
          FROM empresas e
         WHERE e.id_empresa = $1 AND e.estado_validacion = 'aprobada'`,
        [id_empresa]
      ),
      query(`
        SELECT id_vacante, titulo_puesto, modalidad, ubicacion,
               estado, fecha_publicacion, fecha_cierre,
               salario_minimo, salario_maximo
          FROM vacantes
         WHERE id_empresa = $1 AND estado = 'activa'
         ORDER BY fecha_publicacion DESC
         LIMIT 10`,
        [id_empresa]
      ),
      query(`
        SELECT COUNT(*) AS total FROM seguimientos WHERE id_empresa = $1`,
        [id_empresa]
      ),
    ])

    if (empresa.rows.length === 0) {
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada.' })
    }

    // Si viene token, verificar si el candidato ya sigue esta empresa
    let ya_sigue = false
    if (req.user) {
      const perfilRes = await query(
        'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
        [req.user.id_usuario]
      )
      if (perfilRes.rows.length > 0) {
        const sigueRes = await query(
          'SELECT 1 FROM seguimientos WHERE id_candidato = $1 AND id_empresa = $2',
          [perfilRes.rows[0].id_perfil, id_empresa]
        )
        ya_sigue = sigueRes.rows.length > 0
      }
    }

    res.json({
      ok: true,
      data: {
        ...empresa.rows[0],
        vacantes_activas: vacantes.rows,
        total_seguidores: parseInt(seguidores.rows[0].total),
        ya_sigue,
      }
    })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────
// POST /api/publico/empresa/:id_empresa/seguir
// Toggle seguir/dejar de seguir empresa
// ─────────────────────────────────────────────
const toggleSeguir = async (req, res, next) => {
  try {
    const id_usuario   = req.user.id_usuario
    const { id_empresa } = req.params

    const perfilRes = await query(
      'SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario = $1',
      [id_usuario]
    )
    if (perfilRes.rows.length === 0) {
      return res.status(400).json({ ok: false, message: 'Crea tu perfil antes de seguir empresas.' })
    }
    const id_candidato = perfilRes.rows[0].id_perfil

    const existe = await query(
      'SELECT id_seguimiento FROM seguimientos WHERE id_candidato = $1 AND id_empresa = $2',
      [id_candidato, id_empresa]
    )

    if (existe.rows.length > 0) {
      await query(
        'DELETE FROM seguimientos WHERE id_candidato = $1 AND id_empresa = $2',
        [id_candidato, id_empresa]
      )
      return res.json({ ok: true, message: 'Dejaste de seguir esta empresa.', siguiendo: false })
    }

    await query(
      'INSERT INTO seguimientos (id_candidato, id_empresa) VALUES ($1, $2)',
      [id_candidato, id_empresa]
    )
    res.json({ ok: true, message: '¡Ahora sigues esta empresa!', siguiendo: true })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────
// GET /api/publico/feed
// Feed personalizado: vacantes recomendadas por carrera + empresas seguidas
// ─────────────────────────────────────────────
const feed = async (req, res, next) => {
  try {
    const id_usuario = req.user?.id_usuario
    let carrera = null
    let empresasSeguidas = []

    if (id_usuario) {
      const perfilRes = await query(
        'SELECT id_perfil, carrera FROM perfiles_candidatos WHERE id_usuario = $1',
        [id_usuario]
      )
      if (perfilRes.rows.length > 0) {
        carrera = perfilRes.rows[0].carrera
        const id_perfil = perfilRes.rows[0].id_perfil

        const segRes = await query(
          'SELECT id_empresa FROM seguimientos WHERE id_candidato = $1',
          [id_perfil]
        )
        empresasSeguidas = segRes.rows.map(r => r.id_empresa)
      }
    }

    // Vacantes de empresas seguidas (primero en el feed)
    let vacantesSeguidas = []
    if (empresasSeguidas.length > 0) {
      const res2 = await query(`
        SELECT v.id_vacante, v.titulo_puesto, v.modalidad, v.ubicacion,
               v.salario_minimo, v.salario_maximo, v.fecha_publicacion,
               v.fecha_cierre, v.requisitos_academicos,
               e.razon_social, e.logo_url, e.id_empresa,
               'seguida' AS origen
          FROM vacantes v
          JOIN empresas e ON e.id_empresa = v.id_empresa
         WHERE v.id_empresa = ANY($1::int[])
           AND v.estado = 'activa'
           AND v.fecha_cierre >= CURRENT_DATE
         ORDER BY v.fecha_publicacion DESC
         LIMIT 10`,
        [empresasSeguidas]
      )
      vacantesSeguidas = res2.rows
    }

    // Vacantes recomendadas por carrera
    let vacantesRecomendadas = []
    if (carrera) {
      const res3 = await query(`
        SELECT v.id_vacante, v.titulo_puesto, v.modalidad, v.ubicacion,
               v.salario_minimo, v.salario_maximo, v.fecha_publicacion,
               v.fecha_cierre, v.requisitos_academicos,
               e.razon_social, e.logo_url, e.id_empresa,
               'recomendada' AS origen
          FROM vacantes v
          JOIN empresas e ON e.id_empresa = v.id_empresa
         WHERE v.requisitos_academicos ILIKE $1
           AND v.estado = 'activa'
           AND v.fecha_cierre >= CURRENT_DATE
           AND v.id_empresa != ALL($2::int[])
         ORDER BY v.fecha_publicacion DESC
         LIMIT 15`,
        [`%${carrera}%`, empresasSeguidas.length > 0 ? empresasSeguidas : [0]]
      )
      vacantesRecomendadas = res3.rows
    }

    // Vacantes recientes (para usuarios sin perfil)
    const resRecientes = await query(`
      SELECT v.id_vacante, v.titulo_puesto, v.modalidad, v.ubicacion,
             v.salario_minimo, v.salario_maximo, v.fecha_publicacion,
             v.fecha_cierre, e.razon_social, e.logo_url, e.id_empresa,
             'reciente' AS origen
        FROM vacantes v
        JOIN empresas e ON e.id_empresa = v.id_empresa
       WHERE v.estado = 'activa'
         AND v.fecha_cierre >= CURRENT_DATE
       ORDER BY v.fecha_publicacion DESC
       LIMIT 20`)

    // Empresas destacadas (más seguidores)
    const resEmpresas = await query(`
      SELECT e.id_empresa, e.razon_social, e.sector_productivo,
             e.logo_url, e.descripcion, e.num_empleados,
             COUNT(s.id_seguimiento) AS seguidores
        FROM empresas e
        LEFT JOIN seguimientos s ON s.id_empresa = e.id_empresa
       WHERE e.estado_validacion = 'aprobada'
       GROUP BY e.id_empresa
       ORDER BY seguidores DESC
       LIMIT 5`)

    res.json({
      ok: true,
      data: {
        vacantes_empresas_seguidas: vacantesSeguidas,
        vacantes_recomendadas:      vacantesRecomendadas,
        vacantes_recientes:         resRecientes.rows,
        empresas_destacadas:        resEmpresas.rows,
        tiene_perfil:               !!carrera,
      }
    })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────
// Experiencia laboral CRUD
// ─────────────────────────────────────────────
const agregarExperiencia = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario
    const perfilRes  = await query('SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1', [id_usuario])
    if (perfilRes.rows.length === 0) return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' })
    const id_perfil = perfilRes.rows[0].id_perfil

    const { puesto, empresa, ubicacion, fecha_inicio, fecha_fin, descripcion, es_actual } = req.body
    const result = await query(
      `INSERT INTO experiencias (id_perfil, puesto, empresa, ubicacion, fecha_inicio, fecha_fin, descripcion, es_actual)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_perfil, puesto, empresa, ubicacion||null, fecha_inicio, es_actual ? null : fecha_fin, descripcion||null, !!es_actual]
    )
    res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (err) { next(err) }
}

const editarExperiencia = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario
    const { id_experiencia } = req.params
    const { puesto, empresa, ubicacion, fecha_inicio, fecha_fin, descripcion, es_actual } = req.body

    const result = await query(
      `UPDATE experiencias SET
         puesto=COALESCE($1,puesto), empresa=COALESCE($2,empresa),
         ubicacion=COALESCE($3,ubicacion), fecha_inicio=COALESCE($4,fecha_inicio),
         fecha_fin=$5, descripcion=COALESCE($6,descripcion), es_actual=COALESCE($7,es_actual)
       WHERE id_experiencia=$8
         AND id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$9)
       RETURNING *`,
      [puesto||null, empresa||null, ubicacion||null, fecha_inicio||null,
       es_actual ? null : fecha_fin, descripcion||null, es_actual!==undefined?!!es_actual:null,
       id_experiencia, id_usuario]
    )
    if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Experiencia no encontrada.' })
    res.json({ ok: true, data: result.rows[0] })
  } catch (err) { next(err) }
}

const eliminarExperiencia = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario
    const { id_experiencia } = req.params
    await query(
      `DELETE FROM experiencias WHERE id_experiencia=$1
         AND id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$2)`,
      [id_experiencia, id_usuario]
    )
    res.json({ ok: true, message: 'Experiencia eliminada.' })
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────
// Educación CRUD
// ─────────────────────────────────────────────
const agregarEducacion = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario
    const perfilRes  = await query('SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$1', [id_usuario])
    if (perfilRes.rows.length === 0) return res.status(404).json({ ok: false, message: 'Perfil no encontrado.' })
    const id_perfil = perfilRes.rows[0].id_perfil

    const { institucion, grado, campo_estudio, fecha_inicio, fecha_fin, promedio, descripcion } = req.body
    const result = await query(
      `INSERT INTO educacion (id_perfil, institucion, grado, campo_estudio, fecha_inicio, fecha_fin, promedio, descripcion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_perfil, institucion, grado, campo_estudio||null, fecha_inicio||null, fecha_fin||null, promedio||null, descripcion||null]
    )
    res.status(201).json({ ok: true, data: result.rows[0] })
  } catch (err) { next(err) }
}

const eliminarEducacion = async (req, res, next) => {
  try {
    const id_usuario = req.user.id_usuario
    const { id_educacion } = req.params
    await query(
      `DELETE FROM educacion WHERE id_educacion=$1
         AND id_perfil=(SELECT id_perfil FROM perfiles_candidatos WHERE id_usuario=$2)`,
      [id_educacion, id_usuario]
    )
    res.json({ ok: true, message: 'Educación eliminada.' })
  } catch (err) { next(err) }
}

module.exports = {
  perfilPublico, perfilEmpresa, toggleSeguir, feed,
  agregarExperiencia, editarExperiencia, eliminarExperiencia,
  agregarEducacion, eliminarEducacion,
}
