import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react'
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://cms-site-api.planacacabamentos.workers.dev'

// Buscar página pela slug via API pública
async function fetchPageBySlug(slug) {
  const response = await fetch(`${API_URL}/api/public/pages/${slug}`)
  if (!response.ok) {
    throw new Error('Página não encontrada')
  }
  return response.json()
}

// Buscar settings e tema
async function fetchSiteData() {
  const [settingsRes, themeRes] = await Promise.all([
    fetch(`${API_URL}/api/public/settings`),
    fetch(`${API_URL}/api/public/theme`)
  ])
  return {
    settings: await settingsRes.json(),
    theme: await themeRes.json()
  }
}

export default function PreviewPage() {
  const { slug } = useParams()
  const [viewMode, setViewMode] = useState('desktop') // desktop, tablet, mobile

  const { data: pageData, isLoading: pageLoading, error: pageError } = useQuery({
    queryKey: ['preview-page', slug],
    queryFn: () => fetchPageBySlug(slug),
  })

  const { data: siteData } = useQuery({
    queryKey: ['site-data'],
    queryFn: fetchSiteData,
  })

  const page = pageData?.data
  const sections = page?.sections || []
  const theme = siteData?.theme?.data
  const settings = siteData?.settings?.data

  // CSS Variables do tema
  const themeStyles = theme ? {
    '--color-primary': theme.primary_color || '#991b1b',
    '--color-secondary': theme.secondary_color || '#1f2937',
    '--color-accent': theme.accent_color || '#dc2626',
    '--color-background': theme.background_color || '#ffffff',
    '--color-text': theme.text_color || '#1f2937',
    '--font-heading': theme.heading_font || 'Inter, sans-serif',
    '--font-body': theme.body_font || 'Inter, sans-serif',
  } : {}

  const viewportClass = {
    desktop: 'w-full',
    tablet: 'max-w-[768px] mx-auto',
    mobile: 'max-w-[375px] mx-auto',
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando preview...</p>
        </div>
      </div>
    )
  }

  if (pageError || !page) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">Página não encontrada</h1>
          <p className="mt-2 text-gray-600">A página "{slug}" não existe ou não está publicada.</p>
          <Link
            to="/pages"
            className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Páginas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-gray-900 text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            to={`/pages/${page.id}`}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Editor
          </Link>
          <span className="text-gray-500">|</span>
          <span className="font-medium">{page.title}</span>
          {page.status === 'draft' && (
            <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-medium rounded">
              Rascunho
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport Toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded ${viewMode === 'tablet' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={`/pages/${page.id}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-4">
        <div 
          className={`bg-white shadow-2xl transition-all duration-300 ${viewportClass[viewMode]}`}
          style={themeStyles}
        >
          {/* Page Content */}
          <div className="preview-content">
            {sections.length === 0 ? (
              <div className="py-20 text-center text-gray-500">
                <p className="text-lg">Esta página não tem blocos.</p>
                <Link
                  to={`/pages/${page.id}`}
                  className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700"
                >
                  <Edit className="w-4 h-4" />
                  Adicionar blocos no editor
                </Link>
              </div>
            ) : (
              sections.map((section, index) => (
                <BlockRenderer key={section.id || index} section={section} settings={settings} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Preview Styles */}
      <style>{`
        .preview-content {
          font-family: var(--font-body);
          color: var(--color-text);
        }
        .preview-content h1,
        .preview-content h2,
        .preview-content h3,
        .preview-content h4 {
          font-family: var(--font-heading);
        }
      `}</style>
    </div>
  )
}

// Renderizador de Blocos
function BlockRenderer({ section, settings }) {
  const { block_type, content, layout, variant } = section
  const data = typeof content === 'string' ? JSON.parse(content) : content

  const components = {
    hero_banner: HeroBannerBlock,
    text: TextBlock,
    media_text: MediaTextBlock,
    features: FeaturesBlock,
    gallery: GalleryBlock,
    cta: CTABlock,
    faq: FAQBlock,
    testimonials: TestimonialsBlock,
    contact_form: ContactFormBlock,
    stats: StatsBlock,
    team: TeamBlock,
    map: MapBlock,
    custom_html: CustomHTMLBlock,
  }

  const Component = components[block_type]

  if (!Component) {
    return (
      <div className="py-8 px-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-center">
        Bloco desconhecido: {block_type}
      </div>
    )
  }

  return <Component data={data} layout={layout} variant={variant} settings={settings} />
}

// ===============================================
// COMPONENTES DE BLOCOS
// ===============================================

function HeroBannerBlock({ data, layout, variant }) {
  const bgStyle = data.background_image 
    ? { backgroundImage: `url(${data.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: data.background_color || 'var(--color-primary)' }

  return (
    <section 
      className="relative min-h-[500px] flex items-center justify-center text-white"
      style={bgStyle}
    >
      {data.background_image && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {data.subtitle && (
          <p className="text-lg mb-4 opacity-90">{data.subtitle}</p>
        )}
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{data.title}</h1>
        {data.description && (
          <p className="text-xl mb-8 opacity-90">{data.description}</p>
        )}
        {(data.cta_text || data.cta_secondary_text) && (
          <div className="flex flex-wrap gap-4 justify-center">
            {data.cta_text && (
              <a 
                href={data.cta_url || '#'} 
                className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                {data.cta_text}
              </a>
            )}
            {data.cta_secondary_text && (
              <a 
                href={data.cta_secondary_url || '#'} 
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
                {data.cta_secondary_text}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function TextBlock({ data, layout }) {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <section className="py-16 px-4">
      <div className={`max-w-4xl mx-auto ${alignClass[data.alignment || 'left']}`}>
        {data.title && <h2 className="text-3xl font-bold mb-6">{data.title}</h2>}
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: data.content || data.text || '' }}
        />
      </div>
    </section>
  )
}

function MediaTextBlock({ data, layout }) {
  const isMediaLeft = layout === 'media-left' || !layout
  const imageUrl = data.image || data.media_url

  return (
    <section className="py-16 px-4">
      <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center ${!isMediaLeft ? 'md:[&>*:first-child]:order-2' : ''}`}>
        <div>
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={data.image_alt || data.title || ''} 
              className="w-full h-auto rounded-lg shadow-lg"
            />
          )}
        </div>
        <div>
          {data.title && <h2 className="text-3xl font-bold mb-4">{data.title}</h2>}
          <div 
            className="prose prose-lg"
            dangerouslySetInnerHTML={{ __html: data.content || data.text || '' }}
          />
          {data.cta_text && (
            <a 
              href={data.cta_url || '#'} 
              className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {data.cta_text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function FeaturesBlock({ data, layout }) {
  const items = data.items || data.features || []
  const gridCols = layout === 'grid-4' ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {items.map((item, index) => (
            <div key={index} className="text-center p-6">
              {item.icon && (
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-2xl">
                  {item.icon}
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GalleryBlock({ data, layout }) {
  const images = data.images || data.items || []
  const gridCols = layout === 'masonry' ? 'columns-2 md:columns-3' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4'

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className={`${gridCols} gap-4`}>
          {images.map((image, index) => (
            <div key={index} className="overflow-hidden rounded-lg">
              <img 
                src={typeof image === 'string' ? image : image.url} 
                alt={typeof image === 'string' ? '' : image.alt || ''} 
                className="w-full h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTABlock({ data, layout }) {
  return (
    <section 
      className="py-16 px-4 text-white text-center"
      style={{ backgroundColor: data.background_color || 'var(--color-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        {data.title && <h2 className="text-3xl font-bold mb-4">{data.title}</h2>}
        {data.description && <p className="text-xl mb-8 opacity-90">{data.description}</p>}
        <div className="flex flex-wrap gap-4 justify-center">
          {data.cta_text && (
            <a 
              href={data.cta_url || '#'} 
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              {data.cta_text}
            </a>
          )}
          {data.whatsapp && (
            <a 
              href={`https://wa.me/${data.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function FAQBlock({ data, layout }) {
  const items = data.items || data.questions || []

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className="space-y-4">
          {items.map((item, index) => (
            <details key={index} className="group bg-white border border-gray-200 rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold">
                {item.question}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-gray-600">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsBlock({ data, layout }) {
  const items = data.items || data.testimonials || []

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">"{item.text || item.content}"</p>
              <div className="flex items-center gap-3">
                {item.avatar && (
                  <img src={item.avatar} alt={item.name} className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.role && <p className="text-sm text-gray-500">{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactFormBlock({ data, settings }) {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{data.title}</h2>
        )}
        {data.description && (
          <p className="text-center text-gray-600 mb-8">{data.description}</p>
        )}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Nome *" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled
            />
            <input 
              type="email" 
              placeholder="E-mail *" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled
            />
          </div>
          <input 
            type="tel" 
            placeholder="Telefone" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled
          />
          <textarea 
            placeholder="Mensagem *" 
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled
          />
          <button 
            type="submit"
            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
            disabled
          >
            {data.button_text || 'Enviar Mensagem'}
          </button>
          <p className="text-xs text-gray-500 text-center">
            * Formulário desabilitado no preview
          </p>
        </form>
      </div>
    </section>
  )
}

function StatsBlock({ data, layout }) {
  const items = data.items || data.stats || []

  return (
    <section 
      className="py-16 px-4 text-white"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {items.map((item, index) => (
            <div key={index}>
              <p className="text-4xl md:text-5xl font-bold mb-2">{item.value}</p>
              <p className="text-lg opacity-90">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamBlock({ data, layout }) {
  const members = data.members || data.items || []
  const gridCols = layout === 'grid-4' ? 'md:grid-cols-4' : 'md:grid-cols-3'

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-12">{data.title}</h2>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {members.map((member, index) => (
            <div key={index} className="text-center">
              {member.photo && (
                <img 
                  src={member.photo} 
                  alt={member.name} 
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                />
              )}
              <h3 className="text-xl font-semibold">{member.name}</h3>
              {member.role && <p className="text-gray-500">{member.role}</p>}
              {member.bio && <p className="text-gray-600 mt-2 text-sm">{member.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MapBlock({ data, layout }) {
  const mapUrl = data.embed_url || `https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=${encodeURIComponent(data.address || '')}`

  return (
    <section className={layout === 'fullwidth' ? '' : 'py-16 px-4'}>
      <div className={layout === 'fullwidth' ? '' : 'max-w-6xl mx-auto'}>
        {data.title && (
          <h2 className="text-3xl font-bold text-center mb-8">{data.title}</h2>
        )}
        {data.embed_url ? (
          <iframe 
            src={data.embed_url}
            width="100%" 
            height="450" 
            style={{ border: 0 }}
            allowFullScreen 
            loading="lazy"
            className="rounded-lg"
          />
        ) : (
          <div className="bg-gray-200 h-[450px] rounded-lg flex items-center justify-center text-gray-500">
            <p>Configure a URL de embed do Google Maps</p>
          </div>
        )}
        {data.address && layout === 'with-info' && (
          <div className="mt-4 text-center">
            <p className="text-gray-600">{data.address}</p>
          </div>
        )}
      </div>
    </section>
  )
}

function CustomHTMLBlock({ data }) {
  return (
    <section className="py-8 px-4">
      <div 
        className="max-w-6xl mx-auto"
        dangerouslySetInnerHTML={{ __html: data.html || data.content || '' }}
      />
    </section>
  )
}
