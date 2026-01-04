import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, Check, Plus } from 'lucide-react'
import { useSite } from '../../contexts/SiteContext'
import { Link } from 'react-router-dom'

export default function SiteSelector() {
  const { sites, activeSite, loading, setActiveSite } = useSite()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="w-24 h-4 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <Link
        to="/sites/new"
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Criar Site</span>
      </Link>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-w-[160px]"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 truncate max-w-[120px]">
          {activeSite?.name || 'Selecionar Site'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Seus Sites</p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => {
                  setActiveSite(site)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  {site.logo_url ? (
                    <img src={site.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Globe className="w-4 h-4 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{site.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {site.domain || site.subdomain || site.slug}
                  </p>
                </div>
                {activeSite?.id === site.id && (
                  <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <Link
              to="/sites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Gerenciar Sites</span>
            </Link>
            <Link
              to="/sites/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Site</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
