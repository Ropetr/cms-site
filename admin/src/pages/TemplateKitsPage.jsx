import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Check, Palette, FileText, Menu, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Modal, Loading } from '../components/ui'
import { pagesService, menusService, themesService } from '../services/api'
import { templateKits } from '../data/templateKits'

export default function TemplateKitsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedKit, setSelectedKit] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [applying, setApplying] = useState(false)
  const [progress, setProgress] = useState({ step: '', current: 0, total: 0 })

  const applyKit = async (kit) => {
    setApplying(true)
    setProgress({ step: 'Iniciando...', current: 0, total: 3 })

    try {
      setProgress({ step: 'Aplicando tema...', current: 1, total: 3 })
      await themesService.update('theme_default', {
        tokens: JSON.stringify({
          ...kit.theme.colors,
          ...kit.theme.fonts,
        }),
        primary_color: kit.theme.colors.primary_color,
        secondary_color: kit.theme.colors.secondary_color,
        heading_font: kit.theme.fonts.heading_font,
        body_font: kit.theme.fonts.body_font,
      })

      setProgress({ step: 'Criando menus...', current: 2, total: 3 })
      for (const menu of kit.menus) {
        try {
          await menusService.create({
            name: menu.name,
            slug: menu.slug,
            position: menu.position,
            is_visible: 1,
          })
        } catch (e) {
          console.log('Menu may already exist:', menu.slug)
        }
      }

      setProgress({ step: 'Criando paginas...', current: 3, total: 3 })
      for (const page of kit.pages) {
        try {
          const pageRes = await pagesService.create({
            title: page.title,
            slug: page.slug,
            page_type: page.page_type,
            status: 'draft',
            meta_title: page.meta_title,
            meta_description: page.meta_description,
          })

          if (pageRes?.data?.id && page.sections) {
            for (let i = 0; i < page.sections.length; i++) {
              const section = page.sections[i]
              await pagesService.addSection(pageRes.data.id, {
                section_type: section.section_type,
                title: section.title,
                layout: section.layout || 'default',
                variant: section.variant || 'default',
                content: JSON.stringify(section.content),
                sort_order: i,
              })
            }
          }
        } catch (e) {
          console.log('Page may already exist:', page.slug)
        }
      }

      queryClient.invalidateQueries(['pages'])
      queryClient.invalidateQueries(['menus'])
      queryClient.invalidateQueries(['themes'])

      toast.success(`Kit "${kit.name}" aplicado com sucesso!`)
      setShowConfirmModal(false)
      navigate('/pages')
    } catch (error) {
      console.error('Error applying kit:', error)
      toast.error('Erro ao aplicar kit. Tente novamente.')
    } finally {
      setApplying(false)
      setProgress({ step: '', current: 0, total: 0 })
    }
  }

  const handleSelectKit = (kit) => {
    setSelectedKit(kit)
    setShowConfirmModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary-500" />
            Kits de Templates
          </h1>
          <p className="text-gray-500 mt-1">
            Escolha um kit completo com tema, paginas e menus pre-configurados
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Otimizado para PageSpeed e SEO</h3>
            <p className="text-sm text-blue-700 mt-1">
              Todos os kits foram criados seguindo as melhores praticas do Google: estrutura semantica, 
              hierarquia de titulos correta, meta tags configuradas e blocos essenciais apenas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templateKits.map((kit) => (
          <Card key={kit.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div 
              className="h-3"
              style={{ backgroundColor: kit.preview }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{kit.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{kit.description}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  {kit.category}
                </span>
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Palette className="w-4 h-4" />
                    <span>Tema</span>
                  </div>
                  <div className="flex gap-1">
                    {Object.values(kit.theme.colors).slice(0, 4).map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{kit.pages.length} Paginas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kit.pages.map((page) => (
                      <span
                        key={page.slug}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {page.title}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Menu className="w-4 h-4" />
                    <span>{kit.menus.length} Menus</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kit.menus.map((menu) => (
                      <span
                        key={menu.slug}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {menu.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-2">
                    Fontes: {kit.theme.fonts.heading_font} / {kit.theme.fonts.body_font}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectKit(kit)}
                  >
                    Aplicar Kit <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => !applying && setShowConfirmModal(false)}
        title={`Aplicar Kit: ${selectedKit?.name}`}
        size="md"
      >
        {selectedKit && (
          <div className="space-y-4">
            {applying ? (
              <div className="py-8 text-center">
                <Loading text={progress.step} />
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {progress.current} de {progress.total}
                </p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Atencao:</strong> Este kit ira criar novas paginas e menus, e atualizar o tema atual. 
                    Paginas e menus existentes com os mesmos slugs serao ignorados.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">O que sera criado:</h4>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Tema com cores e fontes personalizadas</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{selectedKit.menus.length} menus de navegacao</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{selectedKit.pages.length} paginas com blocos configurados</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Meta tags SEO pre-configuradas</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => applyKit(selectedKit)}
                  >
                    Aplicar Kit
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
