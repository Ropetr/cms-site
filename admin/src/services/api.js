import axios from 'axios'

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'https://cms-site-api.planacacabamentos.workers.dev'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// AUTH
// ============================================
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },
  
  logout: async () => {
    const response = await api.post('/api/auth/logout')
    return response.data
  },
  
  me: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },
}

// ============================================
// PAGES
// ============================================
export const pagesService = {
  list: async (params = {}) => {
    const response = await api.get('/api/pages', { params })
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/pages/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/pages', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/pages/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/pages/${id}`)
    return response.data
  },
  
  // Sections
  getSections: async (pageId) => {
    const response = await api.get(`/api/pages/${pageId}/sections`)
    return response.data
  },
  
  addSection: async (pageId, data) => {
    const response = await api.post(`/api/pages/${pageId}/sections`, data)
    return response.data
  },
  
  updateSection: async (pageId, sectionId, data) => {
    const response = await api.put(`/api/pages/${pageId}/sections/${sectionId}`, data)
    return response.data
  },
  
  deleteSection: async (pageId, sectionId) => {
    const response = await api.delete(`/api/pages/${pageId}/sections/${sectionId}`)
    return response.data
  },
  
  reorderSections: async (pageId, sectionIds) => {
    const response = await api.post(`/api/pages/${pageId}/sections/reorder`, { section_ids: sectionIds })
    return response.data
  },
}

// ============================================
// MENUS
// ============================================
export const menusService = {
  list: async () => {
    const response = await api.get('/api/menus')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/menus/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/menus', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/menus/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/menus/${id}`)
    return response.data
  },
  
  reorder: async (menuIds) => {
    const response = await api.post('/api/menus/reorder', { menu_ids: menuIds })
    return response.data
  },
}

// ============================================
// MEDIA
// ============================================
export const mediaService = {
  list: async (params = {}) => {
    const response = await api.get('/api/media', { params })
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/media/${id}`)
    return response.data
  },
  
  upload: async (formData) => {
    const response = await api.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/media/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/media/${id}`)
    return response.data
  },
}

// ============================================
// SETTINGS
// ============================================
export const settingsService = {
  list: async (group = null) => {
    const params = group ? { group } : {}
    const response = await api.get('/api/settings', { params })
    return response.data
  },
  
  get: async (key) => {
    const response = await api.get(`/api/settings/${key}`)
    return response.data
  },
  
  update: async (key, value) => {
    const response = await api.put(`/api/settings/${key}`, { value })
    return response.data
  },
  
  updateBatch: async (settings) => {
    const response = await api.put('/api/settings', { settings })
    return response.data
  },
}

// ============================================
// THEMES
// ============================================
export const themesService = {
  list: async () => {
    const response = await api.get('/api/themes')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/themes/${id}`)
    return response.data
  },
  
  getActive: async () => {
    const response = await api.get('/api/themes/active')
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/themes', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/themes/${id}`, data)
    return response.data
  },
  
  activate: async (id) => {
    const response = await api.post(`/api/themes/${id}/activate`)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/themes/${id}`)
    return response.data
  },
}

// ============================================
// CONTACTS
// ============================================
export const contactsService = {
  list: async (params = {}) => {
    const response = await api.get('/api/contacts', { params })
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/contacts/${id}`)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/contacts/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/contacts/${id}`)
    return response.data
  },
}

// ============================================
// USERS
// ============================================
export const usersService = {
  list: async () => {
    const response = await api.get('/api/users')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/users/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/users', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/users/${id}`)
    return response.data
  },
}

// ============================================
// PUBLIC (for preview)
// ============================================
export const publicService = {
  getSettings: async () => {
    const response = await api.get('/api/public/settings')
    return response.data
  },
  
  getTheme: async () => {
    const response = await api.get('/api/public/theme')
    return response.data
  },
  
  getNavigation: async () => {
    const response = await api.get('/api/public/navigation')
    return response.data
  },
  
  getPage: async (slug) => {
    const response = await api.get(`/api/public/pages/${slug}`)
    return response.data
  },
}

export default api
