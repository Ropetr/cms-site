import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FileText,
  Image,
  Mail,
  Eye,
  Plus,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react'
import { Card, CardBody, CardHeader, Button, Badge, Loading } from '../components/ui'
import { pagesService, contactsService, mediaService } from '../services/api'

function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {trend && (
          <div className="flex items-center text-green-600 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  // Fetch data
  const { data: pagesData, isLoading: pagesLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: () => pagesService.list(),
  })

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsService.list(),
  })

  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['media'],
    queryFn: () => mediaService.list(),
  })

  const pages = pagesData?.data || []
  const contacts = contactsData?.data || []
  const media = mediaData?.data || []

  const newContacts = contacts.filter(c => c.status === 'new').length
  const publishedPages = pages.filter(p => p.status === 'published').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Bem-vindo ao painel de administração</p>
        </div>
        <Link to="/pages/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nova Página
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Páginas"
          value={pages.length}
          color="primary"
        />
        <StatCard
          icon={Eye}
          label="Publicadas"
          value={publishedPages}
          color="green"
        />
        <StatCard
          icon={Mail}
          label="Novos Contatos"
          value={newContacts}
          color="yellow"
        />
        <StatCard
          icon={Image}
          label="Arquivos"
          value={media.length}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pages */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Páginas Recentes</h2>
            <Link to="/pages" className="text-sm text-primary-500 hover:underline">
              Ver todas
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {pagesLoading ? (
              <div className="p-6">
                <Loading size="sm" text="" />
              </div>
            ) : pages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma página criada ainda
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pages.slice(0, 5).map((page) => (
                  <Link
                    key={page.id}
                    to={`/pages/${page.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{page.title}</p>
                      <p className="text-sm text-gray-500">/{page.slug}</p>
                    </div>
                    <Badge
                      variant={page.status === 'published' ? 'success' : 'default'}
                    >
                      {page.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Contatos Recentes</h2>
            <Link to="/contacts" className="text-sm text-primary-500 hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {contactsLoading ? (
              <div className="p-6">
                <Loading size="sm" text="" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum contato recebido ainda
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {contacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          contact.status === 'new'
                            ? 'warning'
                            : contact.status === 'contacted'
                            ? 'info'
                            : 'success'
                        }
                      >
                        {contact.status === 'new'
                          ? 'Novo'
                          : contact.status === 'contacted'
                          ? 'Contatado'
                          : 'Convertido'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Ações Rápidas</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/pages/new"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <FileText className="w-6 h-6 text-primary-500" />
              <span className="text-sm font-medium">Nova Página</span>
            </Link>
            <Link
              to="/media"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Image className="w-6 h-6 text-primary-500" />
              <span className="text-sm font-medium">Upload Mídia</span>
            </Link>
            <Link
              to="/menus"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Users className="w-6 h-6 text-primary-500" />
              <span className="text-sm font-medium">Editar Menu</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Clock className="w-6 h-6 text-primary-500" />
              <span className="text-sm font-medium">Configurações</span>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
