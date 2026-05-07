// src/pages/candidato/Favoritas.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { postulacionService } from '../../services/index'
import { Heart, MapPin, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

const Favoritas = () => {
  const [favoritas, setFavoritas] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    postulacionService.favoritas()
      .then(r => setFavoritas(r.data.data))
      .catch(() => toast.error('Error al cargar favoritas'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const quitar = async (id_vacante) => {
    try {
      await postulacionService.toggleFavorita(id_vacante)
      toast.success('Eliminada de favoritas')
      cargar()
    } catch { toast.error('Error al eliminar') }
  }

  if (cargando) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vacantes Favoritas</h1>
      {favoritas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Heart size={48} className="mx-auto mb-3 opacity-30" />
          <p>No tienes vacantes guardadas como favoritas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoritas.map(f => (
            <div key={f.id_favorito} className="card flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{f.titulo_puesto}</h3>
                <p className="text-sm text-primary-600 mb-2">{f.razon_social}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-1"><MapPin size={12}/>{f.ubicacion}</div>
                  <div className="flex items-center gap-1"><Briefcase size={12}/>{f.modalidad}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Link to={`/busqueda/${f.id_vacante}`} className="text-xs text-primary-600 hover:underline font-medium">
                  Ver vacante →
                </Link>
                <button onClick={() => quitar(f.id_vacante)} className="text-xs text-red-400 hover:text-red-600">
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Favoritas
