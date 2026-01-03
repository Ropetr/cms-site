import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PagesPage from './pages/PagesPage'
import PageEditorPage from './pages/PageEditorPage'
import MenusPage from './pages/MenusPage'
import MediaPage from './pages/MediaPage'
import ContactsPage from './pages/ContactsPage'
import ThemesPage from './pages/ThemesPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import PreviewPage from './pages/PreviewPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Preview route - sem layout do admin */}
      <Route path="/preview/:slug" element={<PreviewPage />} />

      {/* Protected routes */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pages" element={<PagesPage />} />
        <Route path="/pages/new" element={<PageEditorPage />} />
        <Route path="/pages/:id" element={<PageEditorPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/themes" element={<ThemesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Página não encontrada</p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Voltar ao Dashboard
        </a>
      </div>
    </div>
  )
}
