import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Edit, ChevronRight, ChevronDown, ExternalLink,
  Menu as MenuIcon, Link as LinkIcon, FileText, Home, GripVertical,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Modal, Loading, Badge } from '../components/ui'
import { menusService, menuItemsService, pagesService } from '../services/api'

export default function MenusPage() {
  const queryClient = useQueryClient()
  const [selectedMenu, setSelectedMenu] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [addItemModal, setAddItemModal] = useState(false)
  const [createMenuModal, setCreateMenuModal] = useState(false)
  const [deleteMenuModal, setDeleteMenuModal] = useState(null)
  const [deleteItemModal, setDeleteItemModal] = useState(null)

  // Buscar menus
  const { data: menusData, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
  })

  // Buscar páginas para vincular
  const { data: pagesData } = useQuery({
    queryKey: ['pages'],
    queryFn: () => pagesService.list(),
  })

  // Buscar itens do menu selecionado
  const { data: menuItemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['menu-items', selectedMenu?.id],
    queryFn: () => menuItemsService.listByMenu(selectedMenu.id),
    enabled: !!selectedMenu?.id,
  })

  const menus = menusData?.data || []
  const pages = pagesData?.data || []
  const menuItems = menuItemsData?.data || []

  // Selecionar primeiro menu automaticamente
  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [menus, selectedMenu])

  // Mutations
  const createMenuMutation = useMutation({
    mutationFn: (data) => menusService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['menus'])
      toast.success('Menu criado!')
      setCreateMenuModal(false)
      // Selecionar o novo menu
      if (response?.data?.id) {
        setSelectedMenu({ id: response.data.id, ...response.data })
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao criar menu')
    },
  })

  const deleteMenuMutation = useMutation({
    mutationFn: (id) => menusService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus'])
      toast.success('Menu excluído!')
      setDeleteMenuModal(null)
      setSelectedMenu(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir menu')
    },
  })

  // Menu Items Mutations
  const createItemMutation = useMutation({
    mutationFn: (data) => menuItemsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', selectedMenu?.id])
      toast.success('Item adicionado!')
      setAddItemModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao adicionar item')
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => menuItemsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', selectedMenu?.id])
      toast.success('Item atualizado!')
      setEditingItem(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar item')
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id) => menuItemsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', selectedMenu?.id])
      toast.success('Item excluído!')
      setDeleteItemModal(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir item')
    },
  })

  const reorderItemsMutation = useMutation({
    mutationFn: (items) => menuItemsService.reorder(items),
    onSuccess: () => {
      queryClient.invalidateQueries(['menu-items', selectedMenu?.id])
    },
    onError: () => {
      toast.error('Erro ao reordenar')
    },
  })

  // Handlers
  const handleAddItem = (itemData) => {
    createItemMutation.mutate({
      menu_id: selectedMenu.id,
      ...itemData,
      position: menuItems.length,
    })
  }

  const handleUpdateItem = (itemId, updates) => {
    updateItemMutation.mutate({ id: itemId, data: updates })
  }

  const handleDeleteItem = (item) => {
    setDeleteItemModal(item)
  }

  const confirmDeleteItem = () => {
    if (deleteItemModal) {
      deleteItemMutation.mutate(deleteItemModal.id)
    }
  }

  const handleMoveItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= menuItems.length) return

    const reorderedItems = [...menuItems]
    const [moved] = reorderedItems.splice(index, 1)
    reorderedItems.splice(newIndex, 0, moved)

    // Atualizar posições
    const updates = reorderedItems.map((item, i) => ({
      id: item.id,
      position: i,
      parent_item_id: item.parent_item_id || null,
    }))

    reorderItemsMutation.mutate(updates)
  }

  if (isLoading) return <Loading fullScreen text="Carregando menus..." />

  return (
    <div className="space-y-6">
      {/* Header */}
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
        {/* Lista de Menus */}
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
                    <button
                      key={menu.id}
                      onClick={() => setSelectedMenu(menu)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedMenu?.id === menu.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium">{menu.name}</p>
                        <p className="text-sm text-gray-500">{menu.slug}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Itens do Menu Selecionado */}
        <div className="lg:col-span-3">
          {selectedMenu ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedMenu.name}</h2>
                  <p className="text-sm text-gray-500">/{selectedMenu.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteMenuModal(selectedMenu)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => setAddItemModal(true)}>
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {isLoadingItems ? (
                  <div className="p-8">
                    <Loading text="Carregando itens..." />
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum item no menu</p>
                    <Button onClick={() => setAddItemModal(true)}>
                      <Plus className="w-4 h-4" /> Adicionar Item
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {menuItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Botões de Ordenação */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4 rotate-180" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === menuItems.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Ícone do Tipo */}
                        <div className="flex-shrink-0">
                          {item.item_type === 'page' ? (
                            <FileText className="w-5 h-5 text-gray-400" />
                          ) : item.item_type === 'home' ? (
                            <Home className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ExternalLink className="w-5 h-5 text-gray-400" />
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-gray-500 truncate">{item.url || '/'}</p>
                        </div>

                        {/* Badge Nova Aba */}
                        {item.target === '_blank' && (
                          <Badge variant="secondary">Nova aba</Badge>
                        )}

                        {/* Ações */}
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item)}
                          >
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
                <p className="text-gray-500">Selecione um menu para editar</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Criar Menu */}
      <Modal
        isOpen={createMenuModal}
        onClose={() => setCreateMenuModal(false)}
        title="Criar Menu"
        size="md"
      >
        <CreateMenuForm
          onSubmit={(data) => createMenuMutation.mutate(data)}
          onCancel={() => setCreateMenuModal(false)}
          loading={createMenuMutation.isPending}
        />
      </Modal>

      {/* Modal: Adicionar Item */}
      <Modal
        isOpen={addItemModal}
        onClose={() => setAddItemModal(false)}
        title="Adicionar Item"
        size="md"
      >
        <MenuItemForm
          pages={pages}
          onSubmit={handleAddItem}
          onCancel={() => setAddItemModal(false)}
          loading={createItemMutation.isPending}
        />
      </Modal>

      {/* Modal: Editar Item */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Item"
        size="md"
      >
        {editingItem && (
          <MenuItemForm
            pages={pages}
            initialData={editingItem}
            onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
            onCancel={() => setEditingItem(null)}
            loading={updateItemMutation.isPending}
          />
        )}
      </Modal>

      {/* Modal: Deletar Menu */}
      <Modal
        isOpen={!!deleteMenuModal}
        onClose={() => setDeleteMenuModal(null)}
        title="Excluir Menu"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o menu <strong>{deleteMenuModal?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Todos os itens do menu também serão excluídos. Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteMenuModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMenuMutation.mutate(deleteMenuModal.id)}
              loading={deleteMenuMutation.isPending}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Deletar Item */}
      <Modal
        isOpen={!!deleteItemModal}
        onClose={() => setDeleteItemModal(null)}
        title="Excluir Item"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o item <strong>{deleteItemModal?.label}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteItemModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteItem}
              loading={deleteItemMutation.isPending}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// FORM: Criar Menu
// ============================================
function CreateMenuForm({ onSubmit, onCancel, loading }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('header')

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
    if (!name.trim()) {
      return
    }
    const slug = generateSlug(name)
    onSubmit({ name, slug, location })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do Menu"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ex: Menu Principal"
      />
      <Select
        label="Localização"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        options={[
          { value: 'header', label: 'Header (Cabeçalho)' },
          { value: 'footer', label: 'Footer (Rodapé)' },
          { value: 'sidebar', label: 'Sidebar (Lateral)' },
        ]}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Criar Menu
        </Button>
      </div>
    </form>
  )
}

// ============================================
// FORM: Item do Menu
// ============================================
function MenuItemForm({ pages, initialData, onSubmit, onCancel, loading }) {
  const [itemType, setItemType] = useState(initialData?.item_type || 'page')
  const [label, setLabel] = useState(initialData?.label || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [pageId, setPageId] = useState(initialData?.page_id || '')
  const [target, setTarget] = useState(initialData?.target || '_self')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim()) {
      return
    }

    const itemData = {
      item_type: itemType,
      label: label.trim(),
      target,
    }

    if (itemType === 'page' && pageId) {
      itemData.page_id = pageId
      const page = pages.find(p => p.id === pageId)
      itemData.url = page ? `/${page.slug}` : ''
    } else if (itemType === 'home') {
      itemData.url = '/'
    } else if (itemType === 'external') {
      itemData.url = url
    }

    onSubmit(itemData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Tipo de Item"
        value={itemType}
        onChange={(e) => setItemType(e.target.value)}
        options={[
          { value: 'home', label: 'Home (Página Inicial)' },
          { value: 'page', label: 'Página do Site' },
          { value: 'external', label: 'Link Externo' },
        ]}
      />

      <Input
        label="Texto do Link"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        placeholder="Ex: Sobre Nós"
      />

      {itemType === 'page' && (
        <Select
          label="Selecione a Página"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          options={[
            { value: '', label: 'Selecione uma página...' },
            ...pages.map(p => ({ value: p.id, label: `${p.title} (/${p.slug})` }))
          ]}
        />
      )}

      {itemType === 'external' && (
        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemplo.com"
          type="url"
        />
      )}

      <Select
        label="Abrir em"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        options={[
          { value: '_self', label: 'Mesma janela' },
          { value: '_blank', label: 'Nova aba' },
        ]}
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? 'Salvar Alterações' : 'Adicionar Item'}
        </Button>
      </div>
    </form>
  )
}
