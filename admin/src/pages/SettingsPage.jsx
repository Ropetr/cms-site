import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save, Globe, Phone, Mail, MapPin, Facebook, Instagram, Linkedin,
  Youtube, Twitter, Settings, Image, FileText, Code, MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Loading } from '../components/ui'
import { settingsService } from '../services/api'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  })

  useEffect(() => {
    if (data?.data) {
      // Convert array of settings to object
      const settingsObj = {}
      if (Array.isArray(data.data)) {
        data.data.forEach(s => { settingsObj[s.key] = s.value })
      } else {
        Object.assign(settingsObj, data.data)
      }
      setFormData(settingsObj)
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (settings) => settingsService.update(settings),
    onSuccess: () => {
      queryClient.invalidateQueries(['settings'])
      toast.success('Configurações salvas!')
      setHasChanges(false)
    },
    onError: () => toast.error('Erro ao salvar'),
  })

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  if (isLoading) return <Loading fullScreen text="Carregando configurações..." />

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'contact', label: 'Contato', icon: Phone },
    { id: 'social', label: 'Redes Sociais', icon: Facebook },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'scripts', label: 'Scripts', icon: Code },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">Configure as informações do site</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} loading={saveMutation.isPending}>
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="hidden md:block w-48 flex-shrink-0">
          <Card>
            <CardBody className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </CardBody>
          </Card>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${
                  activeTab === tab.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <Card>
              <CardHeader><h2 className="font-semibold">Informações Gerais</h2></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Nome do Site"
                  value={formData.site_name || ''}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="Minha Empresa"
                />
                <Input
                  label="Slogan"
                  value={formData.site_tagline || ''}
                  onChange={(e) => handleChange('site_tagline', e.target.value)}
                  placeholder="Seu slogan aqui"
                />
                <Input
                  label="URL do Logo"
                  value={formData.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  placeholder="https://..."
                  helper="URL da imagem do logo"
                />
                <Input
                  label="URL do Favicon"
                  value={formData.favicon_url || ''}
                  onChange={(e) => handleChange('favicon_url', e.target.value)}
                  placeholder="https://..."
                  helper="URL do ícone (32x32 PNG)"
                />
              </CardBody>
            </Card>
          )}

          {activeTab === 'contact' && (
            <Card>
              <CardHeader><h2 className="font-semibold">Informações de Contato</h2></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Telefone"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="(44) 99999-9999"
                />
                <Input
                  label="WhatsApp"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="5544999999999"
                  helper="Número completo com código do país"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contato@empresa.com"
                />
                <Input
                  label="Endereço"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Rua, número - Cidade/UF"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Horário de Atendimento"
                    value={formData.business_hours || ''}
                    onChange={(e) => handleChange('business_hours', e.target.value)}
                    placeholder="Seg-Sex: 8h às 18h"
                  />
                  <Input
                    label="CNPJ"
                    value={formData.cnpj || ''}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'social' && (
            <Card>
              <CardHeader><h2 className="font-semibold">Redes Sociais</h2></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Facebook"
                  value={formData.facebook_url || ''}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/..."
                />
                <Input
                  label="Instagram"
                  value={formData.instagram_url || ''}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/..."
                />
                <Input
                  label="LinkedIn"
                  value={formData.linkedin_url || ''}
                  onChange={(e) => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
                <Input
                  label="YouTube"
                  value={formData.youtube_url || ''}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  placeholder="https://youtube.com/..."
                />
                <Input
                  label="Twitter/X"
                  value={formData.twitter_url || ''}
                  onChange={(e) => handleChange('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </CardBody>
            </Card>
          )}

          {activeTab === 'seo' && (
            <Card>
              <CardHeader><h2 className="font-semibold">SEO e Meta Tags</h2></CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Meta Title Padrão"
                  value={formData.default_meta_title || ''}
                  onChange={(e) => handleChange('default_meta_title', e.target.value)}
                  placeholder="Nome da Empresa | Slogan"
                  helper="Usado quando a página não tem título próprio"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description Padrão
                  </label>
                  <textarea
                    value={formData.default_meta_description || ''}
                    onChange={(e) => handleChange('default_meta_description', e.target.value)}
                    placeholder="Descrição padrão do site para SEO..."
                    rows={3}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {(formData.default_meta_description || '').length}/160 caracteres
                  </p>
                </div>
                <Input
                  label="Google Analytics ID"
                  value={formData.google_analytics_id || ''}
                  onChange={(e) => handleChange('google_analytics_id', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
                <Input
                  label="Google Tag Manager ID"
                  value={formData.gtm_id || ''}
                  onChange={(e) => handleChange('gtm_id', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
                <Input
                  label="Facebook Pixel ID"
                  value={formData.facebook_pixel_id || ''}
                  onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
                  placeholder="XXXXXXXXXXXXXXX"
                />
              </CardBody>
            </Card>
          )}

          {activeTab === 'scripts' && (
            <Card>
              <CardHeader><h2 className="font-semibold">Scripts Personalizados</h2></CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scripts no Head
                  </label>
                  <textarea
                    value={formData.head_scripts || ''}
                    onChange={(e) => handleChange('head_scripts', e.target.value)}
                    placeholder="<script>...</script>"
                    rows={5}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Código inserido antes do &lt;/head&gt;
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scripts no Body (início)
                  </label>
                  <textarea
                    value={formData.body_start_scripts || ''}
                    onChange={(e) => handleChange('body_start_scripts', e.target.value)}
                    placeholder="<script>...</script>"
                    rows={5}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Código inserido logo após o &lt;body&gt;
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scripts no Body (fim)
                  </label>
                  <textarea
                    value={formData.body_end_scripts || ''}
                    onChange={(e) => handleChange('body_end_scripts', e.target.value)}
                    placeholder="<script>...</script>"
                    rows={5}
                    className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Código inserido antes do &lt;/body&gt;
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
