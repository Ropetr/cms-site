import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Settings, Eye,
  Image, Type, Layout, Grid, MessageSquare, Phone, HelpCircle, Users,
  BarChart, Map, Code, FileText, Layers, Play, ShoppingBag, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Modal, Loading } from '../components/ui'
import { pagesService } from '../services/api'
import MediaPicker, { MediaPickerMultiple } from '../components/MediaPicker'
import SEOFields from '../components/SEOFields'

const BLOCK_TYPES = [
  { type: 'hero_banner', label: 'Banner Principal', icon: Image, description: 'Banner com imagem de fundo' },
  { type: 'text', label: 'Texto', icon: Type, description: 'Bloco de texto' },
  { type: 'media_text', label: 'Mídia + Texto', icon: Layout, description: 'Imagem ao lado de texto' },
  { type: 'features', label: 'Features', icon: Grid, description: 'Grid de benefícios' },
  { type: 'gallery', label: 'Galeria', icon: Image, description: 'Galeria de imagens' },
  { type: 'carousel', label: 'Carrossel', icon: Play, description: 'Slides de conteúdo' },
  { type: 'product_grid', label: 'Produtos', icon: ShoppingBag, description: 'Vitrine de produtos' },
  { type: 'blog_list', label: 'Blog', icon: BookOpen, description: 'Posts do blog' },
  { type: 'cta', label: 'CTA', icon: Phone, description: 'Botões de ação' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, description: 'Perguntas frequentes' },
  { type: 'testimonials', label: 'Depoimentos', icon: MessageSquare, description: 'Avaliações' },
  { type: 'contact_form', label: 'Formulário', icon: FileText, description: 'Formulário de contato' },
  { type: 'stats', label: 'Estatísticas', icon: BarChart, description: 'Números e métricas' },
  { type: 'team', label: 'Equipe', icon: Users, description: 'Membros da equipe' },
  { type: 'map', label: 'Mapa', icon: Map, description: 'Google Maps' },
  { type: 'custom_html', label: 'HTML', icon: Code, description: 'Código HTML' },
]

const BLOCK_LAYOUTS = {
  hero_banner: ['fullwidth', 'contained', 'split'],
  text: ['default', 'centered', 'two-columns'],
  media_text: ['media-left', 'media-right', 'stacked'],
  features: ['grid-3', 'grid-4', 'list'],
  gallery: ['grid', 'masonry', 'slider'],
  carousel: ['full-width', 'contained'],
  product_grid: ['grid', 'list'],
  blog_list: ['grid', 'list', 'featured'],
  cta: ['centered', 'inline'],
  faq: ['accordion', 'list'],
  testimonials: ['slider', 'grid'],
  contact_form: ['default', 'inline'],
  stats: ['row', 'grid'],
  team: ['grid-3', 'grid-4'],
  map: ['fullwidth', 'contained'],
  custom_html: ['default'],
}

export default function PageEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isNew = !id || id === 'new'

  const [formData, setFormData] = useState({
    title: '', slug: '', page_type: 'content', status: 'draft',
    meta_title: '', meta_description: '', menu_id: '',
  })
  const [sections, setSections] = useState([])
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [editingSection, setEditingSection] = useState(null)

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['page', id], queryFn: () => pagesService.get(id), enabled: !isNew,
  })

  const { data: sectionsData } = useQuery({
    queryKey: ['page-sections', id], queryFn: () => pagesService.getSections(id), enabled: !isNew,
  })

  useEffect(() => {
    if (pageData?.data) {
      const p = pageData.data
      setFormData({
        title: p.title || '', slug: p.slug || '', page_type: p.page_type || 'content',
        status: p.status || 'draft', meta_title: p.meta_title || '',
        meta_description: p.meta_description || '', menu_id: p.menu_id || '',
      })
    }
  }, [pageData])

  useEffect(() => { if (sectionsData?.data) setSections(sectionsData.data) }, [sectionsData])

  const saveMutation = useMutation({
    mutationFn: (data) => isNew ? pagesService.create(data) : pagesService.update(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['pages'])
      toast.success(isNew ? 'Página criada!' : 'Página salva!')
      if (isNew && res?.data?.id) navigate(`/pages/${res.data.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  })

  const addSectionMutation = useMutation({
    mutationFn: (data) => pagesService.addSection(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['page-sections', id]); toast.success('Bloco adicionado!'); setShowAddBlock(false) },
  })

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }) => pagesService.updateSection(id, sectionId, data),
    onSuccess: () => { queryClient.invalidateQueries(['page-sections', id]); toast.success('Bloco atualizado!'); setEditingSection(null) },
  })

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId) => pagesService.deleteSection(id, sectionId),
    onSuccess: () => { queryClient.invalidateQueries(['page-sections', id]); toast.success('Bloco removido!') },
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'title' && isNew) {
      const slug = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleSave = () => {
    if (!formData.title || !formData.slug) { toast.error('Título e slug são obrigatórios'); return }
    saveMutation.mutate(formData)
  }

  const handleAddBlock = (block) => {
    if (isNew) { toast.error('Salve a página primeiro'); return }
    addSectionMutation.mutate({
      section_type: block.type, title: block.label,
      content: JSON.stringify(getDefaultContent(block.type)),
      layout: BLOCK_LAYOUTS[block.type]?.[0] || 'default', variant: 'default', sort_order: sections.length,
    })
  }

  const handleMoveSection = (index, dir) => {
    const newIdx = dir === 'up' ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= sections.length) return
    const newSections = [...sections];
    [newSections[index], newSections[newIdx]] = [newSections[newIdx], newSections[index]]
    setSections(newSections)
    pagesService.reorderSections(id, newSections.map(s => s.id))
  }

  const getDefaultContent = (type) => ({
    hero_banner: { title: 'Título', subtitle: '', cta_text: 'Saiba Mais', cta_url: '#', background_image: '' },
    text: { title: '', content: '<p>Texto aqui...</p>', alignment: 'left' },
    media_text: { title: '', content: '', image: '', image_alt: '' },
    features: { title: 'Diferenciais', items: [{ icon: '⭐', title: 'Feature', description: '' }] },
    gallery: { title: 'Galeria', images: [] },
    carousel: { title: '', items: [{ image: '', title: '' }], autoplay: true, interval: 5000 },
    product_grid: { title: 'Produtos', products: [] },
    blog_list: { title: 'Blog', source: 'latest', postsCount: 3 },
    cta: { title: 'Contato', description: '', cta_text: 'Fale Conosco', cta_url: '#', whatsapp: '' },
    faq: { title: 'FAQ', items: [{ question: '', answer: '' }] },
    testimonials: { title: 'Depoimentos', items: [] },
    contact_form: { title: 'Fale Conosco', description: '', button_text: 'Enviar' },
    stats: { title: '', items: [{ value: '100+', label: 'Clientes' }] },
    team: { title: 'Equipe', members: [] },
    map: { title: '', address: '', embed_url: '' },
    custom_html: { html: '' },
  }[type] || {})

  const getBlockIcon = (type) => BLOCK_TYPES.find(b => b.type === type)?.icon || Layers

  if (!isNew && isLoading) return <Loading fullScreen text="Carregando..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/pages')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'Nova Página' : 'Editar Página'}</h1>
            <p className="text-gray-500">{isNew ? 'Crie uma nova página' : formData.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && <Button variant="outline" onClick={() => window.open(`/preview/${formData.slug}`, '_blank')}><Eye className="w-4 h-4" />Preview</Button>}
          <Button onClick={handleSave} loading={saveMutation.isPending}><Save className="w-4 h-4" />{isNew ? 'Criar' : 'Salvar'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="font-semibold">Configurações</h2></CardHeader>
            <CardBody className="space-y-4">
              <Input label="Título" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
              <Input label="Slug" value={formData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} helper={`/${formData.slug}`} required />
              <Select label="Tipo" value={formData.page_type} onChange={(e) => handleInputChange('page_type', e.target.value)}
                options={[{ value: 'home', label: 'Home' }, { value: 'content', label: 'Conteúdo' }, { value: 'landing', label: 'Landing' }]} />
              <Select label="Status" value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)}
                options={[{ value: 'draft', label: 'Rascunho' }, { value: 'published', label: 'Publicado' }]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="font-semibold">SEO</h2></CardHeader>
            <CardBody>
              <SEOFields
                metaTitle={formData.meta_title}
                metaDescription={formData.meta_description}
                onMetaTitleChange={(value) => handleInputChange('meta_title', value)}
                onMetaDescriptionChange={(value) => handleInputChange('meta_description', value)}
                pageTitle={formData.title}
                slug={formData.slug}
                siteName="fiosites.com"
                showPreview={true}
                required={formData.status === 'published'}
              />
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold">Blocos</h2>
              <Button size="sm" onClick={() => setShowAddBlock(true)} disabled={isNew}><Plus className="w-4 h-4" />Adicionar</Button>
            </CardHeader>
            <CardBody className="p-0">
              {isNew ? (
                <div className="p-8 text-center text-gray-500"><Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p>Salve primeiro</p></div>
              ) : sections.length === 0 ? (
                <div className="p-8 text-center text-gray-500"><Layers className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="mb-4">Sem blocos</p>
                  <Button onClick={() => setShowAddBlock(true)}><Plus className="w-4 h-4" />Adicionar</Button></div>
              ) : (
                <div className="divide-y">
                  {sections.map((s, i) => {
                    const Icon = getBlockIcon(s.section_type)
                    return (
                      <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleMoveSection(i, 'up')} disabled={i === 0} className="p-1 text-gray-400 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                          <button onClick={() => handleMoveSection(i, 'down')} disabled={i === sections.length - 1} className="p-1 text-gray-400 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                        </div>
                        <div className="p-2 bg-gray-100 rounded-lg"><Icon className="w-5 h-5 text-gray-600" /></div>
                        <div className="flex-1">
                          <p className="font-medium">{s.title}</p>
                          <p className="text-sm text-gray-500">{BLOCK_TYPES.find(b => b.type === s.section_type)?.label} • {s.layout}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingSection(s)}><Settings className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirm('Remover?') && deleteSectionMutation.mutate(s.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={showAddBlock} onClose={() => setShowAddBlock(false)} title="Adicionar Bloco" size="lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BLOCK_TYPES.map((b) => {
            const Icon = b.icon
            return (<button key={b.type} onClick={() => handleAddBlock(b)} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:border-primary-500 hover:bg-primary-50">
              <Icon className="w-6 h-6 text-primary-500" /><span className="text-sm font-medium">{b.label}</span></button>)
          })}
        </div>
      </Modal>

      <Modal isOpen={!!editingSection} onClose={() => setEditingSection(null)} title={`Editar ${editingSection?.title}`} size="xl">
        {editingSection && <SectionEditor section={editingSection} onSave={(data) => updateSectionMutation.mutate({ sectionId: editingSection.id, data })}
          onCancel={() => setEditingSection(null)} loading={updateSectionMutation.isPending} />}
      </Modal>
    </div>
  )
}

function SectionEditor({ section, onSave, onCancel, loading }) {
  const [title, setTitle] = useState(section.title || '')
  const [layout, setLayout] = useState(section.layout || 'default')
  const [variant, setVariant] = useState(section.variant || 'default')
  const [content, setContent] = useState(() => {
    try { return typeof section.content === 'string' ? JSON.parse(section.content) : section.content || {} }
    catch { return {} }
  })

  const layouts = BLOCK_LAYOUTS[section.section_type] || ['default']
  const updateContent = (k, v) => setContent(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Layout" value={layout} onChange={(e) => setLayout(e.target.value)} options={layouts.map(l => ({ value: l, label: l }))} />
        <Select label="Variante" value={variant} onChange={(e) => setVariant(e.target.value)}
          options={[{ value: 'default', label: 'Padrão' }, { value: 'dark', label: 'Escuro' }, { value: 'light', label: 'Claro' }, { value: 'primary', label: 'Primary' }]} />
      </div>
      <div className="border-t pt-4">
        <ContentEditor type={section.section_type} content={content} onChange={updateContent} />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave({ title, layout, variant, content: JSON.stringify(content) })} loading={loading}>Salvar</Button>
      </div>
    </div>
  )
}

function ContentEditor({ type, content, onChange }) {
  const editors = {
    hero_banner: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <Input label="Subtítulo" value={content.subtitle || ''} onChange={(e) => onChange('subtitle', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Botão" value={content.cta_text || ''} onChange={(e) => onChange('cta_text', e.target.value)} />
          <Input label="URL" value={content.cta_url || ''} onChange={(e) => onChange('cta_url', e.target.value)} />
        </div>
        <div><label className="block text-sm font-medium mb-2">Imagem de Fundo</label>
          <MediaPicker value={content.background_image} onChange={(m) => onChange('background_image', m?.url || '')} aspectRatio="16/9" /></div>
      </div>
    ),
    text: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <div><label className="block text-sm font-medium mb-1">Conteúdo</label>
          <textarea value={content.content || ''} onChange={(e) => onChange('content', e.target.value)} rows={6} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" /></div>
      </div>
    ),
    media_text: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <div><label className="block text-sm font-medium mb-1">Conteúdo</label>
          <textarea value={content.content || ''} onChange={(e) => onChange('content', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium mb-2">Imagem</label>
          <MediaPicker value={content.image} onChange={(m) => { onChange('image', m?.url || ''); if (m?.alt_text) onChange('image_alt', m.alt_text) }} aspectRatio="4/3" /></div>
        <Input label="Alt" value={content.image_alt || ''} onChange={(e) => onChange('image_alt', e.target.value)} />
      </div>
    ),
    gallery: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <div><label className="block text-sm font-medium mb-2">Imagens</label>
          <MediaPickerMultiple value={content.images || []} onChange={(imgs) => onChange('images', imgs)} maxItems={12} /></div>
      </div>
    ),
    cta: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <Input label="Descrição" value={content.description || ''} onChange={(e) => onChange('description', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Botão" value={content.cta_text || ''} onChange={(e) => onChange('cta_text', e.target.value)} />
          <Input label="URL" value={content.cta_url || ''} onChange={(e) => onChange('cta_url', e.target.value)} />
        </div>
        <Input label="WhatsApp" value={content.whatsapp || ''} onChange={(e) => onChange('whatsapp', e.target.value)} placeholder="5511999999999" />
      </div>
    ),
    contact_form: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <Input label="Descrição" value={content.description || ''} onChange={(e) => onChange('description', e.target.value)} />
        <Input label="Botão" value={content.button_text || ''} onChange={(e) => onChange('button_text', e.target.value)} />
      </div>
    ),
    map: () => (
      <div className="space-y-3">
        <Input label="Endereço" value={content.address || ''} onChange={(e) => onChange('address', e.target.value)} />
        <div><label className="block text-sm font-medium mb-1">URL Embed</label>
          <textarea value={content.embed_url || ''} onChange={(e) => onChange('embed_url', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg font-mono text-xs" /></div>
      </div>
    ),
    custom_html: () => (
      <div><label className="block text-sm font-medium mb-1">HTML</label>
        <textarea value={content.html || ''} onChange={(e) => onChange('html', e.target.value)} rows={10} className="w-full px-3 py-2 border rounded-lg font-mono text-sm" /></div>
    ),
    features: () => <ArrayEditor items={content.items || []} onChange={(items) => onChange('items', items)} fields={['icon', 'title', 'description']} title="Feature" />,
    faq: () => <ArrayEditor items={content.items || []} onChange={(items) => onChange('items', items)} fields={['question', 'answer']} title="Pergunta" />,
    stats: () => <ArrayEditor items={content.items || []} onChange={(items) => onChange('items', items)} fields={['value', 'label']} title="Stat" />,
    testimonials: () => <TestimonialsEditor items={content.items || []} onChange={(items) => onChange('items', items)} />,
    team: () => <TeamEditor members={content.members || []} onChange={(members) => onChange('members', members)} />,
    carousel: () => <CarouselEditor items={content.items || []} onChange={(items) => onChange('items', items)} />,
    product_grid: () => <ProductsEditor products={content.products || []} onChange={(products) => onChange('products', products)} />,
    blog_list: () => (
      <div className="space-y-3">
        <Input label="Título" value={content.title || ''} onChange={(e) => onChange('title', e.target.value)} />
        <Input label="Qtd Posts" type="number" value={content.postsCount || 3} onChange={(e) => onChange('postsCount', parseInt(e.target.value))} />
      </div>
    ),
  }
  return editors[type]?.() || <pre className="text-xs bg-gray-50 p-3 rounded">{JSON.stringify(content, null, 2)}</pre>
}

function ArrayEditor({ items, onChange, fields, title }) {
  const add = () => onChange([...items, fields.reduce((o, f) => ({ ...o, [f]: '' }), {})])
  const update = (i, f, v) => { const n = [...items]; n[i] = { ...n[i], [f]: v }; onChange(n) }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-sm font-medium">{title} {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
          {fields.map(f => f === 'answer' || f === 'description' ? (
            <textarea key={f} placeholder={f} value={item[f] || ''} onChange={(e) => update(i, f, e.target.value)} rows={2} className="w-full px-3 py-2 border rounded text-sm" />
          ) : (
            <Input key={f} placeholder={f} value={item[f] || ''} onChange={(e) => update(i, f, e.target.value)} />
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4" />Adicionar</Button>
    </div>
  )
}

function TestimonialsEditor({ items, onChange }) {
  const add = () => onChange([...items, { name: '', role: '', text: '', rating: 5, avatar: '' }])
  const update = (i, f, v) => { const n = [...items]; n[i] = { ...n[i], [f]: v }; onChange(n) }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-sm font-medium">Depoimento {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome" value={item.name || ''} onChange={(e) => update(i, 'name', e.target.value)} />
            <Input placeholder="Cargo" value={item.role || ''} onChange={(e) => update(i, 'role', e.target.value)} />
          </div>
          <textarea placeholder="Depoimento" value={item.text || ''} onChange={(e) => update(i, 'text', e.target.value)} rows={2} className="w-full px-3 py-2 border rounded text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Nota" value={item.rating || 5} onChange={(e) => update(i, 'rating', parseInt(e.target.value))} min={1} max={5} />
            <MediaPicker value={item.avatar} onChange={(m) => update(i, 'avatar', m?.url || '')} aspectRatio="1/1" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4" />Adicionar</Button>
    </div>
  )
}

function TeamEditor({ members, onChange }) {
  const add = () => onChange([...members, { name: '', role: '', photo: '', bio: '' }])
  const update = (i, f, v) => { const n = [...members]; n[i] = { ...n[i], [f]: v }; onChange(n) }
  const remove = (i) => onChange(members.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {members.map((m, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-sm font-medium">Membro {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nome" value={m.name || ''} onChange={(e) => update(i, 'name', e.target.value)} />
            <Input placeholder="Cargo" value={m.role || ''} onChange={(e) => update(i, 'role', e.target.value)} />
          </div>
          <MediaPicker value={m.photo} onChange={(media) => update(i, 'photo', media?.url || '')} aspectRatio="1/1" />
          <Input placeholder="Bio" value={m.bio || ''} onChange={(e) => update(i, 'bio', e.target.value)} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4" />Adicionar</Button>
    </div>
  )
}

function CarouselEditor({ items, onChange }) {
  const add = () => onChange([...items, { image: '', title: '', description: '' }])
  const update = (i, f, v) => { const n = [...items]; n[i] = { ...n[i], [f]: v }; onChange(n) }
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-sm font-medium">Slide {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
          <MediaPicker value={item.image} onChange={(m) => update(i, 'image', m?.url || '')} aspectRatio="16/9" />
          <Input placeholder="Título" value={item.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4" />Adicionar</Button>
    </div>
  )
}

function ProductsEditor({ products, onChange }) {
  const add = () => onChange([...products, { image: '', name: '', description: '', category: '' }])
  const update = (i, f, v) => { const n = [...products]; n[i] = { ...n[i], [f]: v }; onChange(n) }
  const remove = (i) => onChange(products.filter((_, idx) => idx !== i))
  return (
    <div className="space-y-3">
      {products.map((p, i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between"><span className="text-sm font-medium">Produto {i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>
          <MediaPicker value={p.image} onChange={(m) => update(i, 'image', m?.url || '')} aspectRatio="1/1" />
          <Input placeholder="Nome" value={p.name || ''} onChange={(e) => update(i, 'name', e.target.value)} />
          <Input placeholder="Descrição" value={p.description || ''} onChange={(e) => update(i, 'description', e.target.value)} />
          <Input placeholder="Categoria" value={p.category || ''} onChange={(e) => update(i, 'category', e.target.value)} />
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}><Plus className="w-4 h-4" />Adicionar</Button>
    </div>
  )
}
