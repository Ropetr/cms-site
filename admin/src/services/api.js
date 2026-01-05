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

// Request interceptor - add auth token and site_id
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const siteId = localStorage.getItem('active_site_id')
    if (siteId) {
      config.headers['X-Site-Id'] = siteId
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
// MENU ITEMS
// ============================================
export const menuItemsService = {
  // Listar itens de um menu específico
  listByMenu: async (menuId) => {
    const response = await api.get(`/api/menu-items/menu/${menuId}`)
    return response.data
  },
  
  // Buscar item por ID
  get: async (id) => {
    const response = await api.get(`/api/menu-items/${id}`)
    return response.data
  },
  
  // Criar item
  create: async (data) => {
    const response = await api.post('/api/menu-items', data)
    return response.data
  },
  
  // Atualizar item
  update: async (id, data) => {
    const response = await api.put(`/api/menu-items/${id}`, data)
    return response.data
  },
  
  // Deletar item
  delete: async (id) => {
    const response = await api.delete(`/api/menu-items/${id}`)
    return response.data
  },
  
  // Reordenar itens
  reorder: async (items) => {
    const response = await api.post('/api/menu-items/reorder', { items })
    return response.data
  },
  
  // Criar múltiplos itens de uma vez
  bulkCreate: async (menuId, items) => {
    const response = await api.post('/api/menu-items/bulk', { menu_id: menuId, items })
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



// ============================================
// POSTS (Blog)
// ============================================
export const postsService = {
  list: async (params = {}) => {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.category) query.append('category', params.category)
    if (params.search) query.append('search', params.search)
    if (params.limit) query.append('limit', params.limit)
    if (params.offset) query.append('offset', params.offset)
    const response = await api.get(`/api/posts?${query.toString()}`)
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/posts/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/posts', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/posts/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/posts/${id}`)
    return response.data
  },
}

// ============================================
// CATEGORIES
// ============================================
export const categoriesService = {
  list: async () => {
    const response = await api.get('/api/categories')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/categories/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/categories', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/categories/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/categories/${id}`)
    return response.data
  },
}


// ============================================
// AI (Workers AI)
// ============================================
export const aiService = {
  generateContent: async (data) => {
    const response = await api.post('/api/ai/generate-content', data)
    return response.data
  },
  
  generateSEO: async (data) => {
    const response = await api.post('/api/ai/generate-seo', data)
    return response.data
  },
  
  generateExcerpt: async (data) => {
    const response = await api.post('/api/ai/generate-excerpt', data)
    return response.data
  },
  
  improveText: async (data) => {
    const response = await api.post('/api/ai/improve-text', data)
    return response.data
  },
  
  generateAlt: async (data) => {
    const response = await api.post('/api/ai/generate-alt', data)
    return response.data
  },
}

// ============================================
// SITES
// ============================================
export const sitesService = {
  list: async () => {
    const response = await api.get('/api/sites')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/sites/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/sites', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/sites/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/sites/${id}`)
    return response.data
  },
  
  setDomain: async (id, domain) => {
    const response = await api.post(`/api/sites/${id}/domain`, { domain })
    return response.data
  },
  
  getDomainStatus: async (id) => {
    const response = await api.get(`/api/sites/${id}/domain/status`)
    return response.data
  },
  
  getUsers: async (id) => {
    const response = await api.get(`/api/sites/${id}/users`)
    return response.data
  },
  
  addUser: async (id, data) => {
    const response = await api.post(`/api/sites/${id}/users`, data)
    return response.data
  },
  
  removeUser: async (id, userId) => {
    const response = await api.delete(`/api/sites/${id}/users/${userId}`)
    return response.data
  },
}

// ============================================
// ORGANIZATIONS
// ============================================
export const organizationsService = {
  list: async () => {
    const response = await api.get('/api/organizations')
    return response.data
  },
  
  get: async (id) => {
    const response = await api.get(`/api/organizations/${id}`)
    return response.data
  },
  
  create: async (data) => {
    const response = await api.post('/api/organizations', data)
    return response.data
  },
  
  update: async (id, data) => {
    const response = await api.put(`/api/organizations/${id}`, data)
    return response.data
  },
  
  delete: async (id) => {
    const response = await api.delete(`/api/organizations/${id}`)
    return response.data
  },
  
  getUsers: async (id) => {
    const response = await api.get(`/api/organizations/${id}/users`)
    return response.data
  },
  
  addUser: async (id, data) => {
    const response = await api.post(`/api/organizations/${id}/users`, data)
    return response.data
  },
  
  removeUser: async (id, userId) => {
    const response = await api.delete(`/api/organizations/${id}/users/${userId}`)
    return response.data
  },
  
  getSites: async (id) => {
    const response = await api.get(`/api/organizations/${id}/sites`)
    return response.data
  },
}

export default api
