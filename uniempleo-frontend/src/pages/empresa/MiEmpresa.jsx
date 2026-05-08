// src/pages/empresa/MiEmpresa.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../store/AuthContext'
import { useForm } from 'react-hook-form'
import { Building2, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const MiEmpresa = () => {
  const { usuario } = useAuth()
  const [empresa, setEmpresa]   = useState(null)
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const cargar = async () => {
    try {
      const r = await api.get('/empresas/mi-empresa')
      setEmpresa(r.data.data)
      reset(r.data.data)
    } catch { }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const onSubmit = async (data) => {
    try {
      if (empresa) {
        await api.put('/empresas/mi-empresa', data)
        toast.success('Perfil de empresa actualizado')
      } else {
        await api.post('/empresas/registro', data)
        toast.success('Empresa registrada. Pendiente de validación.')
      }
      setEditando(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Empresa</h1>
        <div className="flex gap-2">
          {empresa && (
            <Link to={`/empresa/${empresa.id_empresa}`} target="_blank"
              className="btn-secondary text-sm flex items-center gap-1">
              <ExternalLink size={14} /> Ver perfil público
            </Link>
          )}
          {empresa && !editando && (
            <button onClick={() => setEditando(true)} className="btn-secondary text-sm">Editar</button>
          )}
        </div>
      </div>

      <div className="card">
        {!editando && empresa ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                {empresa.logo_url
                  ? <img src={empresa.logo_url} alt={empresa.razon_social} className="w-full h-full object-cover rounded-xl" />
                  : <Building2 size={28} className="text-gray-400" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{empresa.razon_social}</h2>
                <p className="text-sm text-gray-500">{empresa.sector_productivo} · {empresa.tamanio}</p>
                <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  empresa.estado_validacion === 'aprobada' ? 'bg-green-100 text-green-700' :
                  empresa.estado_validacion === 'rechazada' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {empresa.estado_validacion}
                </span>
              </div>
            </div>
            {empresa.descripcion && <p className="text-sm text-gray-700">{empresa.descripcion}</p>}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">RFC:</span><p className="font-medium">{empresa.rfc}</p></div>
              <div><span className="text-gray-500">Contacto RH:</span><p className="font-medium">{empresa.nombre_contacto_rh}</p></div>
              <div><span className="text-gray-500">Correo:</span><p className="font-medium">{empresa.correo_corporativo}</p></div>
              <div><span className="text-gray-500">Teléfono:</span><p className="font-medium">{empresa.telefono || '—'}</p></div>
              {empresa.sitio_web && <div><span className="text-gray-500">Sitio web:</span><p className="font-medium">{empresa.sitio_web}</p></div>}
              {empresa.anio_fundacion && <div><span className="text-gray-500">Fundada:</span><p className="font-medium">{empresa.anio_fundacion}</p></div>}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="font-semibold text-gray-800">{empresa ? 'Editar empresa' : 'Registrar empresa'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
                <input {...register('razon_social')} className="input-field" placeholder="Empresa SA de CV" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RFC *</label>
                <input {...register('rfc')} className="input-field" placeholder="EMP210315AB1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector *</label>
                <input {...register('sector_productivo')} className="input-field" placeholder="Tecnología de la Información" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño *</label>
                <select {...register('tamanio')} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="micro">Micro (1-10)</option>
                  <option value="pequena">Pequeña (11-50)</option>
                  <option value="mediana">Mediana (51-250)</option>
                  <option value="grande">Grande (250+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre contacto RH *</label>
                <input {...register('nombre_contacto_rh')} className="input-field" placeholder="María González" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo corporativo *</label>
                <input {...register('correo_corporativo')} type="email" className="input-field" placeholder="rh@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input {...register('telefono')} className="input-field" placeholder="8181234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año de fundación</label>
                <input {...register('anio_fundacion')} type="number" className="input-field" placeholder="2015" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. empleados</label>
                <input {...register('num_empleados')} className="input-field" placeholder="50-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
                <input {...register('sitio_web')} className="input-field" placeholder="https://empresa.mx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input {...register('linkedin_empresa')} className="input-field" placeholder="https://linkedin.com/company/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input {...register('logo_url')} className="input-field" placeholder="https://..." />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la empresa</label>
              <textarea {...register('descripcion')} rows={4} className="input-field"
                placeholder="Describe tu empresa, cultura, misión y qué la hace especial para trabajar..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {empresa ? 'Guardar cambios' : 'Registrar empresa'}
              </button>
              {empresa && <button type="button" onClick={() => setEditando(false)} className="btn-secondary">Cancelar</button>}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default MiEmpresa
