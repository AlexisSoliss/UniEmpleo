// src/pages/Feed.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../store/AuthContext'
import { MapPin, Briefcase, DollarSign, Building2, Users, Sparkles, Clock, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const VacanteCard = ({ v, onPostular }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
        {v.logo_url
          ? <img src={v.logo_url} alt={v.razon_social} className="w-full h-full object-cover" />
          : <Building2 size={22} className="text-primary-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/busqueda/${v.id_vacante}`} className="font-semibold text-gray-900 hover:text-primary-600 leading-tight block truncate">
          {v.titulo_puesto}
        </Link>
        <Link to={`/empresa/${v.id_empresa}`} className="text-sm text-primary-600 hover:underline">{v.razon_social}</Link>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin size={11}/>{v.ubicacion}</span>
          <span className="flex items-center gap-1"><Briefcase size={11}/>{v.modalidad}</span>
          {v.salario_minimo && (
            <span className="flex items-center gap-1">
              <DollarSign size={11}/>
              ${Number(v.salario_minimo).toLocaleString()}
              {v.salario_maximo && `–$${Number(v.salario_maximo).toLocaleString()}`}
            </span>
          )}
        </div>
        {v.origen === 'recomendada' && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 font-medium">
            <Sparkles size={11}/> Recomendada para ti
          </span>
        )}
        {v.origen === 'seguida' && (
          <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
            <Star size={11}/> Empresa que sigues
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
      <span className="text-xs text-gray-400 flex items-center gap-1">
        <Clock size={11}/>
        {new Date(v.fecha_publicacion).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
      </span>
      <Link to={`/busqueda/${v.id_vacante}`}
        className="text-xs font-medium text-primary-600 hover:text-primary-700">
        Ver detalles →
      </Link>
    </div>
  </div>
)

const Feed = () => {
  const { autenticado, esCandidato } = useAuth()
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get('/publico/feed')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Error al cargar el feed'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  const todasVacantes = [
    ...(data?.vacantes_empresas_seguidas || []),
    ...(data?.vacantes_recomendadas || []),
    ...(data?.vacantes_recientes || []),
  ].filter((v, i, arr) => arr.findIndex(x => x.id_vacante === v.id_vacante) === i)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Banner si no tiene perfil */}
      {autenticado && esCandidato && !data?.tiene_perfil && (
        <div className="bg-gradient-to-r from-primary-600 to-blue-500 rounded-2xl p-6 mb-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">¡Completa tu perfil profesional!</h2>
            <p className="text-blue-100 text-sm mt-1">Recibirás vacantes recomendadas según tu carrera.</p>
          </div>
          <Link to="/candidato/perfil" className="bg-white text-primary-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">
            Crear perfil
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Feed principal */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-lg text-gray-900">
            {data?.tiene_perfil ? 'Vacantes para ti' : 'Vacantes recientes'}
          </h2>

          {todasVacantes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
              <p>No hay vacantes disponibles por el momento.</p>
            </div>
          ) : (
            todasVacantes.map(v => <VacanteCard key={v.id_vacante} v={v} />)
          )}
        </div>

        {/* Sidebar — Empresas destacadas */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-primary-600" /> Empresas destacadas
            </h3>
            <div className="space-y-4">
              {data?.empresas_destacadas?.map(e => (
                <div key={e.id_empresa} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {e.logo_url
                      ? <img src={e.logo_url} alt={e.razon_social} className="w-full h-full object-cover" />
                      : <Building2 size={18} className="text-primary-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/empresa/${e.id_empresa}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block">
                      {e.razon_social}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">{e.sector_productivo}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Users size={10}/>{e.seguidores} seguidores
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/busqueda" className="block text-center text-xs text-primary-600 hover:underline mt-4 font-medium">
              Ver todas las vacantes →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Feed
