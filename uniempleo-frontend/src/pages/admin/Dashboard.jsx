// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../../services/index'
import api from '../../services/api'
import { useAuth } from '../../store/AuthContext'
import { Users, Briefcase, Send, Building2, TrendingUp, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const ESTADO_LABEL = {
  postulado: 'Postulado', en_revision: 'En Revisión',
  preseleccionado: 'Preseleccionado', aceptado: 'Aceptado', rechazado: 'Rechazado',
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { esAdmin } = useAuth()
  const navigate = useNavigate()
  const [data, setData]         = useState(null)
  const [candidatos, setCandidatos] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [dash, egresados, estudiantes, emps] = await Promise.all([
          adminService.dashboard(),
          api.get('/admin/usuarios?tipo_usuario=egresado&limite=5'),
          api.get('/admin/usuarios?tipo_usuario=estudiante&limite=5'),
          api.get('/admin/empresas-aprobadas'),
        ])
        setData(dash.data.data)
        setCandidatos([...egresados.data.data, ...estudiantes.data.data])
        setEmpresas(emps.data.data || [])
      } catch (err) {
        toast.error('Error al cargar dashboard')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!data) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}     label="Candidatos registrados"  value={data.totales.egresados_registrados}    color="bg-primary-600" />
        <StatCard icon={Briefcase} label="Vacantes activas"         value={data.totales.vacantes_activas}         color="bg-green-500" />
        <StatCard icon={Send}      label="Postulaciones en proceso" value={data.totales.postulaciones_en_proceso} color="bg-purple-500" />
        <StatCard icon={Building2} label="Empresas validadas"       value={data.totales.empresas_validadas}       color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Postulaciones recientes */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Send size={16} className="text-primary-600" /> Postulaciones recientes
          </h2>
          <div className="space-y-3">
            {data.postulaciones_recientes.map(p => (
              <div key={p.id_postulacion} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{p.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{p.titulo_puesto} · {p.razon_social}</p>
                </div>
                <span className={`badge-${p.estado}`}>{ESTADO_LABEL[p.estado]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top carreras */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-600" /> Top carreras
          </h2>
          <div className="space-y-3">
            {data.top_carreras.map((c, i) => (
              <div key={c.carrera} className="flex items-center gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-medium text-gray-800 truncate text-xs">{c.carrera}</span>
                    <span className="text-gray-500 ml-2 shrink-0 text-xs">{c.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min((c.total / (data.top_carreras[0]?.total || 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidatos */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={16} className="text-primary-600" /> Candidatos registrados
          </h2>
          {candidatos.length === 0 ? (
            <p className="text-sm text-gray-400">No hay candidatos registrados.</p>
          ) : (
            <div className="space-y-2">
              {candidatos.map(u => (
                <div key={u.id_usuario} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{u.nombre_completo}</p>
                    <p className="text-xs text-gray-500 capitalize">{u.tipo_usuario} · {u.correo_electronico}</p>
                  </div>
                  <button onClick={() => navigate(`/candidatos/${u.id_usuario}`)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <ExternalLink size={12} /> Ver perfil
                  </button>
                </div>
              ))}
              {esAdmin && (
                <button onClick={() => navigate('/admin/usuarios')}
                  className="block text-xs text-center text-primary-600 hover:underline mt-2 w-full">
                  Ver todos los usuarios →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empresas */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-primary-600" /> Empresas validadas
          </h2>
          {empresas.length === 0 ? (
            <p className="text-sm text-gray-400">No hay empresas aprobadas.</p>
          ) : (
            <div className="space-y-2">
              {empresas.slice(0, 6).map(e => (
                <div key={e.id_empresa} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-xs">{e.razon_social}</p>
                    <p className="text-xs text-gray-500">{e.sector_productivo}</p>
                  </div>
                  <button onClick={() => navigate(`/empresa/${e.id_empresa}`)}
                    className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <ExternalLink size={12} /> Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard
