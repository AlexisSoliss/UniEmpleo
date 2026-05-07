// src/pages/auth/Login.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { authService } from '../../services/index'
import { Briefcase, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const schema = z.object({
  correo_electronico: z.string().email('Correo inválido'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
})

const RUTA_POR_ROL = {
  egresado:       '/candidato/perfil',
  estudiante:     '/candidato/perfil',
  empresa:        '/empresa/vacantes',
  administrador:  '/admin/dashboard',
  coordinador:    '/admin/dashboard',
}

const Login = () => {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    try {
      const res = await authService.login(data)
      login(res.data)
      toast.success(`¡Bienvenido, ${res.data.data.nombre_completo.split(' ')[0]}!`)
      navigate(RUTA_POR_ROL[res.data.data.tipo_usuario] || '/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-3">
            <Briefcase className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">UniEmpleo</h1>
          <p className="text-gray-500 text-sm mt-1">Plataforma de Bolsa de Trabajo Universitaria</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input {...register('correo_electronico')} type="email"
                className="input-field" placeholder="tu@correo.com" />
              {errors.correo_electronico && (
                <p className="text-red-500 text-xs mt-1">{errors.correo_electronico.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input {...register('contrasena')} type="password"
                className="input-field" placeholder="••••••••" />
              {errors.contrasena && (
                <p className="text-red-500 text-xs mt-1">{errors.contrasena.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
