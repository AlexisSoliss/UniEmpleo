// Agregar al final de src/services/index.js

export const publicoService = {
  feed:             ()      => api.get('/publico/feed'),
  perfilPublico:    (id)    => api.get(`/publico/perfil/${id}`),
  perfilEmpresa:    (id)    => api.get(`/publico/empresa/${id}`),
  seguirEmpresa:    (id)    => api.post(`/publico/empresa/${id}/seguir`),
  agregarExp:       (data)  => api.post('/publico/experiencia', data),
  editarExp:        (id, d) => api.put(`/publico/experiencia/${id}`, d),
  eliminarExp:      (id)    => api.delete(`/publico/experiencia/${id}`),
  agregarEdu:       (data)  => api.post('/publico/educacion', data),
  eliminarEdu:      (id)    => api.delete(`/publico/educacion/${id}`),
}
