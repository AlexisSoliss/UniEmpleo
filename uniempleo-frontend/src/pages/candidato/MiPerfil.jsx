// src/pages/candidato/MiPerfil.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { perfilService } from '../../services/index'
import api from '../../services/api'
import { useAuth } from '../../store/AuthContext'
import { useForm } from 'react-hook-form'
import { Upload, Loader2, FileText, Plus, Trash2, Pencil, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:3000'

// Convierte ruta de BD a URL accesible
const cvUrl = (ruta) => {
  if (!ruta) return null
  const limpia = ruta.replace(/\\/g, '/').split('uploads/').pop()
  return `${API_BASE}/uploads/${limpia}`
}

// ── Formulario experiencia ──────────────────
const FormExp = ({ onGuardar, onCancelar, inicial }) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: inicial })
  const onSubmit = async (data) => {
    try {
      if (inicial) await api.put(`/publico/experiencia/${inicial.id_experiencia}`, data)
      else         await api.post('/publico/experiencia', data)
      toast.success(inicial ? 'Experiencia actualizada' : 'Experiencia agregada')
      onGuardar()
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar') }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Puesto *</label>
          <input {...register('puesto')} className="input-field text-sm" placeholder="Desarrollador Backend" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Empresa *</label>
          <input {...register('empresa')} className="input-field text-sm" placeholder="Empresa SA de CV" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ubicación</label>
          <input {...register('ubicacion')} className="input-field text-sm" placeholder="Monterrey, NL" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio *</label>
          <input {...register('fecha_inicio')} type="date" className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
          <input {...register('fecha_fin')} type="date" className="input-field text-sm" />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input {...register('es_actual')} type="checkbox" id="es_actual" className="rounded" />
          <label htmlFor="es_actual" className="text-sm text-gray-700">Trabajo actual</label>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
        <textarea {...register('descripcion')} rows={2} className="input-field text-sm" placeholder="Describe tus responsabilidades..." />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary text-sm flex items-center gap-1">
          {isSubmitting && <Loader2 size={13} className="animate-spin" />} Guardar
        </button>
        <button type="button" onClick={onCancelar} className="btn-secondary text-sm">Cancelar</button>
      </div>
    </form>
  )
}

// ── Formulario educación ────────────────────
const FormEdu = ({ onGuardar, onCancelar }) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const onSubmit = async (data) => {
    try {
      await api.post('/publico/educacion', data)
      toast.success('Educación agregada')
      onGuardar()
    } catch (err) { toast.error(err.response?.data?.message || 'Error al guardar') }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Institución *</label>
          <input {...register('institucion')} className="input-field text-sm" placeholder="TecNM / ITESM..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Grado *</label>
          <input {...register('grado')} className="input-field text-sm" placeholder="Ingeniería / Maestría..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Campo de estudio</label>
          <input {...register('campo_estudio')} className="input-field text-sm" placeholder="Sistemas Computacionales" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Promedio</label>
          <input {...register('promedio')} type="number" step="0.01" min="0" max="10" className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha inicio</label>
          <input {...register('fecha_inicio')} type="date" className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fecha fin</label>
          <input {...register('fecha_fin')} type="date" className="input-field text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary text-sm flex items-center gap-1">
          {isSubmitting && <Loader2 size={13} className="animate-spin" />} Guardar
        </button>
        <button type="button" onClick={onCancelar} className="btn-secondary text-sm">Cancelar</button>
      </div>
    </form>
  )
}

// ── Componente principal ────────────────────
const MiPerfil = () => {
  const { usuario } = useAuth()
  const [perfil, setPerfil]             = useState(null)
  const [experiencias, setExperiencias] = useState([])
  const [educacion, setEducacion]       = useState([])
  const [cargando, setCargando]         = useState(true)
  const [editando, setEditando]         = useState(false)
  const [subiendoCV, setSubiendoCV]     = useState(false)
  const [mostrarFormExp, setMostrarFormExp] = useState(false)
  const [mostrarFormEdu, setMostrarFormEdu] = useState(false)
  const [expEditando, setExpEditando]   = useState(null)
  const fileRef = useRef()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const cargar = async () => {
    setCargando(true)
    try {
      const r = await perfilService.getMio()
      const p = r.data.data
      setPerfil(p)
      // Limpiar campos para el form — no pasar JSON crudo de habilidades
      reset({
        titulo_profesional: p.titulo_profesional || '',
        carrera:            p.carrera || '',
        generacion_egreso:  p.generacion_egreso || '',
        modalidad_preferida: p.modalidad_preferida || '',
        promedio_general:   p.promedio_general || '',
        github_url:         p.github_url || '',
        portfolio_url:      p.portfolio_url || '',
        linkedin_url:       p.linkedin_url || '',
        sobre_mi:           p.sobre_mi || '',
        // Certificaciones: si es JSON array, convertir a texto plano
        certificaciones: (() => {
          try {
            const parsed = JSON.parse(p.certificaciones)
            if (Array.isArray(parsed)) return parsed.map(c => typeof c === 'object' ? c.nombre : c).join(', ')
            return p.certificaciones || ''
          } catch { return p.certificaciones || '' }
        })(),
      })
      if (p?.id_perfil) {
        const pub = await api.get(`/publico/perfil/${p.id_perfil}`)
        setExperiencias(pub.data.data.experiencias || [])
        setEducacion(pub.data.data.educacion || [])
      }
    } catch { setEditando(true) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const onSubmit = async (data) => {
    try {
      // Guardar certificaciones como texto simple (no JSON)
      const payload = { ...data }
      if (perfil) {
        await perfilService.editar(payload)
        toast.success('Perfil actualizado')
      } else {
        await perfilService.crear(payload)
        toast.success('Perfil creado')
      }
      setEditando(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
  }

  const handleCV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoCV(true)
    try {
      await perfilService.subirCV(file)
      toast.success('CV subido exitosamente')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir CV')
    } finally { setSubiendoCV(false) }
  }

  const eliminarExp = async (id) => {
    if (!confirm('¿Eliminar esta experiencia?')) return
    try { await api.delete(`/publico/experiencia/${id}`); toast.success('Eliminada'); cargar() }
    catch { toast.error('Error al eliminar') }
  }

  const eliminarEdu = async (id) => {
    if (!confirm('¿Eliminar esta educación?')) return
    try { await api.delete(`/publico/educacion/${id}`); toast.success('Eliminada'); cargar() }
    catch { toast.error('Error al eliminar') }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <div className="flex gap-2">
          {perfil && (
            <Link to={`/perfil/${perfil.id_perfil}`}
              className="btn-secondary text-sm flex items-center gap-1">
              <ExternalLink size={14} /> Ver perfil público
            </Link>
          )}
          {perfil && !editando && (
            <button onClick={() => setEditando(true)} className="btn-secondary text-sm">Editar</button>
          )}
        </div>
      </div>

      {/* CV activo */}
      {perfil?.cv_activo_url && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-600" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-800">CV activo</p>
              <p className="text-xs text-gray-500">{perfil.cv_nombre}</p>
            </div>
          </div>
          <a href={cvUrl(perfil.cv_activo_url)} target="_blank" rel="noreferrer"
            className="text-xs text-primary-600 hover:underline font-medium">Ver</a>
        </div>
      )}

      {/* Datos del perfil */}
      <div className="card">
        {!editando && perfil ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold text-lg">{usuario?.nombre_completo?.[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{usuario?.nombre_completo}</p>
                <p className="text-sm text-gray-500">{perfil.carrera} · Gen. {perfil.generacion_egreso}</p>
              </div>
            </div>
            {perfil.titulo_profesional && <p className="text-sm text-gray-600 italic">{perfil.titulo_profesional}</p>}
            {perfil.sobre_mi && <p className="text-sm text-gray-700">{perfil.sobre_mi}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Modalidad:</span><p className="font-medium capitalize">{perfil.modalidad_preferida || '—'}</p></div>
              <div><span className="text-gray-500">Promedio:</span><p className="font-medium">{perfil.promedio_general || '—'}</p></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="font-semibold text-gray-800">{perfil ? 'Editar perfil' : 'Crear perfil'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título profesional</label>
                <input {...register('titulo_profesional')} className="input-field" placeholder="Desarrollador Full Stack" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrera *</label>
                <input {...register('carrera')} className="input-field" placeholder="Ing. en Sistemas Computacionales" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generación de egreso</label>
                <input {...register('generacion_egreso')} type="number" className="input-field" placeholder="2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad preferida</label>
                <select {...register('modalidad_preferida')} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="presencial">Presencial</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="indiferente">Indiferente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promedio general</label>
                <input {...register('promedio_general')} type="number" step="0.01" min="0" max="10" className="input-field" placeholder="9.2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                <input {...register('github_url')} className="input-field" placeholder="https://github.com/usuario" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portafolio URL</label>
                <input {...register('portfolio_url')} className="input-field" placeholder="https://mipagina.dev" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input {...register('linkedin_url')} className="input-field" placeholder="https://linkedin.com/in/usuario" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sobre mí</label>
              <textarea {...register('sobre_mi')} rows={3} className="input-field" placeholder="Cuéntanos sobre ti..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificaciones <span className="text-gray-400 text-xs">(separadas por coma)</span></label>
              <textarea {...register('certificaciones')} rows={2} className="input-field" placeholder="AWS Cloud Practitioner 2024, CCNA 2023" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {perfil ? 'Guardar cambios' : 'Crear perfil'}
              </button>
              {perfil && <button type="button" onClick={() => { setEditando(false); cargar() }} className="btn-secondary">Cancelar</button>}
            </div>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Subir nuevo CV (PDF, máx. 5 MB)</p>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleCV} className="hidden" />
          <button onClick={() => fileRef.current.click()} disabled={subiendoCV}
            className="btn-secondary flex items-center gap-2 text-sm">
            {subiendoCV ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {subiendoCV ? 'Subiendo...' : 'Seleccionar archivo'}
          </button>
        </div>
      </div>

      {/* Experiencia */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Experiencia laboral</h2>
          <button onClick={() => { setMostrarFormExp(true); setExpEditando(null) }}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <Plus size={15} /> Agregar
          </button>
        </div>
        {mostrarFormExp && !expEditando && (
          <FormExp onGuardar={() => { setMostrarFormExp(false); cargar() }} onCancelar={() => setMostrarFormExp(false)} />
        )}
        {experiencias.length === 0 && !mostrarFormExp && (
          <p className="text-sm text-gray-400">No has agregado experiencia laboral.</p>
        )}
        <div className="space-y-4 mt-3">
          {experiencias.map(e => (
            <div key={e.id_experiencia}>
              {expEditando?.id_experiencia === e.id_experiencia ? (
                <FormExp inicial={e}
                  onGuardar={() => { setExpEditando(null); cargar() }}
                  onCancelar={() => setExpEditando(null)} />
              ) : (
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{e.puesto}</p>
                    <p className="text-xs text-primary-600">{e.empresa}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(e.fecha_inicio).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                      {' — '}{e.es_actual ? 'Actualidad' : e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : ''}
                    </p>
                    {e.descripcion && <p className="text-xs text-gray-600 mt-1">{e.descripcion}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setExpEditando(e)} className="p-1 text-gray-400 hover:text-primary-600 rounded"><Pencil size={13} /></button>
                    <button onClick={() => eliminarExp(e.id_experiencia)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Educación */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Educación</h2>
          <button onClick={() => setMostrarFormEdu(true)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <Plus size={15} /> Agregar
          </button>
        </div>
        {mostrarFormEdu && (
          <FormEdu onGuardar={() => { setMostrarFormEdu(false); cargar() }} onCancelar={() => setMostrarFormEdu(false)} />
        )}
        {educacion.length === 0 && !mostrarFormEdu && (
          <p className="text-sm text-gray-400">No has agregado educación.</p>
        )}
        <div className="space-y-3 mt-3">
          {educacion.map(e => (
            <div key={e.id_educacion} className="flex gap-3 items-start">
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{e.institucion}</p>
                <p className="text-xs text-gray-600">{e.grado}{e.campo_estudio && ` · ${e.campo_estudio}`}</p>
                {e.promedio && <p className="text-xs text-gray-400">Promedio: {e.promedio}</p>}
              </div>
              <button onClick={() => eliminarEdu(e.id_educacion)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MiPerfil
