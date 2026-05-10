// src/pages/PerfilPublico.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { MapPin, Globe, FileText, Briefcase, GraduationCap, Star,
         ChevronDown, ChevronUp, Link2, Code2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:3000'
const cvUrl = (ruta) => {
  if (!ruta) return null
  const limpia = ruta.replace(/\\/g, '/').split('uploads/').pop()
  return `${API_BASE}/uploads/${limpia}`
}

const SeccionCard = ({ titulo, icono: Icon, children }) => {
  const [abierto, setAbierto] = useState(true)
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icon size={18} className="text-primary-600" />{titulo}
        </h2>
        {abierto ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {abierto && <div className="px-6 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  )
}

const PerfilPublico = () => {
  const { id_perfil } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setCargando(true)
    api.get(`/publico/perfil/${id_perfil}`)
      .then(r => setPerfil(r.data.data))
      .catch(() => toast.error('Perfil no encontrado'))
      .finally(() => setCargando(false))
  }, [id_perfil])

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!perfil) return <p className="text-center py-20 text-gray-400">Perfil no encontrado.</p>

  const habilidades = (() => { try { return JSON.parse(perfil.habilidades_tecnicas || '[]') } catch { return [] } })()
  const idiomas     = (() => { try { return JSON.parse(perfil.idiomas || '[]') } catch { return [] } })()

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Regresar
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary-600 to-blue-400 relative">
          {perfil.banner_url && <img src={perfil.banner_url} alt="banner" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-primary-100 flex items-center justify-center overflow-hidden shadow-md">
              {perfil.foto_url
                ? <img src={perfil.foto_url} alt={perfil.nombre_completo} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-primary-600">{perfil.nombre_completo?.[0]}</span>}
            </div>
            {perfil.cv_activo?.url_almacenamiento && (
              <a href={cvUrl(perfil.cv_activo.url_almacenamiento)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 btn-secondary text-sm">
                <FileText size={14} /> Ver CV
              </a>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{perfil.nombre_completo}</h1>
          {perfil.titulo_profesional && <p className="text-gray-600 mt-0.5">{perfil.titulo_profesional}</p>}
          <p className="text-sm text-gray-500 mt-1">{perfil.carrera} · Gen. {perfil.generacion_egreso}</p>
          {perfil.modalidad_preferida && (
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
              <MapPin size={13} /> Modalidad: <span className="capitalize ml-1">{perfil.modalidad_preferida}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-3">
            {perfil.github_url && (
              <a href={perfil.github_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                <Code2 size={14} /> GitHub
              </a>
            )}
            {perfil.portfolio_url && (
              <a href={perfil.portfolio_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
                <Globe size={14} /> Portafolio
              </a>
            )}
            {perfil.linkedin_url && (
              <a href={perfil.linkedin_url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <Link2 size={14} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {perfil.sobre_mi && (
        <SeccionCard titulo="Sobre mí" icono={Star}>
          <p className="text-sm text-gray-700 mt-4 whitespace-pre-line leading-relaxed">{perfil.sobre_mi}</p>
        </SeccionCard>
      )}

      {habilidades.length > 0 && (
        <SeccionCard titulo="Habilidades técnicas" icono={Star}>
          <div className="flex flex-wrap gap-2 mt-4">
            {habilidades.map((h, i) => (
              <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-100 font-medium">
                {typeof h === 'object' ? `${h.nombre} · ${h.nivel}` : h}
              </span>
            ))}
          </div>
        </SeccionCard>
      )}

      {perfil.experiencias?.length > 0 && (
        <SeccionCard titulo="Experiencia laboral" icono={Briefcase}>
          <div className="space-y-5 mt-4">
            {perfil.experiencias.map(e => (
              <div key={e.id_experiencia} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{e.puesto}</p>
                  <p className="text-sm text-primary-600">{e.empresa}</p>
                  {e.ubicacion && <p className="text-xs text-gray-500">{e.ubicacion}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(e.fecha_inicio).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                    {' — '}
                    {e.es_actual ? 'Actualidad' : e.fecha_fin ? new Date(e.fecha_fin).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : ''}
                  </p>
                  {e.descripcion && <p className="text-sm text-gray-600 mt-2">{e.descripcion}</p>}
                </div>
              </div>
            ))}
          </div>
        </SeccionCard>
      )}

      {perfil.educacion?.length > 0 && (
        <SeccionCard titulo="Educación" icono={GraduationCap}>
          <div className="space-y-5 mt-4">
            {perfil.educacion.map(e => (
              <div key={e.id_educacion} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{e.institucion}</p>
                  <p className="text-sm text-gray-700">{e.grado}{e.campo_estudio && ` · ${e.campo_estudio}`}</p>
                  {(e.fecha_inicio || e.fecha_fin) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {e.fecha_inicio && new Date(e.fecha_inicio).getFullYear()}
                      {e.fecha_fin && ` — ${new Date(e.fecha_fin).getFullYear()}`}
                    </p>
                  )}
                  {e.promedio && <p className="text-xs text-gray-500 mt-0.5">Promedio: {e.promedio}</p>}
                </div>
              </div>
            ))}
          </div>
        </SeccionCard>
      )}

      {idiomas.length > 0 && (
        <SeccionCard titulo="Idiomas" icono={Globe}>
          <div className="flex flex-wrap gap-3 mt-4">
            {idiomas.map((id, i) => (
              <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-full border border-gray-200">
                {typeof id === 'object' ? `${id.idioma} · ${id.nivel}` : id}
              </span>
            ))}
          </div>
        </SeccionCard>
      )}
    </div>
  )
}

export default PerfilPublico
