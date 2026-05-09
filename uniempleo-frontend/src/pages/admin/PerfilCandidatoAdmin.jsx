// src/pages/admin/PerfilCandidatoAdmin.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../services/api'
import { ArrowLeft, MapPin, Globe, FileText, Briefcase, GraduationCap, Code2, Link2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:3000'
const cvUrl = (ruta) => {
  if (!ruta) return null
  const limpia = ruta.replace(/\\/g, '/').split('uploads/').pop()
  return `${API_BASE}/uploads/${limpia}`
}

const PerfilCandidatoAdmin = () => {
  const { id_usuario } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Buscar perfil por id_usuario
    api.get(`/admin/candidato/${id_usuario}`)
      .then(r => setPerfil(r.data.data))
      .catch(() => toast.error('Perfil no encontrado'))
      .finally(() => setCargando(false))
  }, [id_usuario])

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!perfil) return <p className="text-center py-20 text-gray-400">Perfil no encontrado.</p>

  const habilidades = (() => { try { return JSON.parse(perfil.habilidades_tecnicas || '[]') } catch { return [] } })()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Regresar
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary-600 to-blue-400" />
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-primary-100 flex items-center justify-center overflow-hidden shadow-md">
              {perfil.foto_url
                ? <img src={perfil.foto_url} alt={perfil.nombre_completo} className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-primary-600">{perfil.nombre_completo?.[0]}</span>}
            </div>
            {perfil.cv_activo_url && (
              <a href={cvUrl(perfil.cv_activo_url)} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 btn-secondary text-sm">
                <FileText size={14} /> Ver CV
              </a>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{perfil.nombre_completo}</h1>
          {perfil.titulo_profesional && <p className="text-gray-600 text-sm mt-0.5">{perfil.titulo_profesional}</p>}
          <p className="text-sm text-gray-500 mt-1">{perfil.carrera} · Gen. {perfil.generacion_egreso}</p>
          <p className="text-xs text-gray-400 mt-0.5">{perfil.correo_electronico}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
            <div><span className="text-gray-500 text-xs">Modalidad:</span><p className="font-medium capitalize">{perfil.modalidad_preferida || '—'}</p></div>
            <div><span className="text-gray-500 text-xs">Promedio:</span><p className="font-medium">{perfil.promedio_general || '—'}</p></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {perfil.github_url && <a href={perfil.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"><Code2 size={13}/> GitHub</a>}
            {perfil.portfolio_url && <a href={perfil.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"><Globe size={13}/> Portafolio</a>}
            {perfil.linkedin_url && <a href={perfil.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"><Link2 size={13}/> LinkedIn</a>}
          </div>
        </div>
      </div>

      {/* Sobre mí */}
      {perfil.sobre_mi && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Star size={16} className="text-primary-600"/>Sobre mí</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">{perfil.sobre_mi}</p>
        </div>
      )}

      {/* Habilidades */}
      {habilidades.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Habilidades técnicas</h2>
          <div className="flex flex-wrap gap-2">
            {habilidades.map((h, i) => (
              <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-100 font-medium">
                {typeof h === 'object' ? `${h.nombre} · ${h.nivel}` : h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experiencia */}
      {perfil.experiencias?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Briefcase size={16} className="text-primary-600"/>Experiencia laboral</h2>
          <div className="space-y-4">
            {perfil.experiencias.map(e => (
              <div key={e.id_experiencia} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{e.puesto}</p>
                  <p className="text-xs text-primary-600">{e.empresa}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.fecha_inicio).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                    {' — '}{e.es_actual ? 'Actualidad' : e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : ''}
                  </p>
                  {e.descripcion && <p className="text-xs text-gray-600 mt-1">{e.descripcion}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educación */}
      {perfil.educacion?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><GraduationCap size={16} className="text-primary-600"/>Educación</h2>
          <div className="space-y-4">
            {perfil.educacion.map(e => (
              <div key={e.id_educacion} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <GraduationCap size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{e.institucion}</p>
                  <p className="text-xs text-gray-700">{e.grado}{e.campo_estudio && ` · ${e.campo_estudio}`}</p>
                  {e.promedio && <p className="text-xs text-gray-400">Promedio: {e.promedio}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerfilCandidatoAdmin
