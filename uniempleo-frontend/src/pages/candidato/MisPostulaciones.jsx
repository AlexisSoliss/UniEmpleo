// src/pages/candidato/MisPostulaciones.jsx
import { useState, useEffect } from 'react'
import { postulacionService } from '../../services/index'
import { Briefcase, Clock } from 'lucide-react'
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

  useEffect(() => {
    postulacionService.historial()
      .then(r => setPostulaciones(r.data.data))
      .catch(() => toast.error('Error al cargar postulaciones'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Postulaciones</h1>

      {postulaciones.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aún no te has postulado a ninguna vacante.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {postulaciones.map(p => (
            <div key={p.id_postulacion} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{p.titulo_puesto}</h3>
                <p className="text-sm text-primary-600">{p.razon_social}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {new Date(p.fecha_postulacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  <span>· {p.modalidad} · {p.ubicacion}</span>
                </div>
              </div>
              <div className="shrink-0">
                <span className={`badge-${p.estado}`}>{ESTADO_LABEL[p.estado]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisPostulaciones
