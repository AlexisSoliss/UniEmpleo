// src/pages/admin/Reportes.jsx
import { useState } from 'react'
import { adminService } from '../../services/index'
import { FileSpreadsheet, FileText, Loader2, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

const Reportes = () => {
  const [filtros, setFiltros] = useState({ carrera: '', generacion: '', fecha_ini: '', fecha_fin: '' })
  const [reporte, setReporte] = useState(null)
  const [kpis, setKpis]       = useState(null)
  const [cargando, setCargando] = useState(false)
  const [exportando, setExportando] = useState('')

  const handleFiltro = (k, v) => setFiltros(f => ({ ...f, [k]: v }))

  const cargarReporte = async () => {
    setCargando(true)
    try {
      const [r, k] = await Promise.all([
        adminService.reporte(filtros),
        adminService.kpis(filtros),
      ])
      setReporte(r.data.data)
      setKpis(k.data.data)
    } catch { toast.error('Error al generar reporte') }
    finally { setCargando(false) }
  }

  const exportar = async (tipo) => {
    setExportando(tipo)
    try {
      const res = tipo === 'excel'
        ? await adminService.exportExcel(filtros)
        : await adminService.exportPDF(filtros)
      const blob = new Blob([res.data], {
        type: tipo === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_empleabilidad.${tipo === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Archivo descargado')
    } catch { toast.error('Error al exportar') }
    finally { setExportando('') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes de Empleabilidad</h1>

      {/* Filtros */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Filtros del reporte</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <input value={filtros.carrera} onChange={e => handleFiltro('carrera', e.target.value)}
              className="input-field" placeholder="Ej. Sistemas" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generación</label>
            <input value={filtros.generacion} onChange={e => handleFiltro('generacion', e.target.value)}
              type="number" className="input-field" placeholder="2024" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input value={filtros.fecha_ini} onChange={e => handleFiltro('fecha_ini', e.target.value)}
              type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input value={filtros.fecha_fin} onChange={e => handleFiltro('fecha_fin', e.target.value)}
              type="date" className="input-field" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button onClick={cargarReporte} disabled={cargando} className="btn-primary flex items-center gap-2">
            {cargando ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
            Generar reporte
          </button>
          <button onClick={() => exportar('excel')} disabled={!!exportando} className="btn-secondary flex items-center gap-2 text-sm">
            {exportando === 'excel' ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} className="text-green-600" />}
            Exportar Excel
          </button>
          <button onClick={() => exportar('pdf')} disabled={!!exportando} className="btn-secondary flex items-center gap-2 text-sm">
            {exportando === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} className="text-red-600" />}
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Resultados */}
      {reporte && (
        <div className="space-y-6">
          {/* KPIs */}
          {kpis && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-3xl font-bold text-primary-600">{kpis.kpis.porcentaje_egresados_empleados}%</p>
                <p className="text-sm text-gray-500 mt-1">Egresados empleados</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-green-600">{kpis.kpis.tiempo_promedio_colocacion_dias}</p>
                <p className="text-sm text-gray-500 mt-1">Días promedio de colocación</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-bold text-purple-600">{kpis.kpis.porcentaje_empleo_relacionado_academicamente}%</p>
                <p className="text-sm text-gray-500 mt-1">Empleos relacionados al perfil</p>
              </div>
            </div>
          )}

          {/* Resumen */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Resumen general</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <div><p className="text-xl font-bold text-gray-900">{reporte.resumen.total_candidatos}</p><p className="text-gray-500">Candidatos</p></div>
              <div><p className="text-xl font-bold text-gray-900">{reporte.resumen.candidatos_colocados}</p><p className="text-gray-500">Colocados</p></div>
              <div><p className="text-xl font-bold text-gray-900">{reporte.resumen.porcentaje_empleabilidad}%</p><p className="text-gray-500">Empleabilidad</p></div>
              <div><p className="text-xl font-bold text-gray-900">{reporte.resumen.dias_promedio_colocacion}</p><p className="text-gray-500">Días promedio</p></div>
            </div>
          </div>

          {/* Por carrera */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Por carrera</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Carrera</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Candidatos</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Colocados</th>
                  <th className="text-right py-2 text-gray-500 font-medium">% Colocación</th>
                </tr></thead>
                <tbody>
                  {reporte.por_carrera.map(c => (
                    <tr key={c.carrera} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-800">{c.carrera}</td>
                      <td className="py-2 text-right text-gray-600">{c.total_candidatos}</td>
                      <td className="py-2 text-right text-gray-600">{c.colocados}</td>
                      <td className="py-2 text-right font-medium text-primary-600">{c.porcentaje_colocacion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reportes
