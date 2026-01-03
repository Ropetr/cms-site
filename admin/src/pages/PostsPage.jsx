import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Edit, Trash2, Eye, Calendar, Tag, MoreHorizontal,
  FileText, CheckCircle, Clock, Archive
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Badge, Modal, Loading } from '../components/ui'
import { postsService, categoriesService } from '../services/api'

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'bg-yellow-100 text-yellow-700', icon: Archive },
}

export default function PostsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteModal, setDeleteModal] = useState(null)

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', { status: statusFilter, category: categoryFilter, search }],
    queryFn: () => postsService.list({ status: statusFilter, category: categoryFilter, search }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
  })

  const posts = postsData?.data || []
  const categories = categoriesData?.data || []

  const deleteMutation = useMutation({
    mutationFn: (id) => postsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts'])
      toast.success('Post excluído!')
      setDeleteModal(null)
    },
    onError: () => toast.error('Erro ao excluir post'),
  })

  const filteredPosts = posts.filter(post =>
    !search || post.title.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  if (isLoading) return <Loading fullScreen text="Carregando posts..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-500">Gerencie os posts do blog</p>
        </div>
        <Button onClick={() => navigate('/posts/new')}>
          <Plus className="w-4 h-4" /> Novo Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{posts.filter(p => p.status === 'published').length}</p>
              <p className="text-sm text-gray-500">Publicados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{posts.filter(p => p.status === 'draft').length}</p>
              <p className="text-sm text-gray-500">Rascunhos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-gray-500">Categorias</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'published', label: 'Publicados' },
                { value: 'draft', label: 'Rascunhos' },
                { value: 'archived', label: 'Arquivados' },
              ]}
              className="w-full md:w-48"
            />
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'Todas categorias' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
              className="w-full md:w-48"
            />
          </div>
        </CardBody>
      </Card>

      {/* Posts List */}
      <Card>
        <CardBody className="p-0">
          {filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum post encontrado</p>
              <Button onClick={() => navigate('/posts/new')}>
                <Plus className="w-4 h-4" /> Criar Primeiro Post
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPosts.map((post) => {
                const status = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft
                const StatusIcon = status.icon
                return (
                  <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-20 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {post.featured_image ? (
                        <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/posts/${post.id}`} className="font-medium text-gray-900 hover:text-primary-600 truncate">
                          {post.title}
                        </Link>
                        {post.is_featured === 1 && (
                          <Badge variant="warning" size="sm">Destaque</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {post.category_name && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {post.category_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        {post.views > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/posts/${post.id}`)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {post.status === 'published' && (
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteModal(post)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir Post" size="sm">
        <div className="space-y-4">
          <p>Excluir <strong>{deleteModal?.title}</strong>?</p>
          <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate(deleteModal.id)} loading={deleteMutation.isPending}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
