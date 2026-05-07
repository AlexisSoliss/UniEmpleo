// src/pages/auth/Register.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/index'
import { Briefcase, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  nombre_completo: z.string().min(3, 'Mínimo 3 caracteres'),
  correo_electronico: z.string().email('Correo inválido'),
  contrasena: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  tipo_usuario: z.enum(['egresado','estudiante','empresa'], {
    errorMap: () => ({ message: 'Selecciona un tipo de usuario' })
  }),
})

const Register = () => {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      await authService.register(data)
      toast.success('¡Registro exitoso! Revisa tu correo para verificar tu cuenta.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-3">
            <Briefcase className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UniEmpleo</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu cuenta</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Registro</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input {...register('nombre_completo')} className="input-field" placeholder="Juan Pérez López" />
              {errors.nombre_completo && <p className="text-red-500 text-xs mt-1">{errors.nombre_completo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input {...register('correo_electronico')} type="email" className="input-field" placeholder="tu@correo.com" />
              {errors.correo_electronico && <p className="text-red-500 text-xs mt-1">{errors.correo_electronico.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input {...register('contrasena')} type="password" className="input-field" placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número" />
              {errors.contrasena && <p className="text-red-500 text-xs mt-1">{errors.contrasena.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de usuario</label>
              <select {...register('tipo_usuario')} className="input-field">
                <option value="">Selecciona una opción</option>
                <option value="egresado">Egresado</option>
                <option value="estudiante">Estudiante próximo a egresar</option>
                <option value="empresa">Empresa / Reclutador</option>
              </select>
              {errors.tipo_usuario && <p className="text-red-500 text-xs mt-1">{errors.tipo_usuario.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Registrando...</> : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
