// src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { authService } from '../../services/index'
import {
  LogOut, Briefcase, LayoutDashboard, Search, Home,
  Users, User, Settings, ChevronDown, Camera
} from 'lucide-react'
import toast from 'react-hot-toast'

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation()
  const activo = pathname === to || pathname.startsWith(to + '/')
  return (
    <Link to={to}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-1 py-0.5 border-b-2 ${
        activo
          ? 'text-primary-600 border-primary-600'
          : 'text-gray-600 hover:text-primary-600 border-transparent'
      }`}>
      {children}
    </Link>
  )
}

// Menú desplegable del avatar
const AvatarMenu = ({ usuario, onLogout, esAdmin, esCoordinador, esEmpresa, esCandidato }) => {
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()
  const ref = useRef()

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const irA = (ruta) => { setAbierto(false); navigate(ruta) }

  const fotoUrl = usuario?.foto_url || null
  const inicial = usuario?.nombre_completo?.[0] || '?'

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors group">
        {/* Avatar */}
        <div className="relative">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-200 flex items-center justify-center bg-gradient-to-br from-primary-500 to-blue-600">
            {fotoUrl
              ? <img src={fotoUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-sm">{inicial}</span>}
          </div>
          {/* Indicador online */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-gray-800 leading-none">{usuario?.nombre_completo?.split(' ')[0]}</p>
          <p className="text-xs text-gray-400 capitalize">{usuario?.tipo_usuario}</p>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {abierto && (
        <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
          {/* Header del menú */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200 flex items-center justify-center bg-gradient-to-br from-primary-500 to-blue-600">
                {fotoUrl
                  ? <img src={fotoUrl} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-lg">{inicial}</span>}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{usuario?.nombre_completo}</p>
                <p className="text-xs text-gray-500">{usuario?.correo_electronico}</p>
                <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 capitalize">
                  {usuario?.tipo_usuario}
                </span>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            {/* Mi perfil según rol */}
            {esCandidato && (
              <button onClick={() => irA('/candidato/perfil')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User size={16} className="text-primary-500" />
                <span>Mi Perfil</span>
              </button>
            )}
            {esEmpresa && (
              <button onClick={() => irA('/empresa/perfil')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Briefcase size={16} className="text-primary-500" />
                <span>Mi Empresa</span>
              </button>
            )}

            {/* Configuración de cuenta (foto, contraseña) */}
            <button onClick={() => irA('/cuenta')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings size={16} className="text-gray-400" />
              <span>Configuración de cuenta</span>
            </button>

            {/* Cambiar foto */}
            <button onClick={() => irA('/cuenta?tab=foto')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Camera size={16} className="text-gray-400" />
              <span>Cambiar foto de perfil</span>
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button onClick={() => { setAbierto(false); onLogout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const Navbar = () => {
  const { usuario, logout, esAdmin, esCoordinador, esEmpresa, esCandidato, autenticado } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-blue-500 rounded-lg flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary-700 to-blue-600 bg-clip-text text-transparent">
              UniEmpleo
            </span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex items-center gap-4">
            <NavLink to="/"><Home size={15} />Inicio</NavLink>
            <NavLink to="/busqueda"><Search size={15} />Vacantes</NavLink>

            {esCandidato && <>
              <NavLink to="/candidato/postulaciones">Postulaciones</NavLink>
              <NavLink to="/candidato/favoritas">Favoritas</NavLink>
              <NavLink to="/candidato/seguidos"><Users size={15} />Seguidos</NavLink>
            </>}

            {esEmpresa && <>
              <NavLink to="/empresa/vacantes">Mis Vacantes</NavLink>
            </>}

            {(esAdmin || esCoordinador) && <>
              <NavLink to="/admin/dashboard"><LayoutDashboard size={15} />Dashboard</NavLink>
              <NavLink to="/admin/reportes">Reportes</NavLink>
              {esAdmin && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
            </>}
          </div>

          {/* Avatar / Login */}
          <div className="shrink-0">
            {autenticado ? (
              <AvatarMenu
                usuario={usuario}
                onLogout={handleLogout}
                esAdmin={esAdmin}
                esCoordinador={esCoordinador}
                esEmpresa={esEmpresa}
                esCandidato={esCandidato}
              />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5">Iniciar sesión</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">Registrarse</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar
