// src/pages/empresa/NuevaVacante.jsx
import { useForm } from 'react-hook-form'
import { empresaService } from '../../services/index'
import { Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const NuevaVacante = ({ vacante, onGuardado, onCancelar }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm()

  useEffect(() => { if (vacante) reset(vacante) }, [vacante])

  const onSubmit = async (data) => {
    try {
      if (vacante) {
        await empresaService.editarVacante(vacante.id_vacante, data)
        toast.success('Vacante actualizada')
      } else {
        await empresaService.publicarVacante(data)
        toast.success('Vacante publicada')
      }
      onGuardado()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar vacante')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onCancelar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Regresar
      </button>
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">{vacante ? 'Editar vacante' : 'Publicar nueva vacante'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del puesto *</label>
            <input {...register('titulo_puesto', { required: true })} className="input-field" placeholder="Desarrollador Full Stack" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea {...register('descripcion', { required: true })} rows={4} className="input-field" placeholder="Describe las responsabilidades del puesto..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requisitos académicos *</label>
            <input {...register('requisitos_academicos', { required: true })} className="input-field" placeholder="Ing. en Sistemas, Ing. en Computación" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Habilidades requeridas *</label>
            <input {...register('habilidades_requeridas', { required: true })} className="input-field" placeholder="React, Node.js, PostgreSQL" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad *</label>
              <select {...register('modalidad', { required: true })} className="input-field">
                <option value="">Seleccionar</option>
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
              <input {...register('ubicacion', { required: true })} className="input-field" placeholder="Monterrey, NL" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario mínimo (opcional)</label>
              <input {...register('salario_minimo')} type="number" className="input-field" placeholder="8000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario máximo (opcional)</label>
              <input {...register('salario_maximo')} type="number" className="input-field" placeholder="15000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de cierre *</label>
            <input {...register('fecha_cierre', { required: true })} type="date" className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {vacante ? 'Guardar cambios' : 'Publicar vacante'}
            </button>
            <button type="button" onClick={onCancelar} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NuevaVacante
