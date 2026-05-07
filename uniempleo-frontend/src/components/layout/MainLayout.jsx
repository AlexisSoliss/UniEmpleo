// src/components/layout/MainLayout.jsx
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Outlet />
    </main>
    <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
      UniEmpleo © {new Date().getFullYear()} · Plataforma de Bolsa de Trabajo Universitaria
    </footer>
  </div>
)

export default MainLayout
