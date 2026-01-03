import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
  Image,
  Type,
  Layout,
  Grid,
  MessageSquare,
  Phone,
  HelpCircle,
  Users,
  Star,
  BarChart,
  Map,
  Code,
  FileText,
  Layers,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Badge, Modal, Loading } from '../components/ui'
import { pagesService } from '../services/api'

// Tipos de blocos disponíveis
const BLOCK_TYPES = [
  { type: 'hero_banner', label: 'Banner Principal', icon: Image, description: 'Banner com imagem de fundo e CTA' },
  { type: 'text', label: 'Texto', icon: Type, description: 'Bloco de texto rico' },
  { type: 'media_text', label: 'Mídia + Texto', icon: Layout, description: 'Imagem ao lado de texto' },
  { type: 'features', label: 'Features', icon: Grid, description: 'Grid de benefícios/recursos' },
  { type: 'gallery', label: 'Galeria', icon: Image, description: 'Galeria de imagens' },
  { type: 'cta', label: 'CTA', icon: Phone, description: 'Botões de ação (WhatsApp, etc)' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Perguntas frequentes' },
  { type: 'testimonials', label: 'Depoimentos', icon: MessageSquare, description: 'Avaliações de clientes' },
  { type: 'contact_form', label: 'Formulário', icon: FileText, description: 'Formulário de contato' },
  { type: 'stats', label: 'Estatísticas', icon: BarChart, description: 'Números e métricas' },
  { type: 'team', label: 'Equipe', icon: Users, description: 'Membros da equipe' },
  { type: 'map', label: 'Mapa', icon: Map, description: 'Google Maps' },
  { type: 'custom_html', label: 'HTML Custom', icon: Code, description: 'Código HTML personalizado' },
]

// Layouts disponíveis por tipo de bloco
const BLOCK_LAYOUTS = {
  hero_banner: ['fullwidth', 'contained', 'split'],
  text: ['default', 'centered', 'two-columns'],
  media_text: ['media-left', 'media-right', 'stacked'],
  features: ['grid-3', 'grid-4', 'list'],
  gallery: ['grid', 'masonry', 'slider'],
  cta: ['centered', 'inline', 'stacked'],
  faq: ['accordion', 'list', 'two-columns'],
  testimonials: ['slider', 'grid', 'single'],
  contact_form: ['default', 'inline', 'split'],
  stats: ['row', 'grid', 'cards'],
  team: ['grid-3', 'grid-4', 'slider'],
  map: ['fullwidth', 'contained', 'with-info'],
  custom_html: ['default'],
}

// Variantes disponíveis
const BLOCK_VARIANTS = {
  default: ['default', 'dark', 'light', 'primary'],
}

export default function PageEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !id || id === 'new'

  // Estado do formulário
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    page_type: 'content',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    menu_id: '',
  })
  const [sections, setSections] = useState([])
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch página existente
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: () => pagesService.get(id),
    enabled: !isNew,
  })

  // Fetch seções da página
  const { data: sectionsData } = useQuery({
    queryKey: ['page-sections', id],
    queryFn: () => pagesService.getSections(id),
    enabled: !isNew,
  })

  // Preencher formulário quando dados carregarem
  useEffect(() => {
    if (pageData?.data) {
      const page = pageData.data
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        page_type: page.page_type || 'content',
        status: page.status || 'draft',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        menu_id: page.menu_id || '',
      })
    }
  }, [pageData])

  useEffect(() => {
    if (sectionsData?.data) {
      setSections(sectionsData.data)
    }
  }, [sectionsData])

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        return pagesService.create(data)
      }
      return pagesService.update(id, data)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['pages'])
      toast.success(isNew ? 'Página criada com sucesso!' : 'Página salva com sucesso!')
      setHasChanges(false)
      if (isNew && response?.data?.id) {
        navigate(`/pages/${response.data.id}`)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao salvar página')
    },
  })

  const addSectionMutation = useMutation({
    mutationFn: (data) => pagesService.addSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['page-sections', id])
      toast.success('Bloco adicionado!')
      setShowAddBlock(false)
    },
    onError: () => {
      toast.error('Erro ao adicionar bloco')
    },
  })

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }) => pagesService.updateSection(id, sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['page-sections', id])
      toast.success('Bloco atualizado!')
      setEditingSection(null)
    },
    onError: () => {
      toast.error('Erro ao atualizar bloco')
    },
  })

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId) => pagesService.deleteSection(id, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['page-sections', id])
      toast.success('Bloco removido!')
    },
    onError: () => {
      toast.error('Erro ao remover bloco')
    },
  })

  // Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    
    // Auto-generate slug from title
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

  const handleSave = () => {
    if (!formData.title) {
      toast.error('Título é obrigatório')
      return
    }
    if (!formData.slug) {
      toast.error('Slug é obrigatório')
      return
    }
    saveMutation.mutate(formData)
  }

  const handleAddBlock = (blockType) => {
    if (isNew) {
      toast.error('Salve a página primeiro antes de adicionar blocos')
      return
    }
    
    const newSection = {
      section_type: blockType.type,
      title: blockType.label,
      content: JSON.stringify(getDefaultContent(blockType.type)),
      layout: BLOCK_LAYOUTS[blockType.type]?.[0] || 'default',
      variant: 'default',
      sort_order: sections.length,
    }
    
    addSectionMutation.mutate(newSection)
  }

  const handleMoveSection = (index, direction) => {
    const newSections = [...sections]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= sections.length) return
    
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    setSections(newSections)
    
    // Atualizar ordem no backend
    const sectionIds = newSections.map(s => s.id)
    pagesService.reorderSections(id, sectionIds)
  }

  const handleDeleteSection = (sectionId) => {
    if (confirm('Tem certeza que deseja remover este bloco?')) {
      deleteSectionMutation.mutate(sectionId)
    }
  }

  // Conteúdo padrão para cada tipo de bloco
  const getDefaultContent = (type) => {
    const defaults = {
      hero_banner: {
        title: 'Título do Banner',
        subtitle: 'Subtítulo ou descrição',
        cta_text: 'Saiba Mais',
        cta_url: '#',
        image_url: '',
      },
      text: {
        content: '<p>Digite seu texto aqui...</p>',
      },
      media_text: {
        title: 'Título',
        content: '<p>Descrição do conteúdo...</p>',
        image_url: '',
        image_alt: '',
      },
      features: {
        title: 'Nossos Diferenciais',
        items: [
          { icon: 'star', title: 'Feature 1', description: 'Descrição da feature' },
          { icon: 'star', title: 'Feature 2', description: 'Descrição da feature' },
          { icon: 'star', title: 'Feature 3', description: 'Descrição da feature' },
        ],
      },
      cta: {
        title: 'Entre em Contato',
        subtitle: 'Estamos prontos para atender você',
        buttons: [
          { type: 'whatsapp', label: 'WhatsApp', value: '5544999999999' },
          { type: 'phone', label: 'Ligar', value: '5544999999999' },
        ],
      },
      faq: {
        title: 'Perguntas Frequentes',
        items: [
          { question: 'Pergunta 1?', answer: 'Resposta 1' },
          { question: 'Pergunta 2?', answer: 'Resposta 2' },
        ],
      },
      testimonials: {
        title: 'O que nossos clientes dizem',
        items: [
          { name: 'Cliente 1', role: 'Empresa', content: 'Depoimento...', rating: 5 },
        ],
      },
      contact_form: {
        title: 'Fale Conosco',
        subtitle: 'Preencha o formulário abaixo',
        fields: ['name', 'email', 'phone', 'message'],
      },
      stats: {
        items: [
          { value: '100+', label: 'Clientes' },
          { value: '500+', label: 'Projetos' },
          { value: '10+', label: 'Anos' },
        ],
      },
      gallery: {
        title: 'Galeria',
        images: [],
      },
      team: {
        title: 'Nossa Equipe',
        members: [],
      },
      map: {
        address: 'Endereço completo',
        lat: -23.4273,
        lng: -51.9375,
        zoom: 15,
      },
      custom_html: {
        html: '<!-- Seu código HTML aqui -->',
      },
    }
    return defaults[type] || {}
  }

  const getBlockIcon = (type) => {
    const block = BLOCK_TYPES.find(b => b.type === type)
    return block?.icon || Layers
  }

  if (!isNew && isLoading) {
    return <Loading fullScreen text="Carregando página..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/pages')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Nova Página' : 'Editar Página'}
            </h1>
            <p className="text-gray-500">
              {isNew ? 'Crie uma nova página' : formData.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <Button variant="outline" onClick={() => window.open(`/preview/${formData.slug}`, '_blank')}>
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} loading={saveMutation.isPending}>
            <Save className="w-4 h-4" />
            {isNew ? 'Criar Página' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações da Página */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">Configurações</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Título"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título da página"
                required
              />
              
              <Input
                label="Slug (URL)"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="url-da-pagina"
                helper={`URL: /${formData.slug || 'slug'}`}
                required
              />
              
              <Select
                label="Tipo"
                value={formData.page_type}
                onChange={(e) => handleInputChange('page_type', e.target.value)}
                options={[
                  { value: 'home', label: 'Home' },
                  { value: 'content', label: 'Conteúdo' },
                  { value: 'product', label: 'Produto' },
                  { value: 'contact', label: 'Contato' },
                  { value: 'blog', label: 'Blog' },
                  { value: 'custom', label: 'Personalizado' },
                ]}
              />
              
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'draft', label: 'Rascunho' },
                  { value: 'published', label: 'Publicado' },
                  { value: 'archived', label: 'Arquivado' },
                ]}
              />
            </CardBody>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900">SEO</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Meta Title"
                value={formData.meta_title}
                onChange={(e) => handleInputChange('meta_title', e.target.value)}
                placeholder="Título para SEO"
                helper={`${formData.meta_title?.length || 0}/60 caracteres`}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Descrição para SEO"
                  rows={3}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.meta_description?.length || 0}/160 caracteres
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Blocos/Seções */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Blocos da Página</h2>
              <Button 
                size="sm" 
                onClick={() => setShowAddBlock(true)}
                disabled={isNew}
              >
                <Plus className="w-4 h-4" />
                Adicionar Bloco
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {isNew ? (
                <div className="p-8 text-center text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Salve a página primeiro para adicionar blocos</p>
                </div>
              ) : sections.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="mb-4">Nenhum bloco adicionado</p>
                  <Button onClick={() => setShowAddBlock(true)}>
                    <Plus className="w-4 h-4" />
                    Adicionar Primeiro Bloco
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sections.map((section, index) => {
                    const IconComponent = getBlockIcon(section.section_type)
                    return (
                      <div
                        key={section.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveSection(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveSection(index, 'down')}
                            disabled={index === sections.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{section.title}</p>
                          <p className="text-sm text-gray-500">
                            {BLOCK_TYPES.find(b => b.type === section.section_type)?.label || section.section_type}
                            {section.layout && ` • ${section.layout}`}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSection(section)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSection(section.id)}
                          >
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
        </div>
      </div>

      {/* Modal Adicionar Bloco */}
      <Modal
        isOpen={showAddBlock}
        onClose={() => setShowAddBlock(false)}
        title="Adicionar Bloco"
        size="lg"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BLOCK_TYPES.map((block) => {
            const IconComponent = block.icon
            return (
              <button
                key={block.type}
                onClick={() => handleAddBlock(block)}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
              >
                <IconComponent className="w-8 h-8 text-primary-500" />
                <span className="font-medium text-gray-900">{block.label}</span>
                <span className="text-xs text-gray-500">{block.description}</span>
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Modal Editar Bloco */}
      <Modal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title={`Editar ${editingSection?.title || 'Bloco'}`}
        size="lg"
      >
        {editingSection && (
          <SectionEditor
            section={editingSection}
            onSave={(data) => {
              updateSectionMutation.mutate({
                sectionId: editingSection.id,
                data,
              })
            }}
            onCancel={() => setEditingSection(null)}
            loading={updateSectionMutation.isPending}
          />
        )}
      </Modal>
    </div>
  )
}

// Componente para editar seção
function SectionEditor({ section, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(section.title || '')
  const [layout, setLayout] = useState(section.layout || 'default')
  const [variant, setVariant] = useState(section.variant || 'default')
  const [content, setContent] = useState(() => {
    try {
      return typeof section.content === 'string' 
        ? JSON.parse(section.content) 
        : section.content || {}
    } catch {
      return {}
    }
  })

  const layouts = BLOCK_LAYOUTS[section.section_type] || ['default']

  const handleSave = () => {
    onSave({
      title,
      layout,
      variant,
      content: JSON.stringify(content),
    })
  }

  const updateContent = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <Input
        label="Título do Bloco"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <Select
        label="Layout"
        value={layout}
        onChange={(e) => setLayout(e.target.value)}
        options={layouts.map(l => ({ value: l, label: l }))}
      />
      
      <Select
        label="Variante"
        value={variant}
        onChange={(e) => setVariant(e.target.value)}
        options={[
          { value: 'default', label: 'Padrão' },
          { value: 'dark', label: 'Escuro' },
          { value: 'light', label: 'Claro' },
          { value: 'primary', label: 'Cor Principal' },
        ]}
      />

      {/* Editor de conteúdo específico por tipo */}
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-900 mb-3">Conteúdo</h3>
        <ContentEditor
          type={section.section_type}
          content={content}
          onChange={updateContent}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} loading={loading}>
          Salvar Bloco
        </Button>
      </div>
    </div>
  )
}

// Editor de conteúdo por tipo de bloco
function ContentEditor({ type, content, onChange }) {
  switch (type) {
    case 'hero_banner':
      return (
        <div className="space-y-3">
          <Input
            label="Título"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
          <Input
            label="Subtítulo"
            value={content.subtitle || ''}
            onChange={(e) => onChange('subtitle', e.target.value)}
          />
          <Input
            label="Texto do Botão"
            value={content.cta_text || ''}
            onChange={(e) => onChange('cta_text', e.target.value)}
          />
          <Input
            label="URL do Botão"
            value={content.cta_url || ''}
            onChange={(e) => onChange('cta_url', e.target.value)}
          />
          <Input
            label="URL da Imagem"
            value={content.image_url || ''}
            onChange={(e) => onChange('image_url', e.target.value)}
            helper="Cole a URL da imagem ou use a biblioteca de mídia"
          />
        </div>
      )

    case 'text':
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Conteúdo
          </label>
          <textarea
            value={content.content || ''}
            onChange={(e) => onChange('content', e.target.value)}
            rows={6}
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Digite o texto... (suporta HTML)"
          />
        </div>
      )

    case 'media_text':
      return (
        <div className="space-y-3">
          <Input
            label="Título"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conteúdo
            </label>
            <textarea
              value={content.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Input
            label="URL da Imagem"
            value={content.image_url || ''}
            onChange={(e) => onChange('image_url', e.target.value)}
          />
          <Input
            label="Alt da Imagem"
            value={content.image_alt || ''}
            onChange={(e) => onChange('image_alt', e.target.value)}
          />
        </div>
      )

    case 'cta':
      return (
        <div className="space-y-3">
          <Input
            label="Título"
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
          />
          <Input
            label="Subtítulo"
            value={content.subtitle || ''}
            onChange={(e) => onChange('subtitle', e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Botões configuráveis em breve...
          </p>
        </div>
      )

    default:
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            Editor avançado para "{type}" em desenvolvimento.
          </p>
          <pre className="mt-2 text-xs text-gray-400 overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )
  }
}
