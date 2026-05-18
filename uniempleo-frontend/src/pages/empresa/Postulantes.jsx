// src/pages/empresa/Postulantes.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { empresaService, postulacionService } from '../../services/index'
import { ArrowLeft, FileText, User, CheckCircle, XCircle, Clock, Eye, RotateCw, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:3000'
const cvUrl = (ruta) => {
  if (!ruta) return null
  const limpia = ruta.replace(/\\/g, '/').split('uploads/').pop()
  return `${API_BASE}/uploads/${limpia}`
}

const ESTADO_CONFIG = {
  postulado:       { label: 'Postulado',       color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: Clock },
  en_revision:     { label: 'En Revisión',     color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Eye },
  preseleccionado: { label: 'Preseleccionado', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Star },
  aceptado:        { label: 'Aceptado ✓',      color: 'bg-green-100 text-green-700 border-green-200',   icon: CheckCircle },
  rechazado:       { label: 'Rechazado',       color: 'bg-red-100 text-red-700 border-red-200',         icon: XCircle },
}

const ACCIONES = [
  { value: 'en_revision',     label: '👁 En Revisión',     color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
  { value: 'preseleccionado', label: '⭐ Preseleccionado', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
  { value: 'aceptado',        label: '✅ Aceptar',          color: 'text-green-600 bg-green-50 hover:bg-green-100' },
  { value: 'rechazado',       label: '❌ Rechazar',          color: 'text-red-600 bg-red-50 hover:bg-red-100' },
]

const Postulantes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [postulantes, setPostulantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargar = () => {
    empresaService.postulantes(id)
      .then(r => setPostulantes(r.data.data))
      .catch(() => toast.error('Error al cargar postulantes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [id])

  const actualizarEstado = async (id_postulacion, estado) => {
    try {
      await postulacionService.actualizarEstado(id_postulacion, estado)
      toast.success(`${ESTADO_CONFIG[estado].label}`)
      cargar()
    } catch { toast.error('Error al actualizar estado') }
  }

  const postulanteFiltrados = filtroEstado
    ? postulantes.filter(p => p.estado === filtroEstado)
    : postulantes

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div>
      <button onClick={() => navigate('/empresa/vacantes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Regresar a mis vacantes
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Postulantes <span className="text-gray-400 font-normal text-xl">({postulantes.length})</span>
        </h1>
        {/* Filtro por estado */}
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="input-field w-auto text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Resumen por estado */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(ESTADO_CONFIG).map(([estado, cfg]) => {
          const count = postulantes.filter(p => p.estado === estado).length
          return (
            <button key={estado}
              onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
              className={`p-3 rounded-xl border text-center transition-all ${
                filtroEstado === estado ? cfg.color + ' ring-2 ring-offset-1' : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {postulanteFiltrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay postulantes{filtroEstado ? ` con estado "${ESTADO_CONFIG[filtroEstado]?.label}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postulanteFiltrados.map(p => {
            const estadoCfg = ESTADO_CONFIG[p.estado] || ESTADO_CONFIG.postulado
            const EstadoIcon = estadoCfg.icon
            return (
              <div key={p.id_postulacion}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {p.nombre_completo?.[0]}
                    </div>
                    <div>
                      <button onClick={() => navigate(`/perfil/${p.id_perfil}`)}
                        className="font-semibold text-gray-900 hover:text-primary-600 flex items-center gap-1 text-left">
                        {p.nombre_completo}
                      </button>
                      <p className="text-sm text-gray-500">{p.carrera} · Gen. {p.generacion_egreso}</p>
                      <p className="text-xs text-gray-400">{p.correo_electronico}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Postulado: {new Date(p.fecha_postulacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Estado actual */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${estadoCfg.color}`}>
                      <EstadoIcon size={12} />
                      {estadoCfg.label}
                    </span>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {p.cv_url && (
                        <a href={cvUrl(p.cv_url)} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 font-medium transition-colors">
                          <FileText size={13} /> Ver CV
                        </a>
                      )}
                      {/* Botones de acción por estado */}
                      {ACCIONES.filter(a => a.value !== p.estado).map(accion => (
                        <button key={accion.value}
                          onClick={() => actualizarEstado(p.id_postulacion, accion.value)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${accion.color} border-current border-opacity-30`}>
                          {accion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Postulantes
