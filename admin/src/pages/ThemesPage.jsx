import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Palette, Type, RefreshCw, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Select, Loading } from '../components/ui'
import { themesService } from '../services/api'

export default function ThemesPage() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    primary_color: '#AA000E',
    secondary_color: '#1a1a1a',
    accent_color: '#f59e0b',
    background_color: '#ffffff',
    text_color: '#1f2937',
    heading_font: 'Inter',
    body_font: 'Inter',
    base_font_size: '16',
    border_radius: '8',
  })
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['themes'],
    queryFn: () => themesService.getActive(),
  })

  useEffect(() => {
    if (data?.data) {
      const theme = data.data
      // Parse tokens if JSON string
      let tokens = {}
      try {
        tokens = typeof theme.tokens === 'string' ? JSON.parse(theme.tokens) : theme.tokens || {}
      } catch { tokens = {} }
      
      setFormData({
        primary_color: tokens.primary_color || theme.primary_color || '#AA000E',
        secondary_color: tokens.secondary_color || theme.secondary_color || '#1a1a1a',
        accent_color: tokens.accent_color || '#f59e0b',
        background_color: tokens.background_color || '#ffffff',
        text_color: tokens.text_color || '#1f2937',
        heading_font: tokens.heading_font || theme.heading_font || 'Inter',
        body_font: tokens.body_font || theme.body_font || 'Inter',
        base_font_size: tokens.base_font_size || '16',
        border_radius: tokens.border_radius || '8',
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (themeData) => themesService.update('theme_default', {
      tokens: JSON.stringify(themeData),
      primary_color: themeData.primary_color,
      secondary_color: themeData.secondary_color,
      heading_font: themeData.heading_font,
      body_font: themeData.body_font,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['themes'])
      toast.success('Tema salvo!')
      setHasChanges(false)
    },
    onError: () => toast.error('Erro ao salvar tema'),
  })

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  const handleReset = () => {
    setFormData({
      primary_color: '#AA000E',
      secondary_color: '#1a1a1a',
      accent_color: '#f59e0b',
      background_color: '#ffffff',
      text_color: '#1f2937',
      heading_font: 'Inter',
      body_font: 'Inter',
      base_font_size: '16',
      border_radius: '8',
    })
    setHasChanges(true)
  }

  const fonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Oswald', 'Raleway', 'Playfair Display', 'Merriweather', 'Source Sans Pro',
  ]

  if (isLoading) return <Loading fullScreen text="Carregando tema..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Temas</h1>
          <p className="text-gray-500">Personalize cores e tipografia do site</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" /> Resetar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} loading={saveMutation.isPending}>
            <Save className="w-4 h-4" /> Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold">Cores</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <ColorPicker
              label="Cor Primária"
              value={formData.primary_color}
              onChange={(v) => handleChange('primary_color', v)}
              helper="Usada em botões, links e destaques"
            />
            <ColorPicker
              label="Cor Secundária"
              value={formData.secondary_color}
              onChange={(v) => handleChange('secondary_color', v)}
              helper="Usada em elementos secundários"
            />
            <ColorPicker
              label="Cor de Destaque"
              value={formData.accent_color}
              onChange={(v) => handleChange('accent_color', v)}
              helper="Para chamar atenção"
            />
            <ColorPicker
              label="Cor de Fundo"
              value={formData.background_color}
              onChange={(v) => handleChange('background_color', v)}
              helper="Fundo geral do site"
            />
            <ColorPicker
              label="Cor do Texto"
              value={formData.text_color}
              onChange={(v) => handleChange('text_color', v)}
              helper="Texto padrão"
            />
          </CardBody>
        </Card>

        {/* Typography Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold">Tipografia</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Fonte dos Títulos"
              value={formData.heading_font}
              onChange={(e) => handleChange('heading_font', e.target.value)}
              options={fonts.map(f => ({ value: f, label: f }))}
            />
            <Select
              label="Fonte do Corpo"
              value={formData.body_font}
              onChange={(e) => handleChange('body_font', e.target.value)}
              options={fonts.map(f => ({ value: f, label: f }))}
            />
            <Input
              label="Tamanho Base (px)"
              type="number"
              value={formData.base_font_size}
              onChange={(e) => handleChange('base_font_size', e.target.value)}
              min="12"
              max="20"
            />
            <Input
              label="Raio das Bordas (px)"
              type="number"
              value={formData.border_radius}
              onChange={(e) => handleChange('border_radius', e.target.value)}
              min="0"
              max="24"
            />
          </CardBody>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Preview</h2>
          </CardHeader>
          <CardBody>
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: formData.background_color,
                fontFamily: formData.body_font,
                fontSize: `${formData.base_font_size}px`,
                color: formData.text_color,
              }}
            >
              <h1
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: formData.heading_font, color: formData.primary_color }}
              >
                Título Principal
              </h1>
              <h2
                className="text-xl font-semibold mb-3"
                style={{ fontFamily: formData.heading_font }}
              >
                Subtítulo da Seção
              </h2>
              <p className="mb-4">
                Este é um exemplo de parágrafo com texto normal. O objetivo é visualizar 
                como as cores e fontes escolhidas aparecerão no site final.
              </p>
              <p className="mb-4">
                Você pode ver um{' '}
                <a href="#" style={{ color: formData.primary_color }}>
                  link de exemplo
                </a>
                {' '}e também um texto com{' '}
                <span style={{ color: formData.accent_color, fontWeight: 'bold' }}>
                  destaque especial
                </span>
                .
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  className="px-6 py-2 text-white font-medium"
                  style={{
                    backgroundColor: formData.primary_color,
                    borderRadius: `${formData.border_radius}px`,
                  }}
                >
                  Botão Primário
                </button>
                <button
                  className="px-6 py-2 font-medium border-2"
                  style={{
                    borderColor: formData.secondary_color,
                    color: formData.secondary_color,
                    borderRadius: `${formData.border_radius}px`,
                  }}
                >
                  Botão Secundário
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange, helper }) {
  const presets = ['#AA000E', '#1a1a1a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff']
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      <div className="flex gap-1 mt-2">
        {presets.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border ${value === color ? 'ring-2 ring-primary-500' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  )
}
