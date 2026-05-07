// src/pages/admin/Usuarios.jsx
import { useState, useEffect } from 'react'
import { adminService } from '../../services/index'
import { UserX, Trash2, Pencil, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const TIPO_COLORS = {
  administrador: 'bg-red-100 text-red-700',
  coordinador:   'bg-purple-100 text-purple-700',
  empresa:       'bg-blue-100 text-blue-700',
  egresado:      'bg-green-100 text-green-700',
  estudiante:    'bg-teal-100 text-teal-700',
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [total, setTotal]       = useState(0)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro]     = useState({ tipo_usuario: '', activo: '' })

  const cargar = () => {
    setCargando(true)
    adminService.usuarios(filtro)
      .then(r => { setUsuarios(r.data.data); setTotal(r.data.total) })
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [filtro])

  const suspender = async (id) => {
    if (!confirm('¿Suspender esta cuenta?')) return
    try { await adminService.suspender(id); toast.success('Usuario suspendido'); cargar() }
    catch { toast.error('Error al suspender') }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar (anonimizar) esta cuenta? Esta acción no se puede deshacer.')) return
    try { await adminService.eliminar(id); toast.success('Usuario eliminado'); cargar() }
    catch { toast.error('Error al eliminar') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios <span className="text-gray-400 text-lg font-normal">({total})</span></h1>
      </div>

      {/* Filtros */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <select value={filtro.tipo_usuario} onChange={e => setFiltro(f => ({ ...f, tipo_usuario: e.target.value }))}
          className="input-field w-auto">
          <option value="">Todos los tipos</option>
          <option value="egresado">Egresado</option>
          <option value="estudiante">Estudiante</option>
          <option value="empresa">Empresa</option>
          <option value="coordinador">Coordinador</option>
          <option value="administrador">Administrador</option>
        </select>
        <select value={filtro.activo} onChange={e => setFiltro(f => ({ ...f, activo: e.target.value }))}
          className="input-field w-auto">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Suspendidos</option>
        </select>
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Correo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Registro</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id_usuario} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nombre_completo}</td>
                  <td className="px-4 py-3 text-gray-600">{u.correo_electronico}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${TIPO_COLORS[u.tipo_usuario]}`}>
                      {u.tipo_usuario}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.activo
                      ? <span className="badge-activa">Activo</span>
                      : <span className="badge-rechazado">Suspendido</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.fecha_registro).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => suspender(u.id_usuario)}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 rounded" title="Suspender">
                        <UserX size={14} />
                      </button>
                      <button onClick={() => eliminar(u.id_usuario)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Usuarios
