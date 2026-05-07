// src/pages/candidato/MiPerfil.jsx
import { useState, useEffect, useRef } from 'react'
import { perfilService } from '../../services/index'
import { useForm } from 'react-hook-form'
import { User, Upload, Loader2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const MiPerfil = () => {
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [subiendoCV, setSubiendoCV] = useState(false)
  const fileRef = useRef()
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    perfilService.getMio()
      .then(r => { setPerfil(r.data.data); reset(r.data.data) })
      .catch(() => setEditando(true)) // si no tiene perfil, mostrar form de creación
      .finally(() => setCargando(false))
  }, [])

  const onSubmit = async (data) => {
    try {
      if (perfil) {
        const res = await perfilService.editar(data)
        setPerfil(res.data.data)
        toast.success('Perfil actualizado')
      } else {
        const res = await perfilService.crear(data)
        setPerfil(res.data.data)
        toast.success('Perfil creado exitosamente')
      }
      setEditando(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar perfil')
    }
  }

  const handleCV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendoCV(true)
    try {
      await perfilService.subirCV(file)
      toast.success('CV subido exitosamente')
      const res = await perfilService.getMio()
      setPerfil(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir CV')
    } finally { setSubiendoCV(false) }
  }

  if (cargando) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        {perfil && !editando && (
          <button onClick={() => setEditando(true)} className="btn-secondary text-sm">Editar</button>
        )}
      </div>

      {/* CV actual */}
      {perfil?.cv_activo_url && (
        <div className="card mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-primary-600" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-800">CV activo</p>
              <p className="text-xs text-gray-500">{perfil.cv_nombre}</p>
            </div>
          </div>
          <a href={perfil.cv_activo_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">Ver</a>
        </div>
      )}

      <div className="card">
        {!editando && perfil ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="text-primary-600" size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{perfil.nombre_completo}</p>
                <p className="text-sm text-gray-500">{perfil.carrera} · Gen. {perfil.generacion_egreso}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Modalidad preferida:</span><p className="font-medium capitalize">{perfil.modalidad_preferida || '—'}</p></div>
              <div><span className="text-gray-500">Promedio:</span><p className="font-medium">{perfil.promedio_general || '—'}</p></div>
            </div>
            {perfil.experiencia_laboral && <div className="text-sm"><span className="text-gray-500">Experiencia:</span><p className="mt-1">{perfil.experiencia_laboral}</p></div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="font-semibold text-gray-800">{perfil ? 'Editar perfil' : 'Crear perfil profesional'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrera *</label>
                <input {...register('carrera')} className="input-field" placeholder="Ing. en Sistemas Computacionales" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generación de egreso</label>
                <input {...register('generacion_egreso')} type="number" className="input-field" placeholder="2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad preferida</label>
                <select {...register('modalidad_preferida')} className="input-field">
                  <option value="">Seleccionar</option>
                  <option value="presencial">Presencial</option>
                  <option value="remoto">Remoto</option>
                  <option value="hibrido">Híbrido</option>
                  <option value="indiferente">Indiferente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Promedio general</label>
                <input {...register('promedio_general')} type="number" step="0.01" min="0" max="10" className="input-field" placeholder="9.2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia laboral</label>
              <textarea {...register('experiencia_laboral')} rows={3} className="input-field" placeholder="Describe tu experiencia previa..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certificaciones</label>
              <textarea {...register('certificaciones')} rows={2} className="input-field" placeholder="AWS, CCNA, etc." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {perfil ? 'Guardar cambios' : 'Crear perfil'}
              </button>
              {perfil && <button type="button" onClick={() => setEditando(false)} className="btn-secondary">Cancelar</button>}
            </div>
          </form>
        )}

        {/* Subir CV */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Subir nuevo CV (PDF, máx. 5 MB)</p>
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleCV} className="hidden" />
          <button onClick={() => fileRef.current.click()} disabled={subiendoCV}
            className="btn-secondary flex items-center gap-2 text-sm">
            {subiendoCV ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {subiendoCV ? 'Subiendo...' : 'Seleccionar archivo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MiPerfil
