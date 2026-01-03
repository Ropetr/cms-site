import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save, ArrowLeft, Eye, Calendar, Tag, Star, Globe, FileText, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Badge, Loading } from '../components/ui'
import { postsService, categoriesService } from '../services/api'
import MediaPicker from '../components/MediaPicker'
import RichTextEditor from '../components/RichTextEditor'

export default function PostEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !id || id === 'new'

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_id: '',
    status: 'draft',
    is_featured: false,
    meta_title: '',
    meta_description: '',
  })

  const { data: postData, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => postsService.get(id),
    enabled: !isNew,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.list(),
  })

  const categories = categoriesData?.data || []

  useEffect(() => {
    if (postData?.data) {
      const post = postData.data
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        featured_image: post.featured_image || '',
        category_id: post.category_id || '',
        status: post.status || 'draft',
        is_featured: post.is_featured === 1,
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
      })
    }
  }, [postData])

  const saveMutation = useMutation({
    mutationFn: (data) => isNew ? postsService.create(data) : postsService.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['posts'])
      toast.success(isNew ? 'Post criado!' : 'Post salvo!')
      if (isNew && res?.data?.id) navigate(`/posts/${res.data.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate slug
    if (field === 'title' && isNew) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSave = (newStatus) => {
    if (!formData.title || !formData.slug) {
      toast.error('Título e slug são obrigatórios')
      return
    }
    
    const data = {
      ...formData,
      status: newStatus || formData.status,
      is_featured: formData.is_featured ? 1 : 0,
    }
    
    saveMutation.mutate(data)
  }

  if (!isNew && isLoading) return <Loading fullScreen text="Carregando post..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/posts')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Novo Post' : 'Editar Post'}
            </h1>
            <p className="text-gray-500">
              {isNew ? 'Crie um novo post para o blog' : formData.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {formData.status === 'published' && !isNew && (
            <Button variant="outline" onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}>
              <Eye className="w-4 h-4" /> Ver
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave('draft')} loading={saveMutation.isPending}>
            <Save className="w-4 h-4" /> Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave('published')} loading={saveMutation.isPending}>
            <Globe className="w-4 h-4" /> Publicar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <Input
                label="Título"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Título do post"
                required
              />
              
              <Input
                label="Slug (URL)"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="url-do-post"
                helper={`/blog/${formData.slug || 'slug'}`}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resumo / Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleChange('excerpt', e.target.value)}
                  placeholder="Breve descrição do post (aparece nas listagens)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Conteúdo
                  </label>
                  <Button variant="ghost" size="sm" className="text-primary-600">
                    <Sparkles className="w-4 h-4" /> Gerar com IA
                  </Button>
                </div>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => handleChange('content', content)}
                  placeholder="Comece a escrever o conteúdo do post..."
                  minHeight="400px"
                />
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Publicação</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={[
                  { value: 'draft', label: '📝 Rascunho' },
                  { value: 'published', label: '✅ Publicado' },
                  { value: 'archived', label: '📦 Arquivado' },
                ]}
              />

              <Select
                label="Categoria"
                value={formData.category_id}
                onChange={(e) => handleChange('category_id', e.target.value)}
                options={[
                  { value: '', label: 'Sem categoria' },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => handleChange('is_featured', e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Post em destaque
                </label>
              </div>
            </CardBody>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Imagem Destacada</h2>
            </CardHeader>
            <CardBody>
              <MediaPicker
                value={formData.featured_image}
                onChange={(media) => handleChange('featured_image', media?.url || '')}
                aspectRatio="16/9"
                preset="blog_featured"
              />
            </CardBody>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold">SEO</h2>
              <Button variant="ghost" size="sm" className="text-primary-600">
                <Sparkles className="w-4 h-4" /> Gerar
              </Button>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Meta Title"
                value={formData.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                placeholder="Título para SEO"
                helper={`${formData.meta_title?.length || 0}/60`}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleChange('meta_description', e.target.value)}
                  placeholder="Descrição para SEO"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.meta_description?.length || 0}/160
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
