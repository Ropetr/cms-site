import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  FileText,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Badge, Modal, Loading } from '../components/ui'
import { pagesService } from '../services/api'

export default function PagesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, page: null })

  // Fetch pages
  const { data, isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: () => pagesService.list(),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => pagesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['pages'])
      toast.success('Página excluída com sucesso!')
      setDeleteModal({ open: false, page: null })
    },
    onError: () => {
      toast.error('Erro ao excluir página')
    },
  })

  const pages = data?.data || []
  
  // Filter pages by search
  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(search.toLowerCase()) ||
      page.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = () => {
    if (deleteModal.page) {
      deleteMutation.mutate(deleteModal.page.id)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Publicado</Badge>
      case 'draft':
        return <Badge variant="default">Rascunho</Badge>
      case 'archived':
        return <Badge variant="danger">Arquivado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPageTypeBadge = (type) => {
    const types = {
      home: 'Home',
      content: 'Conteúdo',
      product: 'Produto',
      contact: 'Contato',
      blog: 'Blog',
      blog_post: 'Post',
      custom: 'Custom',
    }
    return types[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Páginas</h1>
          <p className="text-gray-500">Gerencie as páginas do seu site</p>
        </div>
        <Link to="/pages/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nova Página
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar páginas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      {/* Pages List */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Carregando páginas..." />
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search ? 'Nenhuma página encontrada' : 'Nenhuma página criada'}
              </h3>
              <p className="text-gray-500 mb-4">
                {search
                  ? 'Tente outro termo de busca'
                  : 'Comece criando sua primeira página'}
              </p>
              {!search && (
                <Link to="/pages/new">
                  <Button>
                    <Plus className="w-4 h-4" />
                    Criar Página
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Página
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atualização
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{page.title}</p>
                          <p className="text-sm text-gray-500">/{page.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {getPageTypeBadge(page.page_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(page.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/pages/${page.id}`}>
                            <Button variant="ghost" size="icon" title="Editar">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {page.status === 'published' && (
                            <a
                              href={`https://cms-site.pages.dev/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" title="Ver no site">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => setDeleteModal({ open: true, page })}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, page: null })}
        title="Excluir Página"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir a página{' '}
            <strong>{deleteModal.page?.title}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, page: null })}
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
    </div>
  )
}
