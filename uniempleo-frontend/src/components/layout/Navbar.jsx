// src/components/layout/Navbar.jsx — VERSIÓN FINAL
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { authService } from '../../services/index'
import { LogOut, Briefcase, User, LayoutDashboard, Search, Home } from 'lucide-react'
import toast from 'react-hot-toast'

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation()
  const activo = pathname === to || pathname.startsWith(to + '/')
  return (
    <Link to={to}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-1 py-0.5 border-b-2 ${
        activo ? 'text-primary-600 border-primary-600' : 'text-gray-600 hover:text-primary-600 border-transparent'
      }`}>
      {children}
    </Link>
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Briefcase className="text-primary-600" size={24} />
            <span className="font-bold text-xl text-primary-700">UniEmpleo</span>
          </Link>

          {/* Links de navegación */}
          <div className="hidden md:flex items-center gap-5">
            <NavLink to="/"><Home size={15}/>Inicio</NavLink>
            <NavLink to="/busqueda"><Search size={15}/>Vacantes</NavLink>

            {esCandidato && <>
              <NavLink to="/candidato/perfil"><User size={15}/>Mi Perfil</NavLink>
              <NavLink to="/candidato/postulaciones">Postulaciones</NavLink>
              <NavLink to="/candidato/favoritas">Favoritas</NavLink>
            </>}

            {esEmpresa && <>
              <NavLink to="/empresa/vacantes">Mis Vacantes</NavLink>
            </>}

            {(esAdmin || esCoordinador) && <>
              <NavLink to="/admin/dashboard"><LayoutDashboard size={15}/>Dashboard</NavLink>
              <NavLink to="/admin/reportes">Reportes</NavLink>
              {esAdmin && <NavLink to="/admin/usuarios">Usuarios</NavLink>}
            </>}
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3 shrink-0">
            {autenticado ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-xs">
                      {usuario?.nombre_completo?.[0]}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="font-medium text-gray-800 leading-none">{usuario?.nombre_completo?.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400 capitalize">{usuario?.tipo_usuario}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                  <LogOut size={16}/>
                  <span className="hidden sm:block">Salir</span>
                </button>
              </>
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
