import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, Phone, User, Calendar, Trash2, Eye, CheckCircle, Circle,
  Search, Filter, MessageSquare, ExternalLink, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Modal, Loading, Badge } from '../components/ui'
import { contactsService } from '../services/api'

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, status: statusFilter }],
    queryFn: () => contactsService.list({ search, status: statusFilter }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => contactsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts'])
      toast.success('Contato atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => contactsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts'])
      toast.success('Contato excluído!')
      setDeleteModal(null)
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  const contacts = data?.data || []

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const markAsRead = (contact) => {
    if (contact.status === 'new') {
      updateMutation.mutate({ id: contact.id, data: { status: 'read' } })
    }
  }

  const markAsReplied = (contact) => {
    updateMutation.mutate({ id: contact.id, data: { status: 'replied' } })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <Badge variant="warning">Novo</Badge>
      case 'read': return <Badge variant="default">Lido</Badge>
      case 'replied': return <Badge variant="success">Respondido</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const stats = {
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    read: contacts.filter(c => c.status === 'read').length,
    replied: contacts.filter(c => c.status === 'replied').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
        <p className="text-gray-500">Mensagens recebidas pelo formulário do site</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{stats.new}</p>
            <p className="text-sm text-gray-500">Novos</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.read}</p>
            <p className="text-sm text-gray-500">Lidos</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.replied}</p>
            <p className="text-sm text-gray-500">Respondidos</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'new', label: 'Novos' },
              { value: 'read', label: 'Lidos' },
              { value: 'replied', label: 'Respondidos' },
            ]}
            className="w-full sm:w-48"
          />
        </CardBody>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8"><Loading text="Carregando contatos..." /></div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search || statusFilter ? 'Nenhum contato encontrado' : 'Nenhuma mensagem recebida'}
              </h3>
              <p className="text-gray-500">
                {search || statusFilter ? 'Tente outros filtros' : 'As mensagens do formulário aparecerão aqui'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                    contact.status === 'new' ? 'bg-yellow-50' : ''
                  }`}
                  onClick={() => { setSelectedContact(contact); markAsRead(contact) }}
                >
                  <div className="flex-shrink-0 mt-1">
                    {contact.status === 'new' ? (
                      <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ) : contact.status === 'replied' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${contact.status === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {contact.name || 'Sem nome'}
                      </p>
                      {getStatusBadge(contact.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 line-clamp-2">{contact.message}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(contact.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Contact Detail Modal */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Detalhes do Contato"
        size="lg"
      >
        {selectedContact && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedContact.status)}
              <p className="text-sm text-gray-500">
                {new Date(selectedContact.created_at).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {selectedContact.name || '-'}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Telefone</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {selectedContact.phone ? (
                    <a href={`tel:${selectedContact.phone}`} className="text-primary-500 hover:underline">
                      {selectedContact.phone}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {selectedContact.email ? (
                    <a href={`mailto:${selectedContact.email}`} className="text-primary-500 hover:underline">
                      {selectedContact.email}
                    </a>
                  ) : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-500">Mensagem</label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedContact.message || '-'}</p>
              </div>
            </div>

            {selectedContact.page_url && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-500">Página de origem</label>
                <p className="text-gray-600 text-sm">{selectedContact.page_url}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteModal(selectedContact)}
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </Button>
              <div className="flex gap-2">
                {selectedContact.phone && (
                  <a
                    href={`https://wa.me/55${selectedContact.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4" /> WhatsApp
                    </Button>
                  </a>
                )}
                {selectedContact.status !== 'replied' && (
                  <Button onClick={() => { markAsReplied(selectedContact); setSelectedContact(null) }}>
                    <CheckCircle className="w-4 h-4" /> Marcar Respondido
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Excluir Contato" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Excluir este contato permanentemente?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => { deleteMutation.mutate(deleteModal.id); setSelectedContact(null) }}
              loading={deleteMutation.isPending}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
