import { useState } from 'react'
import { Sparkles, Loader2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { aiService } from '../services/api'

/**
 * Botão de geração de conteúdo com IA
 */
export function AIGenerateButton({ onGenerate, type = 'content', context = {}, className = '' }) {
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleGenerate = async (action) => {
    setLoading(true)
    setShowMenu(false)
    
    try {
      let result
      
      switch (type) {
        case 'content':
          result = await aiService.generateContent({
            title: context.title,
            topic: context.topic,
            tone: action || 'professional',
            length: context.length || 'medium',
            type: context.type || 'post'
          })
          break
          
        case 'seo':
          result = await aiService.generateSEO({
            title: context.title,
            content: context.content,
            type: context.type || 'post'
          })
          break
          
        case 'excerpt':
          result = await aiService.generateExcerpt({
            title: context.title,
            content: context.content
          })
          break
          
        case 'improve':
          result = await aiService.improveText({
            text: context.text,
            action: action || 'improve'
          })
          break
          
        default:
          throw new Error('Tipo de geração não suportado')
      }
      
      if (result?.success && result?.data) {
        onGenerate?.(result.data)
        toast.success('Conteúdo gerado!')
      } else {
        throw new Error(result?.error || 'Erro ao gerar')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error(error.message || 'Erro ao gerar conteúdo')
    } finally {
      setLoading(false)
    }
  }

  // Menu de opções para diferentes tipos
  const menuOptions = {
    content: [
      { value: 'professional', label: '💼 Tom Profissional' },
      { value: 'casual', label: '😊 Tom Casual' },
      { value: 'technical', label: '🔧 Tom Técnico' },
      { value: 'persuasive', label: '🎯 Tom Persuasivo' },
    ],
    improve: [
      { value: 'improve', label: '✨ Melhorar' },
      { value: 'simplify', label: '📝 Simplificar' },
      { value: 'expand', label: '📖 Expandir' },
      { value: 'summarize', label: '📋 Resumir' },
      { value: 'formal', label: '👔 Mais Formal' },
      { value: 'casual', label: '😊 Mais Casual' },
    ],
  }

  const hasMenu = menuOptions[type]

  if (hasMenu) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Gerar com IA
          <ChevronDown className="w-3 h-3" />
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[180px]">
              {menuOptions[type].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleGenerate(option.value)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => handleGenerate()}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      Gerar
    </button>
  )
}

/**
 * Botão simples de geração de SEO
 */
export function AISEOButton({ title, content, type, onGenerate, className = '' }) {
  return (
    <AIGenerateButton
      type="seo"
      context={{ title, content, type }}
      onGenerate={onGenerate}
      className={className}
    />
  )
}

/**
 * Botão de geração de excerpt
 */
export function AIExcerptButton({ title, content, onGenerate, className = '' }) {
  return (
    <AIGenerateButton
      type="excerpt"
      context={{ title, content }}
      onGenerate={onGenerate}
      className={className}
    />
  )
}

export default AIGenerateButton
