import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Edit, ChevronRight, ChevronDown, ExternalLink,
  Menu as MenuIcon, Link as LinkIcon, FileText, Home,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Modal, Loading, Badge } from '../components/ui'
import { menusService, pagesService } from '../services/api'

export default function MenusPage() {
  const queryClient = useQueryClient()
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [addItemModal, setAddItemModal] = useState(false)
  const [createMenuModal, setCreateMenuModal] = useState(false)
  const [deleteMenuModal, setDeleteMenuModal] = useState(null)

  const { data: menusData, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
  })

  const { data: pagesData } = useQuery({
    queryKey: ['pages'],
    queryFn: () => pagesService.list(),
  })

  const menus = menusData?.data || []
  const pages = pagesData?.data || []

  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [menus, selectedMenu])

  const createMenuMutation = useMutation({
    mutationFn: (data) => menusService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus'])
      toast.success('Menu criado!')
      setCreateMenuModal(false)
    },
    onError: () => toast.error('Erro ao criar menu'),
  })

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }) => menusService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus'])
      toast.success('Menu atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const deleteMenuMutation = useMutation({
    mutationFn: (id) => menusService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus'])
      toast.success('Menu excluído!')
      setDeleteMenuModal(null)
      setSelectedMenu(null)
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  const getMenuItems = (menu) => {
    if (!menu?.items) return []
    try {
      return typeof menu.items === 'string' ? JSON.parse(menu.items) : menu.items
    } catch { return [] }
  }

  const saveMenuItems = (items) => {
    if (!selectedMenu) return
    updateMenuMutation.mutate({ id: selectedMenu.id, data: { items: JSON.stringify(items) } })
    setSelectedMenu({ ...selectedMenu, items: JSON.stringify(items) })
  }

  const handleAddItem = (item) => {
    const items = getMenuItems(selectedMenu)
    items.push({ id: `item_${Date.now()}`, ...item })
    saveMenuItems(items)
    setAddItemModal(false)
  }

  const handleUpdateItem = (itemId, updates) => {
    const items = getMenuItems(selectedMenu)
    const index = items.findIndex(i => i.id === itemId)
    if (index !== -1) {
      items[index] = { ...items[index], ...updates }
      saveMenuItems(items)
    }
    setEditingItem(null)
  }

  const handleDeleteItem = (itemId) => {
    const items = getMenuItems(selectedMenu).filter(i => i.id !== itemId)
    saveMenuItems(items)
  }

  const handleMoveItem = (index, direction) => {
    const items = getMenuItems(selectedMenu)
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return
    ;[items[index], items[newIndex]] = [items[newIndex], items[index]]
    saveMenuItems(items)
  }

  if (isLoading) return <Loading fullScreen text="Carregando menus..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-500">Gerencie os menus de navegação</p>
        </div>
        <Button onClick={() => setCreateMenuModal(true)}>
          <Plus className="w-4 h-4" /> Novo Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><h2 className="font-semibold">Menus</h2></CardHeader>
            <CardBody className="p-0">
              {menus.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MenuIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum menu</p>
                </div>
              ) : (
                <div className="divide-y">
                  {menus.map((menu) => (
                    <button key={menu.id} onClick={() => setSelectedMenu(menu)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 ${
                        selectedMenu?.id === menu.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}>
                      <div>
                        <p className="font-medium">{menu.name}</p>
                        <p className="text-sm text-gray-500">{menu.location}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedMenu ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedMenu.name}</h2>
                  <p className="text-sm text-gray-500">{selectedMenu.location}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteMenuModal(selectedMenu)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => setAddItemModal(true)}>
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {getMenuItems(selectedMenu).length === 0 ? (
                  <div className="p-8 text-center">
                    <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum item no menu</p>
                    <Button onClick={() => setAddItemModal(true)}>
                      <Plus className="w-4 h-4" /> Adicionar Item
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {getMenuItems(selectedMenu).map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleMoveItem(index, 'up')} disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </button>
                          <button onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === getMenuItems(selectedMenu).length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-shrink-0">
                          {item.type === 'page' ? <FileText className="w-5 h-5 text-gray-400" /> :
                           item.type === 'home' ? <Home className="w-5 h-5 text-gray-400" /> :
                           <ExternalLink className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-500 truncate">{item.url || '/'}</p>
                        </div>
                        {item.target === '_blank' && <Badge>Nova aba</Badge>}
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-8 text-center">
                <MenuIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecione um menu</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={createMenuModal} onClose={() => setCreateMenuModal(false)} title="Criar Menu" size="md">
        <CreateMenuForm onSubmit={(data) => createMenuMutation.mutate(data)}
          onCancel={() => setCreateMenuModal(false)} loading={createMenuMutation.isPending} />
      </Modal>

      <Modal isOpen={addItemModal} onClose={() => setAddItemModal(false)} title="Adicionar Item" size="md">
        <MenuItemForm pages={pages} onSubmit={handleAddItem} onCancel={() => setAddItemModal(false)} />
      </Modal>

      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Editar Item" size="md">
        {editingItem && <MenuItemForm pages={pages} initialData={editingItem}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)} onCancel={() => setEditingItem(null)} />}
      </Modal>

      <Modal isOpen={!!deleteMenuModal} onClose={() => setDeleteMenuModal(null)} title="Excluir Menu" size="sm">
        <div className="space-y-4">
          <p>Excluir <strong>{deleteMenuModal?.name}</strong>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteMenuModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteMenuMutation.mutate(deleteMenuModal.id)}
              loading={deleteMenuMutation.isPending}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
function CreateMenuForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('header')

  // Gerar slug automaticamente a partir do nome
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const slug = generateSlug(name)
    onSubmit({ name, slug, location, items: '[]' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Menu Principal" />
      <Select label="Localização" value={location} onChange={(e) => setLocation(e.target.value)}
        options={[
          { value: 'header', label: 'Header' },
          { value: 'footer', label: 'Footer' },
          { value: 'sidebar', label: 'Sidebar' },
        ]} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Criar</Button>
      </div>
    </form>
  )
}

function MenuItemForm({ pages, initialData, onSubmit, onCancel }) {
  const [type, setType] = useState(initialData?.type || 'page')
  const [label, setLabel] = useState(initialData?.label || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [pageSlug, setPageSlug] = useState(initialData?.page_slug || '')
  const [target, setTarget] = useState(initialData?.target || '_self')

  const handleSubmit = (e) => {
    e.preventDefault()
    const item = { type, label, target }
    if (type === 'page') { item.page_slug = pageSlug; item.url = `/${pageSlug}` }
    else if (type === 'home') { item.url = '/' }
    else { item.url = url }
    onSubmit(item)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}
        options={[
          { value: 'home', label: 'Home' },
          { value: 'page', label: 'Página' },
          { value: 'external', label: 'Link Externo' },
        ]} />
      <Input label="Texto" value={label} onChange={(e) => setLabel(e.target.value)} required />
      {type === 'page' && (
        <Select label="Página" value={pageSlug} onChange={(e) => setPageSlug(e.target.value)}
          options={[{ value: '', label: 'Selecione...' }, ...pages.map(p => ({ value: p.slug, label: p.title }))]} />
      )}
      {type === 'external' && (
        <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      )}
      <Select label="Abrir em" value={target} onChange={(e) => setTarget(e.target.value)}
        options={[{ value: '_self', label: 'Mesma janela' }, { value: '_blank', label: 'Nova aba' }]} />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{initialData ? 'Salvar' : 'Adicionar'}</Button>
      </div>
    </form>
  )
}
