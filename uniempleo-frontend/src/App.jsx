// src/App.jsx — VERSIÓN FINAL CON LINKEDIN
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './store/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

// Auth
import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

// Públicas
import Feed          from './pages/Feed'
import Busqueda      from './pages/Busqueda'
import DetalleVacante from './pages/DetalleVacante'
import PerfilPublico from './pages/PerfilPublico'
import PerfilEmpresa from './pages/PerfilEmpresa'

// Candidato
import MiPerfil         from './pages/candidato/MiPerfil'
import MisPostulaciones from './pages/candidato/MisPostulaciones'
import Favoritas        from './pages/candidato/Favoritas'

// Empresa
import MisVacantes from './pages/empresa/MisVacantes'
import Postulantes from './pages/empresa/Postulantes'

// Admin
import Dashboard from './pages/admin/Dashboard'
import Reportes  from './pages/admin/Reportes'
import Usuarios  from './pages/admin/Usuarios'

const CANDIDATO  = ['egresado', 'estudiante']
const EMPRESA    = ['empresa']
const ADMIN      = ['administrador', 'coordinador']
const SOLO_ADMIN = ['administrador']

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>

          {/* Auth sin layout */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Con layout */}
          <Route element={<MainLayout />}>

            {/* Inicio / Feed */}
            <Route path="/"      element={<Feed />} />
            <Route path="/feed"  element={<Feed />} />

            {/* Perfiles públicos */}
            <Route path="/perfil/:id_perfil"   element={<PerfilPublico />} />
            <Route path="/empresa/:id_empresa" element={<PerfilEmpresa />} />

            {/* Búsqueda */}
            <Route path="/busqueda"     element={<Busqueda />} />
            <Route path="/busqueda/:id" element={<DetalleVacante />} />

            {/* Candidato */}
            <Route path="/candidato/perfil"
              element={<ProtectedRoute roles={CANDIDATO}><MiPerfil /></ProtectedRoute>} />
            <Route path="/candidato/postulaciones"
              element={<ProtectedRoute roles={CANDIDATO}><MisPostulaciones /></ProtectedRoute>} />
            <Route path="/candidato/favoritas"
              element={<ProtectedRoute roles={CANDIDATO}><Favoritas /></ProtectedRoute>} />

            {/* Empresa */}
            <Route path="/empresa/vacantes"
              element={<ProtectedRoute roles={EMPRESA}><MisVacantes /></ProtectedRoute>} />
            <Route path="/empresa/vacantes/:id/postulantes"
              element={<ProtectedRoute roles={EMPRESA}><Postulantes /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard"
              element={<ProtectedRoute roles={ADMIN}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/reportes"
              element={<ProtectedRoute roles={ADMIN}><Reportes /></ProtectedRoute>} />
            <Route path="/admin/usuarios"
              element={<ProtectedRoute roles={SOLO_ADMIN}><Usuarios /></ProtectedRoute>} />

            {/* Sin acceso */}
            <Route path="/no-autorizado" element={
              <div className="text-center py-20">
                <p className="text-2xl font-bold text-gray-700">403 — Sin acceso</p>
                <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
              </div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
