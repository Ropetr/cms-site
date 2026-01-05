import { Menu, Bell, Search, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import SiteSelector from './SiteSelector'

export default function Header({ onMenuClick }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 bg-gray-800/80 backdrop-blur-xl border-b border-gray-700/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Site Selector */}
          <SiteSelector />
          
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-700">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-primary-600/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
