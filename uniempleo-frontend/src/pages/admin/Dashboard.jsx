// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/index'
import api from '../../services/api'
import { useAuth } from '../../store/AuthContext'
import { Users, Briefcase, Send, Building2, TrendingUp, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_COLORS = {
  postulado:       'bg-blue-100 text-blue-700',
  en_revision:     'bg-purple-100 text-purple-700',
  preseleccionado: 'bg-orange-100 text-orange-700',
  aceptado:        'bg-green-100 text-green-700',
  rechazado:       'bg-red-100 text-red-700',
}
const ESTADO_LABEL = {
  postulado:'Postulado', en_revision:'En Revisión',
  preseleccionado:'Preseleccionado', aceptado:'Aceptado', rechazado:'Rechazado',
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`rounded-2xl p-5 flex items-center gap-4 ${color}`}>
    <div className="w-12 h-12 bg-white bg-opacity-30 rounded-xl flex items-center justify-center">
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-white opacity-80">{label}</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { esAdmin } = useAuth()
  const navigate    = useNavigate()
  const [data,      setData]      = useState(null)
  const [candidatos,setCands]     = useState([])
  const [empresas,  setEmpresas]  = useState([])
  const [cargando,  setCargando]  = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const dash = await adminService.dashboard()
        setData(dash.data.data)

        // Solo admin puede listar usuarios
        if (esAdmin) {
          const [egr, est] = await Promise.all([
            api.get('/admin/usuarios?tipo_usuario=egresado&limite=5'),
            api.get('/admin/usuarios?tipo_usuario=estudiante&limite=5'),
          ])
          setCands([...egr.data.data, ...est.data.data])
        }

        // Empresas aprobadas (ambos roles)
        try {
          const emps = await api.get('/admin/empresas-aprobadas')
          setEmpresas(emps.data.data || [])
        } catch { setEmpresas([]) }

      } catch {
        toast.error('Error al cargar dashboard')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [esAdmin])

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!data) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de UniEmpleo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}     label="Candidatos"    value={data.totales.egresados_registrados}    color="bg-gradient-to-br from-blue-500 to-primary-600" />
        <StatCard icon={Briefcase} label="Vacantes"       value={data.totales.vacantes_activas}         color="bg-gradient-to-br from-green-400 to-emerald-600" />
        <StatCard icon={Send}      label="Postulaciones"  value={data.totales.postulaciones_en_proceso} color="bg-gradient-to-br from-purple-400 to-violet-600" />
        <StatCard icon={Building2} label="Empresas"       value={data.totales.empresas_validadas}       color="bg-gradient-to-br from-orange-400 to-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Send size={16} className="text-purple-600" />
            </div>
            Postulaciones recientes
          </h2>
          <div className="space-y-2">
            {data.postulaciones_recientes.map(p => (
              <div key={p.id_postulacion} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{p.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{p.titulo_puesto} · {p.razon_social}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ESTADO_COLORS[p.estado]}`}>
                  {ESTADO_LABEL[p.estado]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
            Top carreras
          </h2>
          <div className="space-y-3">
            {data.top_carreras.map((c, i) => (
              <div key={c.carrera} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
                  i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-600':'bg-orange-100 text-orange-600'
                }`}>{i+1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 truncate">{c.carrera.replace('Ingeniería en ','Ing. ')}</span>
                    <span className="text-xs text-gray-400 ml-1 shrink-0">{c.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-primary-500 to-blue-500 h-1.5 rounded-full"
                      style={{ width:`${Math.min((c.total/(data.top_carreras[0]?.total||1))*100,100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {esAdmin && candidatos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-green-600" />
              </div>
              Candidatos registrados
            </h2>
            <div className="space-y-1">
              {candidatos.map(u => (
                <div key={u.id_usuario} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                      {u.nombre_completo?.[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{u.nombre_completo}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.tipo_usuario}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/candidatos/${u.id_usuario}`)}
                    className="flex items-center gap-1 text-xs text-primary-600 font-medium bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                    <ExternalLink size={12} /> Ver perfil
                  </button>
                </div>
              ))}
              <button onClick={() => navigate('/admin/usuarios')}
                className="w-full text-xs text-center text-primary-600 hover:underline mt-3 py-2">
                Ver todos los usuarios →
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-orange-600" />
            </div>
            Empresas validadas
          </h2>
          {empresas.length === 0
            ? <p className="text-sm text-gray-400">No hay empresas aprobadas.</p>
            : <div className="space-y-1">
                {empresas.slice(0,6).map(e => (
                  <div key={e.id_empresa} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                        {e.logo_url
                          ? <img src={e.logo_url} alt={e.razon_social} className="w-full h-full object-cover" />
                          : <Building2 size={16} className="text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs">{e.razon_social}</p>
                        <p className="text-xs text-gray-400">{e.sector_productivo}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/empresa/${e.id_empresa}`)}
                      className="flex items-center gap-1 text-xs text-primary-600 font-medium bg-primary-50 hover:bg-primary-100 px-2 py-1.5 rounded-lg transition-colors">
                      <ExternalLink size={11} /> Ver
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>

      </div>
    </div>
  )
}

export default Dashboard
