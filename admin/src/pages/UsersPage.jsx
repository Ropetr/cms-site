import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Edit, User, Mail, Shield, Key, Search, UserPlus, Users as UsersIcon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Modal, Loading, Badge } from '../components/ui'
import { usersService } from '../services/api'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.list(),
  })

  const createMutation = useMutation({
    mutationFn: (userData) => usersService.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Usuário criado!')
      setCreateModal(false)
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Erro ao criar usuário'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Usuário atualizado!')
      setEditModal(null)
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Usuário excluído!')
      setDeleteModal(null)
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  const users = data?.data || []
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge variant="danger">Admin</Badge>
      case 'editor': return <Badge variant="warning">Editor</Badge>
      case 'author': return <Badge variant="success">Autor</Badge>
      default: return <Badge>{role}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <UserPlus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardBody>
      </Card>

      {/* Users List */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8"><Loading text="Carregando usuários..." /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </h3>
              <p className="text-gray-500 mb-4">
                {search ? 'Tente outro termo' : 'Adicione o primeiro usuário'}
              </p>
              {!search && (
                <Button onClick={() => setCreateModal(true)}>
                  <UserPlus className="w-4 h-4" /> Criar Usuário
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getRoleBadge(user.role)}
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setEditModal(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteModal(user)}
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Criar Usuário" size="md">
        <UserForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Editar Usuário" size="md">
        {editModal && (
          <UserForm
            initialData={editModal}
            onSubmit={(data) => updateMutation.mutate({ id: editModal.id, data })}
            onCancel={() => setEditModal(null)}
            loading={updateMutation.isPending}
            isEdit
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir Usuário" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            Excluir o usuário <strong>{deleteModal?.name}</strong>?
          </p>
          <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate(deleteModal.id)}
              loading={deleteMutation.isPending}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function UserForm({ initialData, onSubmit, onCancel, loading, isEdit }) {
  const [name, setName] = useState(initialData?.name || '')
  const [email, setEmail] = useState(initialData?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(initialData?.role || 'editor')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Nome é obrigatório')
    if (!email.trim()) return toast.error('Email é obrigatório')
    if (!isEdit && !password) return toast.error('Senha é obrigatória')
    
    const data = { name, email, role }
    if (password) data.password = password
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome completo"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemplo.com"
        required
      />
      <Input
        label={isEdit ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required={!isEdit}
      />
      <Select
        label="Função"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { value: 'admin', label: 'Administrador - Acesso total' },
          { value: 'editor', label: 'Editor - Pode editar conteúdo' },
          { value: 'author', label: 'Autor - Pode criar conteúdo' },
        ]}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Salvar' : 'Criar'}</Button>
      </div>
    </form>
  )
}
