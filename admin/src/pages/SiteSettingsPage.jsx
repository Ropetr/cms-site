import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Globe,
  Settings,
  Users,
  Link as LinkIcon,
  Save,
  Trash2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Badge, Modal, Loading } from '../components/ui'
import { sitesService } from '../services/api'
import { useSite } from '../contexts/SiteContext'

export default function SiteSettingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { refreshSites } = useSite()
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({})
  const [domainInput, setDomainInput] = useState('')
  const [deleteModal, setDeleteModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesService.get(id),
    enabled: !!id,
  })

  const site = data?.data

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        slug: site.slug || '',
        logo_url: site.logo_url || '',
        favicon_url: site.favicon_url || '',
      })
      setDomainInput(site.domain || '')
    }
  }, [site])

  const updateMutation = useMutation({
    mutationFn: (data) => sitesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['site', id])
      queryClient.invalidateQueries(['sites'])
      refreshSites()
      toast.success('Site atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar site')
    },
  })

  const setDomainMutation = useMutation({
    mutationFn: (domain) => sitesService.setDomain(id, domain),
    onSuccess: () => {
      queryClient.invalidateQueries(['site', id])
      toast.success('Dominio configurado! Siga as instrucoes para verificar.')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao configurar dominio')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => sitesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sites'])
      refreshSites()
      toast.success('Site excluido com sucesso!')
      navigate('/sites')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir site')
    },
  })

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleSetDomain = () => {
    if (!domainInput) {
      toast.error('Digite um dominio')
      return
    }
    setDomainMutation.mutate(domainInput)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copiado!')
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <Loading text="Carregando site..." />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Site nao encontrado</h2>
        <Button onClick={() => navigate('/sites')}>Voltar para Sites</Button>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'domain', label: 'Dominio', icon: Globe },
    { id: 'users', label: 'Usuarios', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sites')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
          <p className="text-gray-500">Configuracoes do site</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Informacoes Gerais</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Site
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <Input
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Logo
              </label>
              <Input
                value={formData.logo_url || ''}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL do Favicon
              </label>
              <Input
                value={formData.favicon_url || ''}
                onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} loading={updateMutation.isPending}>
                <Save className="w-4 h-4" />
                Salvar
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'domain' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Subdominio</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{site.subdomain || `${site.slug}.fiosites.com`}</span>
                <Badge variant="success">Ativo</Badge>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Dominio Personalizado</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {site.domain ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{site.domain}</span>
                    {site.domain_status === 'active' ? (
                      <Badge variant="success">Verificado</Badge>
                    ) : site.domain_status === 'pending' ? (
                      <Badge variant="warning">Pendente</Badge>
                    ) : (
                      <Badge variant="danger">Falhou</Badge>
                    )}
                  </div>

                  {site.domain_status === 'pending' && site.domain_verification_token && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-800 mb-2">
                        Configuracao DNS necessaria
                      </h3>
                      <p className="text-sm text-yellow-700 mb-4">
                        Adicione os seguintes registros DNS no seu provedor:
                      </p>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded border">
                          <p className="text-xs text-gray-500 mb-1">Registro CNAME</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm flex-1">{site.domain} → proxy.fiosites.com</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard('proxy.fiosites.com')}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <p className="text-xs text-gray-500 mb-1">Registro TXT (verificacao)</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm flex-1 break-all">
                              _cf-custom-hostname.{site.domain} → {site.domain_verification_token}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(site.domain_verification_token)}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Configure um dominio personalizado para seu site.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="meusite.com.br"
                      className="flex-1"
                    />
                    <Button onClick={handleSetDomain} loading={setDomainMutation.isPending}>
                      Configurar
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Usuarios do Site</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-500">
              Gerenciamento de usuarios sera implementado em breve.
            </p>
          </CardBody>
        </Card>
      )}

      <Card className="border-red-200">
        <CardHeader>
          <h2 className="text-lg font-semibold text-red-600">Zona de Perigo</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Excluir Site</p>
              <p className="text-sm text-gray-500">
                Esta acao ira excluir permanentemente o site e todos os seus dados.
              </p>
            </div>
            <Button variant="danger" onClick={() => setDeleteModal(true)}>
              <Trash2 className="w-4 h-4" />
              Excluir
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Excluir Site"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o site <strong>{site.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta acao ira excluir todas as paginas, posts, midias e configuracoes. Esta acao nao pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate()}
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
