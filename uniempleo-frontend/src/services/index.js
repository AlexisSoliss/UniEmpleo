// src/services/auth.service.js
import api from './api'

export const authService = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { correo_electronico: email }),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
  verifyAccount:  (token) => api.get(`/auth/verify?token=${token}`),
}

// src/services/perfil.service.js
export const perfilService = {
  crear:          (data)  => api.post('/perfil', data),
  editar:         (data)  => api.put('/perfil', data),
  getMio:         ()      => api.get('/perfil/me'),
  getPorId:       (id)    => api.get(`/perfil/${id}`),
  subirCV:        (file)  => {
    const form = new FormData()
    form.append('cv', file)
    return api.post('/perfil/cv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  historialCV:    ()      => api.get('/perfil/cv/historial'),
}

// src/services/empresa.service.js
export const empresaService = {
  registrar:      (data)  => api.post('/empresas/registro', data),
  misVacantes:    ()      => api.get('/empresas/vacantes/mis-vacantes'),
  publicarVacante:(data)  => api.post('/empresas/vacantes', data),
  editarVacante:  (id, d) => api.put(`/empresas/vacantes/${id}`, d),
  estadoVacante:  (id, e) => api.patch(`/empresas/vacantes/${id}/estado`, { estado: e }),
  postulantes:    (id)    => api.get(`/empresas/vacantes/${id}/postulantes`),
  buscarCandidatos:(p)    => api.get('/empresas/candidatos/buscar', { params: p }),
  pendientes:     ()      => api.get('/empresas/pendientes'),
  validar:        (id, d) => api.patch(`/empresas/${id}/validar`, d),
}

// src/services/postulacion.service.js
export const postulacionService = {
  postularse:     (id)    => api.post(`/postulaciones/vacante/${id}`),
  mis:            ()      => api.get('/postulaciones/mis-postulaciones'),
  historial:      (p)     => api.get('/postulaciones/historial', { params: p }),
  actualizarEstado:(id,e) => api.patch(`/postulaciones/${id}/estado`, { estado: e }),
  toggleFavorita: (id)    => api.post(`/postulaciones/favoritas/${id}`),
  favoritas:      ()      => api.get('/postulaciones/favoritas'),
}

// src/services/busqueda.service.js
export const busquedaService = {
  vacantes:       (p)     => api.get('/busqueda/vacantes', { params: p }),
  detalle:        (id)    => api.get(`/busqueda/vacantes/${id}`),
  opciones:       ()      => api.get('/busqueda/opciones'),
}

// src/services/admin.service.js
export const adminService = {
  dashboard:      ()      => api.get('/admin/dashboard'),
  reporte:        (p)     => api.get('/admin/reportes/empleabilidad', { params: p }),
  kpis:           (p)     => api.get('/admin/reportes/kpis', { params: p }),
  exportExcel:    (p)     => api.get('/admin/reportes/exportar/excel', { params: p, responseType: 'blob' }),
  exportPDF:      (p)     => api.get('/admin/reportes/exportar/pdf',   { params: p, responseType: 'blob' }),
  usuarios:       (p)     => api.get('/admin/usuarios', { params: p }),
  crearUsuario:   (data)  => api.post('/admin/usuarios', data),
  editarUsuario:  (id, d) => api.put(`/admin/usuarios/${id}`, d),
  suspender:      (id)    => api.patch(`/admin/usuarios/${id}/suspender`),
  eliminar:       (id)    => api.delete(`/admin/usuarios/${id}`),
}

export const publicoService = {
  feed:          ()      => api.get('/publico/feed'),
  perfilPublico: (id)    => api.get(`/publico/perfil/${id}`),
  perfilEmpresa: (id)    => api.get(`/publico/empresa/${id}`),
  seguirEmpresa: (id)    => api.post(`/publico/empresa/${id}/seguir`),
  agregarExp:    (data)  => api.post('/publico/experiencia', data),
  editarExp:     (id, d) => api.put(`/publico/experiencia/${id}`, d),
  eliminarExp:   (id)    => api.delete(`/publico/experiencia/${id}`),
  agregarEdu:    (data)  => api.post('/publico/educacion', data),
  eliminarEdu:   (id)    => api.delete(`/publico/educacion/${id}`),
}
