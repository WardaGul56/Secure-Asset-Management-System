import axios from 'axios'

const BASE = 'http://10.1.162.73:8000'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(cfg => {
  const token = sessionStorage.getItem('gg_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(msg))
  }
)

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
}

// Users
export const usersApi = {
  getAll: () => api.get('/users/all'),
  create: (data) => api.post('/users/create', data),
  deactivate: (data) => api.put('/users/deactivate', data),
  getManagers: () => api.get('/users/managers'),
}

// Assets
export const assetsApi = {
  getAll: () => api.get('/assets/all'),
  getOne: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets/create', data),
  updateStatus: (data) => api.put('/assets/status', data),
}

// Zones
export const zonesApi = {
  getAll: () => api.get('/zones/all'),
  getOne: (id) => api.get(`/zones/${id}`),
  create: (data) => api.post('/zones/create', data),
  delete: (id) => api.delete(`/zones/${id}`),
}

// Operators
export const operatorsApi = {
  getAll: () => api.get('/operators/all'),
  getMyTeam: () => api.get('/operators/my-team'),
  toggle: (opId) => api.put(`/operators/toggle-status/${opId}`),
}

//Assignments
export const assignmentsApi = {
  getAll: () => api.get('/assignment/all'),
  getMy: () => api.get('/assignment/my'),
  create: (data) => api.post('/assignment/create', data),
  complete: (data) => api.put('/assignment/complete', data),
}

// Location
export const locationApi = {
  log: (data) => api.post('/location/log', data),
  latest: () => api.get('/location/latest'),
  history: (assetId) => api.get(`/location/history/${assetId}`),
}

// Breaches
export const breachesApi = {
  getAll: () => api.get('/breaches/all'),
  getGeofence: () => api.get('/breaches/geofence'),
  getSqli: () => api.get('/breaches/sqli'),
}

//honeypot
export const honeypotApi = {
  getData: () => api.get('/search/data'),
}