// src/pages/Cuenta.jsx
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import api from '../services/api'
import { useForm } from 'react-hook-form'
import { Camera, Lock, User, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const Cuenta = () => {
  const { usuario, login, token } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'foto' ? 'foto' : 'foto')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [preview, setPreview] = useState(usuario?.foto_url || null)
  const fileRef = useRef()

  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { isSubmitting: submittingPass } } = useForm()

  // Subir foto real al servidor
  const handleFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2 MB'); return }

    setSubiendoFoto(true)
    try {
      const form = new FormData()
      form.append('foto', file)
      const res = await api.post('/cuenta/foto', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setPreview(res.data.foto_url)
      // Actualizar contexto de auth con nueva foto
      const usuarioActualizado = { ...usuario, foto_url: res.data.foto_url }
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado))
      login({ token, data: usuarioActualizado })
      toast.success('¡Foto de perfil actualizada!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  const onCambiarPassword = async (data) => {
    if (data.nueva !== data.confirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      await api.post('/cuenta/cambiar-password', {
        contrasena_actual: data.actual,
        nueva_contrasena:  data.nueva,
      })
      toast.success('Contraseña actualizada correctamente')
      resetPass()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña')
    }
  }

  const inicial = usuario?.nombre_completo?.[0] || '?'

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración de cuenta</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { id: 'foto',     label: 'Foto de perfil', icon: Camera },
          { id: 'password', label: 'Contraseña',      icon: Lock },
          { id: 'info',     label: 'Mi información',  icon: User },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>

      {/* Tab: Foto de perfil */}
      {tab === 'foto' && (
        <div className="card space-y-6">
          <div className="flex flex-col items-center gap-4">
            {/* Preview de foto */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-100 flex items-center justify-center bg-gradient-to-br from-primary-500 to-blue-600 shadow-lg">
                {preview
                  ? <img src={preview} alt="foto" className="w-full h-full object-cover" />
                  : <span className="text-5xl font-bold text-white">{inicial}</span>}
              </div>
              <button onClick={() => fileRef.current.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-primary-700 transition-colors shadow-md">
                <Camera size={18} className="text-white" />
              </button>
            </div>

            <div className="text-center">
              <p className="font-semibold text-gray-900 text-lg">{usuario?.nombre_completo}</p>
              <p className="text-sm text-gray-500 capitalize">{usuario?.tipo_usuario}</p>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">Requisitos de la imagen:</p>
            <p>• Formato: JPG, PNG, WebP</p>
            <p>• Tamaño máximo: 2 MB</p>
            <p>• Recomendado: imagen cuadrada</p>
          </div>

          <button onClick={() => fileRef.current.click()} disabled={subiendoFoto}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {subiendoFoto
              ? <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
              : <><Camera size={16} /> Seleccionar nueva foto</>}
          </button>
        </div>
      )}

      {/* Tab: Contraseña */}
      {tab === 'password' && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock size={18} className="text-primary-600" /> Cambiar contraseña
          </h2>
          <form onSubmit={handlePass(onCambiarPassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input {...regPass('actual')} type="password" className="input-field"
                placeholder="Tu contraseña actual" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input {...regPass('nueva')} type="password" className="input-field"
                placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input {...regPass('confirmar')} type="password" className="input-field"
                placeholder="Repite la nueva contraseña" />
            </div>
            <button type="submit" disabled={submittingPass}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {submittingPass
                ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                : <><Check size={16} /> Cambiar contraseña</>}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Mi información */}
      {tab === 'info' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <User size={18} className="text-primary-600" /> Información de la cuenta
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Nombre completo</span>
              <span className="text-sm font-medium text-gray-900">{usuario?.nombre_completo}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Correo electrónico</span>
              <span className="text-sm font-medium text-gray-900">{usuario?.correo_electronico}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">Tipo de usuario</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{usuario?.tipo_usuario}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-sm text-gray-500">Estado de cuenta</span>
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Activa</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Para cambiar tu nombre o correo, contacta al administrador.</p>
        </div>
      )}
    </div>
  )
}

export default Cuenta
