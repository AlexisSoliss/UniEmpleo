// src/pages/empresa/Postulantes.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { empresaService, postulacionService } from '../../services/index'
import { ArrowLeft, FileText, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADOS = ['en_revision', 'preseleccionado', 'aceptado', 'rechazado']
const ESTADO_LABEL = {
  en_revision: 'En Revisión', preseleccionado: 'Preseleccionado',
  aceptado: 'Aceptado', rechazado: 'Rechazado',
}

const API_BASE = 'http://localhost:3000'
const cvUrl = (ruta) => {
  if (!ruta) return null
  const limpia = ruta.replace(/\\/g, '/').split('uploads/').pop()
  return `${API_BASE}/uploads/${limpia}`
}

const Postulantes = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [postulantes, setPostulantes] = useState([])
  const [cargando, setCargando] = useState(true)

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
      toast.success(`Estado: ${ESTADO_LABEL[estado]}`)
      cargar()
    } catch { toast.error('Error al actualizar estado') }
  }

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Postulantes ({postulantes.length})
      </h1>

      {postulantes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <User size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aún no hay postulantes para esta vacante.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postulantes.map(p => (
            <div key={p.id_postulacion}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => navigate(`/perfil/${p.id_perfil}`)}
                  className="font-semibold text-gray-900 hover:text-primary-600 flex items-center gap-1 text-left">
                  {p.nombre_completo}
                  <User size={13} className="text-gray-400" />
                </button>
                <p className="text-sm text-gray-500">{p.carrera} · Gen. {p.generacion_egreso}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.correo_electronico}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Postulado: {new Date(p.fecha_postulacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {p.cv_url && (
                  <a href={cvUrl(p.cv_url)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs bg-primary-50 text-primary-600 hover:bg-primary-100 px-2 py-1.5 rounded-lg border border-primary-200 font-medium transition-colors">
                    <FileText size={13} /> Ver CV
                  </a>
                )}
                <span className={`badge-${p.estado}`}>{p.estado}</span>
                <select defaultValue=""
                  onChange={e => e.target.value && actualizarEstado(p.id_postulacion, e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white">
                  <option value="" disabled>Cambiar estado</option>
                  {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Postulantes
