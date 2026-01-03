import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export default function Loading({ 
  size = 'md', 
  text = 'Carregando...',
  fullScreen = false,
  className 
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const content = (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={clsx('animate-spin text-primary-500', sizes[size])} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        {content}
      </div>
    )
  }

  return content
}
