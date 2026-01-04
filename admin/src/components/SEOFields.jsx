import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Search } from 'lucide-react'

const SEO_LIMITS = {
  meta_title: { min: 30, max: 60, ideal: 55 },
  meta_description: { min: 120, max: 160, ideal: 155 },
}

function getCharacterStatus(length, field) {
  const limits = SEO_LIMITS[field]
  if (!limits) return 'neutral'
  
  if (length === 0) return 'empty'
  if (length < limits.min) return 'short'
  if (length > limits.max) return 'long'
  if (length <= limits.ideal) return 'ideal'
  return 'good'
}

function getStatusColor(status) {
  switch (status) {
    case 'empty': return 'text-gray-400'
    case 'short': return 'text-yellow-500'
    case 'long': return 'text-red-500'
    case 'ideal': return 'text-green-500'
    case 'good': return 'text-green-600'
    default: return 'text-gray-500'
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'empty': return null
    case 'short': return <AlertTriangle className="w-4 h-4" />
    case 'long': return <AlertCircle className="w-4 h-4" />
    case 'ideal':
    case 'good': return <CheckCircle className="w-4 h-4" />
    default: return null
  }
}

function CharacterCounter({ value, field, showWarning = true }) {
  const length = value?.length || 0
  const limits = SEO_LIMITS[field]
  const status = getCharacterStatus(length, field)
  const color = getStatusColor(status)
  const icon = getStatusIcon(status)
  
  const getMessage = () => {
    if (status === 'empty') return 'Campo vazio'
    if (status === 'short') return `Muito curto (mín. ${limits.min})`
    if (status === 'long') return `Muito longo (máx. ${limits.max})`
    if (status === 'ideal') return 'Tamanho ideal'
    return 'Bom'
  }
  
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      {icon}
      <span>{length}/{limits?.max || 0}</span>
      {showWarning && status !== 'neutral' && (
        <span className="ml-1">• {getMessage()}</span>
      )}
    </div>
  )
}

function SERPPreview({ title, description, url, siteName }) {
  const displayTitle = title || 'Título da página'
  const displayDescription = description || 'Descrição da página aparecerá aqui...'
  const displayUrl = url || 'exemplo.com/pagina'
  
  const truncatedTitle = displayTitle.length > 60 
    ? displayTitle.substring(0, 57) + '...' 
    : displayTitle
    
  const truncatedDescription = displayDescription.length > 160 
    ? displayDescription.substring(0, 157) + '...' 
    : displayDescription
  
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
        <Search className="w-4 h-4" />
        <span>Preview do Google</span>
      </div>
      <div className="space-y-1">
        <div className="text-sm text-gray-600 truncate">
          {siteName || 'fiosites.com'} › {displayUrl}
        </div>
        <h3 className="text-xl text-blue-800 hover:underline cursor-pointer font-normal leading-tight">
          {truncatedTitle}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {truncatedDescription}
        </p>
      </div>
    </div>
  )
}

export default function SEOFields({ 
  metaTitle, 
  metaDescription, 
  onMetaTitleChange, 
  onMetaDescriptionChange,
  pageTitle,
  slug,
  siteName,
  showPreview = true,
  required = false,
  className = ''
}) {
  const [showValidation, setShowValidation] = useState(false)
  
  useEffect(() => {
    if (metaTitle || metaDescription) {
      setShowValidation(true)
    }
  }, [metaTitle, metaDescription])
  
  const titleStatus = getCharacterStatus(metaTitle?.length || 0, 'meta_title')
  const descStatus = getCharacterStatus(metaDescription?.length || 0, 'meta_description')
  
  const hasErrors = required && (titleStatus === 'empty' || descStatus === 'empty')
  const hasWarnings = titleStatus === 'short' || titleStatus === 'long' || 
                      descStatus === 'short' || descStatus === 'long'
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Meta Title {required && <span className="text-red-500">*</span>}
          </label>
          <CharacterCounter value={metaTitle} field="meta_title" />
        </div>
        <input
          type="text"
          value={metaTitle || ''}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder={pageTitle || 'Título para SEO (30-60 caracteres)'}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${
            showValidation && titleStatus === 'empty' && required 
              ? 'border-red-300 bg-red-50' 
              : titleStatus === 'long' 
                ? 'border-yellow-300' 
                : 'border-gray-300'
          }`}
        />
        {showValidation && titleStatus === 'empty' && required && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Meta title é obrigatório para SEO
          </p>
        )}
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Meta Description {required && <span className="text-red-500">*</span>}
          </label>
          <CharacterCounter value={metaDescription} field="meta_description" />
        </div>
        <textarea
          value={metaDescription || ''}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="Descrição para SEO (120-160 caracteres)"
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${
            showValidation && descStatus === 'empty' && required 
              ? 'border-red-300 bg-red-50' 
              : descStatus === 'long' 
                ? 'border-yellow-300' 
                : 'border-gray-300'
          }`}
        />
        {showValidation && descStatus === 'empty' && required && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Meta description é obrigatório para SEO
          </p>
        )}
      </div>
      
      {showPreview && (
        <SERPPreview 
          title={metaTitle || pageTitle}
          description={metaDescription}
          url={slug}
          siteName={siteName}
        />
      )}
      
      {hasWarnings && !hasErrors && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Dicas de SEO</p>
            <ul className="mt-1 text-xs space-y-1">
              {titleStatus === 'short' && <li>• Meta title muito curto pode não atrair cliques</li>}
              {titleStatus === 'long' && <li>• Meta title será cortado nos resultados do Google</li>}
              {descStatus === 'short' && <li>• Meta description muito curta pode não ser exibida</li>}
              {descStatus === 'long' && <li>• Meta description será cortada nos resultados</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export function ImageAltWarning({ images = [], onFix }) {
  const missingAlt = images.filter(img => !img.alt || img.alt.trim() === '')
  
  if (missingAlt.length === 0) return null
  
  return (
    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">
          {missingAlt.length} {missingAlt.length === 1 ? 'imagem sem' : 'imagens sem'} texto alternativo
        </p>
        <p className="text-xs mt-1">
          Textos alternativos (alt) são importantes para acessibilidade e SEO.
        </p>
        {onFix && (
          <button 
            onClick={onFix}
            className="mt-2 text-xs font-medium text-orange-700 hover:text-orange-900 underline"
          >
            Corrigir agora
          </button>
        )}
      </div>
    </div>
  )
}

export { CharacterCounter, SERPPreview, getCharacterStatus, getStatusColor }
