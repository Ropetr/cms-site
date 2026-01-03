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
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
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
        'fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
        {!collapsed && (
          <span className="text-xl font-bold text-primary-500">CMS Site</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft
            className={clsx(
              'w-5 h-5 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="font-medium truncate">{user.name || 'Administrador'}</p>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
