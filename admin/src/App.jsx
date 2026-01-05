import { Routes, Route } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PagesPage from './pages/PagesPage'
import PageEditorPage from './pages/PageEditorPage'
import PostsPage from './pages/PostsPage'
import PostEditorPage from './pages/PostEditorPage'
import MenusPage from './pages/MenusPage'
import MediaPage from './pages/MediaPage'
import ContactsPage from './pages/ContactsPage'
import ThemesPage from './pages/ThemesPage'
import TemplateKitsPage from './pages/TemplateKitsPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import PreviewPage from './pages/PreviewPage'
import SitesPage from './pages/SitesPage'
import SiteSettingsPage from './pages/SiteSettingsPage'
import OrganizationsPage from './pages/OrganizationsPage'

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
        <Route path="/posts" element={<PostsPage />} />
        <Route path="/posts/new" element={<PostEditorPage />} />
        <Route path="/posts/:id" element={<PostEditorPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/themes" element={<ThemesPage />} />
                <Route path="/template-kits" element={<TemplateKitsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sites/new" element={<SiteSettingsPage />} />
        <Route path="/sites/:id" element={<SiteSettingsPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
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
