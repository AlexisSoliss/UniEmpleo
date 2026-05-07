// src/pages/DetalleVacante.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { busquedaService, postulacionService } from '../services/index'
import { useAuth } from '../store/AuthContext'
import { MapPin, Briefcase, DollarSign, Heart, Calendar, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const DetalleVacante = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { esCandidato } = useAuth()
  const [vacante, setVacante] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [postulando, setPostulando] = useState(false)

  useEffect(() => {
    busquedaService.detalle(id)
      .then(r => setVacante(r.data.data))
      .catch(() => toast.error('No se encontró la vacante'))
      .finally(() => setCargando(false))
  }, [id])

  const handlePostular = async () => {
    setPostulando(true)
    try {
      await postulacionService.postularse(id)
      toast.success('¡Postulación enviada exitosamente!')
      setVacante(v => ({ ...v, ya_postulado: true }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al postularse')
    } finally { setPostulando(false) }
  }

  const handleFavorita = async () => {
    try {
      const res = await postulacionService.toggleFavorita(id)
      toast.success(res.data.message)
      setVacante(v => ({ ...v, es_favorita: !v.es_favorita }))
    } catch { toast.error('Error al actualizar favorita') }
  }

  if (cargando) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  if (!vacante) return <p className="text-center py-20 text-gray-400">Vacante no encontrada.</p>

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Regresar
      </button>

      <div className="card mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vacante.titulo_puesto}</h1>
            <p className="text-primary-600 font-semibold mt-1">{vacante.razon_social}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge-${vacante.estado}`}>{vacante.estado}</span>
            {esCandidato && (
              <button onClick={handleFavorita} className={`p-2 rounded-lg border transition-colors ${vacante.es_favorita ? 'text-red-500 border-red-200 bg-red-50' : 'text-gray-400 border-gray-200'}`}>
                <Heart size={18} fill={vacante.es_favorita ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1"><MapPin size={14} className="text-primary-500" />{vacante.ubicacion}</div>
          <div className="flex items-center gap-1"><Briefcase size={14} className="text-primary-500" />{vacante.modalidad}</div>
          <div className="flex items-center gap-1"><Calendar size={14} className="text-primary-500" />Cierra: {new Date(vacante.fecha_cierre).toLocaleDateString('es-MX')}</div>
          {vacante.salario_minimo && (
            <div className="flex items-center gap-1">
              <DollarSign size={14} className="text-primary-500" />
              ${Number(vacante.salario_minimo).toLocaleString()}
              {vacante.salario_maximo && ` – $${Number(vacante.salario_maximo).toLocaleString()}`}
            </div>
          )}
        </div>
      </div>

      <div className="card mb-4 space-y-4">
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Descripción del puesto</h2>
          <p className="text-sm text-gray-600 whitespace-pre-line">{vacante.descripcion}</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Requisitos académicos</h2>
          <p className="text-sm text-gray-600">{vacante.requisitos_academicos}</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Habilidades requeridas</h2>
          <p className="text-sm text-gray-600">{vacante.habilidades_requeridas}</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-800 mb-2">Sector</h2>
          <p className="text-sm text-gray-600">{vacante.sector_productivo}</p>
        </section>
      </div>

      {esCandidato && (
        <div className="card">
          {vacante.ya_postulado ? (
            <p className="text-center text-green-600 font-medium py-2">✅ Ya te postulaste a esta vacante</p>
          ) : (
            <button onClick={handlePostular} disabled={postulando || vacante.estado !== 'activa'}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {postulando ? <><Loader2 size={16} className="animate-spin" />Enviando postulación...</> : 'Postularme a esta vacante'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DetalleVacante
