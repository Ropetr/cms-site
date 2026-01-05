import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  FileText,
  Menu,
  Image,
  Settings,
  Palette,
  Users,
  Mail,
  LogOut,
  ChevronLeft,
  BookOpen,
  Package,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Kits de Templates', path: '/template-kits' },
  { icon: FileText, label: 'Páginas', path: '/pages' },
  { icon: BookOpen, label: 'Blog', path: '/posts' },
  { icon: Menu, label: 'Menus', path: '/menus' },
  { icon: Image, label: 'Mídia', path: '/media' },
  { icon: Mail, label: 'Contatos', path: '/contacts' },
  { icon: Palette, label: 'Temas', path: '/themes' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
  { icon: Users, label: 'Usuários', path: '/users' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, user } = useAuth()

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40 border-r border-gray-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo FIO */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                FIO
              </span>
              <span className="text-[10px] text-gray-500 -mt-1">Sites Premium</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={clsx(
            'p-2 rounded-lg hover:bg-gray-800 transition-colors',
            collapsed && 'hidden'
          )}
        >
          <ChevronLeft
            className={clsx(
              'w-5 h-5 transition-transform text-gray-400',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={logout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Version */}
      {!collapsed && (
        <div className="px-4 py-2 text-center">
          <span className="text-xs text-gray-600">v1.1.0</span>
        </div>
      )}
    </aside>
  )
}
