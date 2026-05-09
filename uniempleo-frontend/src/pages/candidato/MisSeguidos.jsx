// src/pages/candidato/MisSeguidos.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Building2, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

const MisSeguidos = () => {
  const [seguidos, setSeguidos] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = () => {
    api.get('/publico/mis-seguidos')
      .then(r => setSeguidos(r.data.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const dejarDeSeguir = async (id_empresa) => {
    try {
      await api.post(`/publico/empresa/${id_empresa}/seguir`)
      toast.success('Dejaste de seguir esta empresa')
      cargar()
    } catch { toast.error('Error') }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Empresas que sigo</h1>

      {seguidos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>No sigues ninguna empresa todavía.</p>
          <Link to="/busqueda" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Explorar empresas →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {seguidos.map(e => (
            <div key={e.id_empresa} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {e.logo_url
                    ? <img src={e.logo_url} alt={e.razon_social} className="w-full h-full object-cover" />
                    : <Building2 size={20} className="text-gray-400" />}
                </div>
                <div>
                  <Link to={`/empresa/${e.id_empresa}`}
                    className="font-semibold text-gray-900 hover:text-primary-600">
                    {e.razon_social}
                  </Link>
                  <p className="text-sm text-gray-500">{e.sector_productivo}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Users size={11} />{e.seguidores} seguidores
                  </p>
                </div>
              </div>
              <button onClick={() => dejarDeSeguir(e.id_empresa)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors">
                <X size={13} /> Dejar de seguir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisSeguidos
