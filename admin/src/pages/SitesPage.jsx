import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Globe,
  ExternalLink,
  Settings,
  Users,
  FileText,
  MoreVertical,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, Button, Input, Badge, Modal, Loading } from '../components/ui'
import { sitesService } from '../services/api'
import { useSite } from '../contexts/SiteContext'

export default function SitesPage() {
  const queryClient = useQueryClient()
  const { setActiveSite, refreshSites } = useSite()
  const [search, setSearch] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, site: null })
  const [createModal, setCreateModal] = useState(false)
  const [newSite, setNewSite] = useState({ name: '', slug: '', organization_id: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesService.list(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => sitesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sites'])
      refreshSites()
      toast.success('Site excluido com sucesso!')
      setDeleteModal({ open: false, site: null })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir site')
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => sitesService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['sites'])
      refreshSites()
      toast.success('Site criado com sucesso!')
      setCreateModal(false)
      setNewSite({ name: '', slug: '', organization_id: '' })
      if (response.data) {
        setActiveSite(response.data)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao criar site')
    },
  })

  const sites = data?.data || []

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.slug.toLowerCase().includes(search.toLowerCase()) ||
      (site.domain && site.domain.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = () => {
    if (deleteModal.site) {
      deleteMutation.mutate(deleteModal.site.id)
    }
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newSite.name || !newSite.slug) {
      toast.error('Nome e slug sao obrigatorios')
      return
    }
    const orgId = sites[0]?.organization_id || 'org_default'
    createMutation.mutate({
      ...newSite,
      organization_id: newSite.organization_id || orgId,
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>
      case 'inactive':
        return <Badge variant="default">Inativo</Badge>
      case 'suspended':
        return <Badge variant="danger">Suspenso</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDomainStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Verificado</Badge>
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>
      case 'failed':
        return <Badge variant="danger">Falhou</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
          <p className="text-gray-500">Gerencie seus sites</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Novo Site
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full p-8">
            <Loading text="Carregando sites..." />
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Nenhum site encontrado' : 'Nenhum site criado'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Tente outro termo de busca' : 'Comece criando seu primeiro site'}
            </p>
            {!search && (
              <Button onClick={() => setCreateModal(true)}>
                <Plus className="w-4 h-4" />
                Criar Site
              </Button>
            )}
          </div>
        ) : (
          filteredSites.map((site) => (
            <Card key={site.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                      {site.logo_url ? (
                        <img src={site.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Globe className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{site.name}</h3>
                      <p className="text-sm text-gray-500">{site.slug}</p>
                    </div>
                  </div>
                  {getStatusBadge(site.status || 'active')}
                </div>

                <div className="space-y-2 mb-4">
                  {site.domain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{site.domain}</span>
                      {getDomainStatusBadge(site.domain_status)}
                    </div>
                  )}
                  {site.subdomain && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{site.subdomain}</span>
                    </div>
                  )}
                  {site.organization_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{site.organization_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveSite(site)
                      toast.success(`Site "${site.name}" selecionado`)
                    }}
                  >
                    Selecionar
                  </Button>
                  <Link to={`/sites/${site.id}`}>
                    <Button variant="ghost" size="icon" title="Configuracoes">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  {(site.domain || site.subdomain) && (
                    <a
                      href={`https://${site.domain || site.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" title="Abrir site">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    onClick={() => setDeleteModal({ open: true, site })}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, site: null })}
        title="Excluir Site"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o site{' '}
            <strong>{deleteModal.site?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta acao ira excluir todas as paginas, posts, midias e configuracoes do site. Esta acao nao pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, site: null })}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Criar Novo Site"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Site
            </label>
            <Input
              value={newSite.name}
              onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
              placeholder="Meu Site"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL)
            </label>
            <Input
              value={newSite.slug}
              onChange={(e) => setNewSite({ 
                ...newSite, 
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') 
              })}
              placeholder="meu-site"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Sera usado na URL: {newSite.slug || 'meu-site'}.fiosites.com
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending}
            >
              Criar Site
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
