// src/store/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null)
  const [token,   setToken]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('usuario')
    if (t && u) {
      setToken(t)
      setUsuario(JSON.parse(u))
    }
    setCargando(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token',   data.token)
    localStorage.setItem('usuario', JSON.stringify(data.data))
    setToken(data.token)
    setUsuario(data.data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setToken(null)
    setUsuario(null)
  }

  const esAdmin       = usuario?.tipo_usuario === 'administrador'
  const esCoordinador = usuario?.tipo_usuario === 'coordinador'
  const esEmpresa     = usuario?.tipo_usuario === 'empresa'
  const esCandidato   = ['egresado','estudiante'].includes(usuario?.tipo_usuario)

  return (
    <AuthContext.Provider value={{
      usuario, token, cargando,
      login, logout,
      esAdmin, esCoordinador, esEmpresa, esCandidato,
      autenticado: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
