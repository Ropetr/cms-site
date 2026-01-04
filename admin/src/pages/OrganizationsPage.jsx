import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Users,
  Globe,
  Settings,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Badge, Modal, Loading } from '../components/ui'
import { organizationsService } from '../services/api'

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteModal, setDeleteModal] = useState({ open: false, org: null })
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, org: null })
  const [formData, setFormData] = useState({ name: '', slug: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsService.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data) => organizationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      toast.success('Organizacao criada com sucesso!')
      setCreateModal(false)
      setFormData({ name: '', slug: '' })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao criar organizacao')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => organizationsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      toast.success('Organizacao atualizada com sucesso!')
      setEditModal({ open: false, org: null })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar organizacao')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => organizationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizations'])
      toast.success('Organizacao excluida com sucesso!')
      setDeleteModal({ open: false, org: null })
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir organizacao')
    },
  })

  const organizations = data?.data || []

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.slug) {
      toast.error('Nome e slug sao obrigatorios')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Nome e obrigatorio')
      return
    }
    updateMutation.mutate({ id: editModal.org.id, data: formData })
  }

  const handleDelete = () => {
    if (deleteModal.org) {
      deleteMutation.mutate(deleteModal.org.id)
    }
  }

  const openEditModal = (org) => {
    setFormData({ name: org.name, slug: org.slug })
    setEditModal({ open: true, org })
  }

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'enterprise':
        return <Badge variant="primary">Enterprise</Badge>
      case 'pro':
        return <Badge variant="success">Pro</Badge>
      case 'starter':
        return <Badge variant="warning">Starter</Badge>
      default:
        return <Badge variant="default">Free</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizacoes</h1>
          <p className="text-gray-500">Gerencie suas organizacoes e agencias</p>
        </div>
        <Button onClick={() => {
          setFormData({ name: '', slug: '' })
          setCreateModal(true)
        }}>
          <Plus className="w-4 h-4" />
          Nova Organizacao
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar organizacoes..."
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
            <Loading text="Carregando organizacoes..." />
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Nenhuma organizacao encontrada' : 'Nenhuma organizacao criada'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search ? 'Tente outro termo de busca' : 'Comece criando sua primeira organizacao'}
            </p>
            {!search && (
              <Button onClick={() => {
                setFormData({ name: '', slug: '' })
                setCreateModal(true)
              }}>
                <Plus className="w-4 h-4" />
                Criar Organizacao
              </Button>
            )}
          </div>
        ) : (
          filteredOrgs.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{org.name}</h3>
                      <p className="text-sm text-gray-500">{org.slug}</p>
                    </div>
                  </div>
                  {getPlanBadge(org.plan)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{org.sites_count || 0} sites</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{org.users_count || 0} usuarios</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(org)}
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    onClick={() => setDeleteModal({ open: true, org })}
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
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Criar Organizacao"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Organizacao
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Agencia"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              })}
              placeholder="minha-agencia"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, org: null })}
        title="Editar Organizacao"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Organizacao
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Minha Agencia"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              })}
              placeholder="minha-agencia"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditModal({ open: false, org: null })}>
              Cancelar
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, org: null })}
        title="Excluir Organizacao"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir a organizacao{' '}
            <strong>{deleteModal.org?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Voce precisa excluir todos os sites da organizacao antes de exclui-la.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, org: null })}
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
