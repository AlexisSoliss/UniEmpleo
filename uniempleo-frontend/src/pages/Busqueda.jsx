// src/pages/Busqueda.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { busquedaService, postulacionService } from '../services/index'
import { useAuth } from '../store/AuthContext'
import { Search, MapPin, Briefcase, DollarSign, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const Busqueda = () => {
  const { esCandidato } = useAuth()
  const [vacantes, setVacantes]   = useState([])
  const [opciones, setOpciones]   = useState({})
  const [total, setTotal]         = useState(0)
  const [pagina, setPagina]       = useState(1)
  const [paginas, setPaginas]     = useState(1)
  const [cargando, setCargando]   = useState(false)
  const [filtros, setFiltros]     = useState({
    q: '', carrera: '', modalidad: '', ubicacion: '', orden: 'reciente'
  })

  useEffect(() => {
    busquedaService.opciones().then(r => setOpciones(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    buscar()
  }, [pagina])

  const buscar = async (resetPagina = false) => {
    setCargando(true)
    try {
      const p = resetPagina ? 1 : pagina
      if (resetPagina) setPagina(1)
      const res = await busquedaService.vacantes({ ...filtros, pagina: p, limite: 12 })
      setVacantes(res.data.data)
      setTotal(res.data.total)
      setPaginas(res.data.paginas)
    } catch { toast.error('Error al cargar vacantes') }
    finally { setCargando(false) }
  }

  const toggleFavorita = async (id) => {
    if (!esCandidato) return toast.error('Inicia sesión como candidato para guardar favoritas')
    try {
      const res = await postulacionService.toggleFavorita(id)
      toast.success(res.data.message)
      buscar()
    } catch { toast.error('Error al actualizar favorita') }
  }

  const handleFiltro = (key, val) => setFiltros(f => ({ ...f, [key]: val }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buscar Vacantes</h1>
        <p className="text-gray-500 text-sm mt-1">{total} vacante{total !== 1 ? 's' : ''} disponible{total !== 1 ? 's' : ''}</p>
      </div>

      {/* Barra de búsqueda */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input value={filtros.q} onChange={e => handleFiltro('q', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar(true)}
              className="input-field pl-9" placeholder="Buscar por puesto o habilidad..." />
          </div>
          <select value={filtros.modalidad} onChange={e => handleFiltro('modalidad', e.target.value)} className="input-field sm:w-40">
            <option value="">Modalidad</option>
            {opciones.modalidades?.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filtros.orden} onChange={e => handleFiltro('orden', e.target.value)} className="input-field sm:w-40">
            <option value="reciente">Más recientes</option>
            <option value="antiguo">Más antiguas</option>
            <option value="relevancia">Relevancia</option>
          </select>
          <button onClick={() => buscar(true)} className="btn-primary whitespace-nowrap">Buscar</button>
        </div>
      </div>

      {/* Grid de vacantes */}
      {cargando ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : vacantes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={48} className="mx-auto mb-3 opacity-30" />
          <p>No se encontraron vacantes con esos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vacantes.map(v => (
            <div key={v.id_vacante} className="card hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 leading-tight">{v.titulo_puesto}</h3>
                  <button onClick={() => toggleFavorita(v.id_vacante)} className="text-gray-300 hover:text-red-400 ml-2 shrink-0">
                    <Heart size={18} />
                  </button>
                </div>
                <p className="text-sm text-primary-600 font-medium mb-2">{v.razon_social}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><MapPin size={12}/>{v.ubicacion}</div>
                  <div className="flex items-center gap-1"><Briefcase size={12}/>{v.modalidad}</div>
                  {v.salario_minimo && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={12}/>
                      ${Number(v.salario_minimo).toLocaleString()}
                      {v.salario_maximo && ` – $${Number(v.salario_maximo).toLocaleString()}`} MXN
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className={`badge-${v.estado}`}>{v.estado}</span>
                <Link to={`/busqueda/${v.id_vacante}`} className="text-xs text-primary-600 hover:underline font-medium">
                  Ver detalles →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {paginas > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button onClick={() => setPagina(p => Math.max(1, p-1))} disabled={pagina === 1} className="btn-secondary p-2">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-600">Página {pagina} de {paginas}</span>
          <button onClick={() => setPagina(p => Math.min(paginas, p+1))} disabled={pagina === paginas} className="btn-secondary p-2">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default Busqueda
