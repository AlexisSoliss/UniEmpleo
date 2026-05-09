// src/pages/candidato/MisPostulaciones.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { postulacionService } from '../../services/index'
import api from '../../services/api'
import { Briefcase, Clock, X } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_LABEL = {
  postulado:       'Postulado',
  en_revision:     'En Revisión',
  preseleccionado: 'Preseleccionado',
  aceptado:        'Aceptado',
  rechazado:       'Rechazado',
}

const MisPostulaciones = () => {
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    postulacionService.historial()
      .then(r => setPostulaciones(r.data.data))
      .catch(() => toast.error('Error al cargar postulaciones'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const cancelarPostulacion = async (id_postulacion) => {
    if (!confirm('¿Cancelar esta postulación? No podrás volver a postularte a la misma vacante.')) return
    try {
      await api.delete(`/postulaciones/${id_postulacion}`)
      toast.success('Postulación cancelada')
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se puede cancelar esta postulación')
    }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Postulaciones</h1>

      {postulaciones.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aún no te has postulado a ninguna vacante.</p>
          <Link to="/busqueda" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Ver vacantes disponibles →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {postulaciones.map(p => (
            <div key={p.id_postulacion} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Link to={`/busqueda/${p.id_vacante}`}
                  className="font-semibold text-gray-900 hover:text-primary-600">
                  {p.titulo_puesto}
                </Link>
                <Link to={`/empresa/${p.id_empresa}`}
                  className="block text-sm text-primary-600 hover:underline">{p.razon_social}</Link>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {new Date(p.fecha_postulacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  <span>· {p.modalidad} · {p.ubicacion}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`badge-${p.estado}`}>{ESTADO_LABEL[p.estado]}</span>
                {/* Solo se puede cancelar si está en estado postulado */}
                {p.estado === 'postulado' && (
                  <button onClick={() => cancelarPostulacion(p.id_postulacion)}
                    title="Cancelar postulación"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisPostulaciones
