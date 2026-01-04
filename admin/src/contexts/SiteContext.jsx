import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sitesService } from '../services/api'
import { useAuth } from './AuthContext'

const SiteContext = createContext(null)

export function SiteProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [sites, setSites] = useState([])
  const [activeSite, setActiveSiteState] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadSites = useCallback(async () => {
    if (!isAuthenticated) {
      setSites([])
      setActiveSiteState(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await sitesService.list()
      
      if (response.success && response.data) {
        setSites(response.data)
        
        const savedSiteId = localStorage.getItem('active_site_id')
        const savedSite = response.data.find(s => s.id === savedSiteId)
        
        if (savedSite) {
          setActiveSiteState(savedSite)
        } else if (response.data.length > 0) {
          setActiveSiteState(response.data[0])
          localStorage.setItem('active_site_id', response.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading sites:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    loadSites()
  }, [loadSites])

  const setActiveSite = useCallback((site) => {
    setActiveSiteState(site)
    if (site) {
      localStorage.setItem('active_site_id', site.id)
    } else {
      localStorage.removeItem('active_site_id')
    }
  }, [])

  const refreshSites = useCallback(async () => {
    await loadSites()
  }, [loadSites])

  const value = {
    sites,
    activeSite,
    loading,
    setActiveSite,
    refreshSites,
  }

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  )
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider')
  }
  return context
}
