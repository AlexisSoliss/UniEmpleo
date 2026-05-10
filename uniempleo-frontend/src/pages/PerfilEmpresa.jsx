// src/pages/PerfilEmpresa.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../store/AuthContext'
import { Building2, Globe, Users, MapPin, Briefcase, DollarSign, Calendar, Link2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const PerfilEmpresa = () => {
  const { id_empresa } = useParams()
  const navigate = useNavigate()
  const { esCandidato } = useAuth()
  const [empresa, setEmpresa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [siguiendo, setSiguiendo] = useState(false)

  const cargar = () => {
    api.get(`/publico/empresa/${id_empresa}`)
      .then(r => { setEmpresa(r.data.data); setSiguiendo(r.data.data.ya_sigue) })
      .catch(() => toast.error('Empresa no encontrada'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [id_empresa])

  const handleSeguir = async () => {
    try {
      const res = await api.post(`/publico/empresa/${id_empresa}/seguir`)
      setSiguiendo(res.data.siguiendo)
      toast.success(res.data.message)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Inicia sesión para seguir empresas')
    }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!empresa) return <p className="text-center py-20 text-gray-400">Empresa no encontrada.</p>

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Regresar
      </button>

      {/* Header empresa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-gray-700 to-gray-900 relative">
          {empresa.banner_url && <img src={empresa.banner_url} alt="banner" className="w-full h-full object-cover" />}
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-xl border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden">
              {empresa.logo_url
                ? <img src={empresa.logo_url} alt={empresa.razon_social} className="w-full h-full object-cover" />
                : <Building2 size={32} className="text-gray-400" />}
            </div>
            {esCandidato && (
              <button onClick={handleSeguir}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  siguiendo
                    ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                    : 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                }`}>
                <Users size={15} />
                {siguiendo ? 'Siguiendo' : 'Seguir'}
              </button>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{empresa.razon_social}</h1>
          <p className="text-gray-600 mt-0.5">{empresa.sector_productivo}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
            {empresa.num_empleados && <span className="flex items-center gap-1"><Users size={14} />{empresa.num_empleados} empleados</span>}
            {empresa.anio_fundacion && <span className="flex items-center gap-1"><Calendar size={14} />Fundada en {empresa.anio_fundacion}</span>}
            <span className="flex items-center gap-1"><Users size={14} />{empresa.total_seguidores} seguidores</span>
          </div>

          {empresa.descripcion && <p className="text-sm text-gray-700 mt-4 leading-relaxed">{empresa.descripcion}</p>}

          <div className="flex flex-wrap gap-4 mt-4">
            {empresa.sitio_web && (
              <a href={empresa.sitio_web} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                <Globe size={14} /> Sitio web
              </a>
            )}
            {empresa.linkedin_empresa && (
              <a href={empresa.linkedin_empresa} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                <Link2 size={14} /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Vacantes activas */}
      {empresa.vacantes_activas?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-primary-600" />
            Vacantes activas ({empresa.vacantes_activas.length})
          </h2>
          <div className="space-y-4">
            {empresa.vacantes_activas.map(v => (
              <div key={v.id_vacante}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <button onClick={() => navigate(`/busqueda/${v.id_vacante}`)}
                    className="font-medium text-gray-900 hover:text-primary-600 text-left">
                    {v.titulo_puesto}
                  </button>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={11} />{v.ubicacion}</span>
                    <span className="flex items-center gap-1"><Briefcase size={11} />{v.modalidad}</span>
                    {v.salario_minimo && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={11} />${Number(v.salario_minimo).toLocaleString()}
                        {v.salario_maximo && `–$${Number(v.salario_maximo).toLocaleString()}`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => navigate(`/busqueda/${v.id_vacante}`)}
                  className="text-xs font-medium text-primary-600 hover:underline whitespace-nowrap">
                  Ver →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerfilEmpresa
