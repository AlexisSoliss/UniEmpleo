// src/pages/empresa/MisVacantes.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { empresaService } from '../../services/index'
import { Plus, Users, Pencil, PauseCircle, PlayCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import NuevaVacante from './NuevaVacante'

const MisVacantes = () => {
  const [vacantes, setVacantes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

  const cargar = () => {
    empresaService.misVacantes()
      .then(r => setVacantes(r.data.data))
      .catch(() => toast.error('Error al cargar vacantes'))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  const cambiarEstado = async (id, estado) => {
    try {
      await empresaService.estadoVacante(id, estado)
      toast.success(`Vacante ${estado}`)
      cargar()
    } catch { toast.error('Error al cambiar estado') }
  }

  if (cargando) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>

  if (mostrarForm || editando) return (
    <NuevaVacante
      vacante={editando}
      onGuardado={() => { setMostrarForm(false); setEditando(null); cargar() }}
      onCancelar={() => { setMostrarForm(false); setEditando(null) }}
    />
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Vacantes</h1>
        <button onClick={() => setMostrarForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva vacante
        </button>
      </div>

      {vacantes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Aún no has publicado vacantes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacantes.map(v => (
            <div key={v.id_vacante} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">{v.titulo_puesto}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{v.modalidad} · {v.ubicacion} · Cierra: {new Date(v.fecha_cierre).toLocaleDateString('es-MX')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge-${v.estado}`}>{v.estado}</span>
                <Link to={`/empresa/vacantes/${v.id_vacante}/postulantes`}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                  <Users size={13} /> {v.total_postulantes}
                </Link>
                <button onClick={() => setEditando(v)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                  <Pencil size={14} />
                </button>
                {v.estado === 'activa'
                  ? <button onClick={() => cambiarEstado(v.id_vacante, 'pausada')} className="p-1.5 text-gray-400 hover:text-yellow-500 rounded"><PauseCircle size={14} /></button>
                  : v.estado === 'pausada'
                    ? <button onClick={() => cambiarEstado(v.id_vacante, 'activa')} className="p-1.5 text-gray-400 hover:text-green-500 rounded"><PlayCircle size={14} /></button>
                    : null
                }
                <button onClick={() => cambiarEstado(v.id_vacante, 'eliminada')} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisVacantes
