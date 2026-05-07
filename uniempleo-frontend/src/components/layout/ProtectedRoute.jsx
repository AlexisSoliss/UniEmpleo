// src/components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

// roles: array de tipos de usuario permitidos. Si está vacío, solo requiere estar autenticado.
const ProtectedRoute = ({ children, roles = [] }) => {
  const { autenticado, usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!autenticado) return <Navigate to="/login" replace />

  if (roles.length > 0 && !roles.includes(usuario?.tipo_usuario)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}

export default ProtectedRoute
