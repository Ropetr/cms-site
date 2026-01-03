import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Search, 
  Check, 
  Loader2,
  Grid,
  List,
  FolderOpen,
  Trash2,
  ZoomIn
} from 'lucide-react'
import { mediaService } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL || 'https://cms-site-api.planacacabamentos.workers.dev'

/**
 * MediaPicker - Componente para selecionar imagens da biblioteca de mídia
 * 
 * Props:
 * - value: URL da imagem selecionada
 * - onChange: Callback quando uma imagem é selecionada (recebe { url, id, alt_text, focal_x, focal_y })
 * - onClose: Callback para fechar o picker (se usado como modal standalone)
 * - aspectRatio: Sugestão de aspect ratio para preview (ex: "16/9", "1/1")
 * - preset: Preset de tamanho para a URL (ex: "banner_desktop", "product_card")
 */
export default function MediaPicker({ 
  value, 
  onChange, 
  onClose, 
  aspectRatio = "16/9",
  preset = null,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  
  const queryClient = useQueryClient()

  // Fetch mídia
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media-picker'],
    queryFn: () => mediaService.list(),
    enabled: isOpen,
  })

  const media = mediaData?.data || []
  
  // Filtrar por busca
  const filteredMedia = media.filter(item => 
    item.original_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.alt_text?.toLowerCase().includes(search.toLowerCase())
  )

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['media-picker'])
      setUploadProgress(null)
      // Auto-selecionar a imagem recém-enviada
      if (data?.data) {
        setSelectedMedia(data.data)
      }
    },
    onError: () => {
      setUploadProgress(null)
    }
  })

  // Handlers
  const handleOpen = () => setIsOpen(true)
  
  const handleClose = () => {
    setIsOpen(false)
    setSelectedMedia(null)
    setSearch('')
    onClose?.()
  }

  const handleSelect = (item) => {
    setSelectedMedia(item)
  }

  const handleConfirm = () => {
    if (selectedMedia) {
      // Construir URL com preset se especificado
      let imageUrl = selectedMedia.url
      if (preset) {
        imageUrl = `${API_URL}/images/${selectedMedia.file_name}?preset=${preset}`
      }
      
      onChange?.({
        url: imageUrl,
        id: selectedMedia.id,
        file_name: selectedMedia.file_name,
        alt_text: selectedMedia.alt_text || '',
        focal_x: selectedMedia.focal_x || 0.5,
        focal_y: selectedMedia.focal_y || 0.5,
      })
      handleClose()
    }
  }

  const handleRemove = () => {
    onChange?.(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer?.files
    if (files?.[0]) {
      handleUpload(files[0])
    }
  }

  const handleUpload = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Apenas imagens são permitidas')
      return
    }
    
    setUploadProgress(0)
    uploadMutation.mutate(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  // Gerar URL de preview com dimensões
  const getPreviewUrl = (item, width = 200) => {
    return `${API_URL}/images/${item.file_name}?w=${width}&q=80`
  }

  return (
    <div className={className}>
      {/* Trigger / Preview */}
      <div className="relative">
        {value ? (
          <div className="relative group">
            <div 
              className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
              style={{ aspectRatio }}
            >
              <img 
                src={value}
                alt="Imagem selecionada"
                className="w-full h-full object-cover"
              />
              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleOpen}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Trocar imagem"
                >
                  <ImageIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                  title="Remover imagem"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 hover:bg-primary-50/50 transition-colors"
            style={{ aspectRatio }}
          >
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">Selecionar Imagem</span>
              <span className="text-xs text-gray-400 mt-1">Clique para abrir a biblioteca</span>
            </div>
          </button>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          
          <div className="absolute inset-4 md:inset-10 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Biblioteca de Mídia</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 px-6 py-3 border-b bg-gray-50">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar imagens..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-300'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Button */}
              <label className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                <Upload className="w-4 h-4" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Media Grid */}
              <div 
                className={`flex-1 overflow-auto p-4 ${dragActive ? 'bg-primary-50' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                {/* Upload Progress */}
                {uploadProgress !== null && (
                  <div className="mb-4 p-4 bg-primary-50 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                    <span className="text-primary-700">Enviando imagem...</span>
                  </div>
                )}

                {/* Drag Overlay */}
                {dragActive && (
                  <div className="absolute inset-4 border-2 border-dashed border-primary-500 bg-primary-50/80 rounded-lg flex items-center justify-center pointer-events-none z-10">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-primary-500 mx-auto mb-2" />
                      <p className="text-primary-700 font-medium">Solte a imagem aqui</p>
                    </div>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <FolderOpen className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Nenhuma imagem encontrada</p>
                    <p className="text-sm">Arraste uma imagem ou clique em Upload</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          selectedMedia?.id === item.id 
                            ? 'border-primary-500 ring-2 ring-primary-500/30' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={getPreviewUrl(item, 200)}
                          alt={item.alt_text || item.original_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {selectedMedia?.id === item.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer border-2 transition-all ${
                          selectedMedia?.id === item.id 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <img
                          src={getPreviewUrl(item, 100)}
                          alt={item.alt_text || item.original_name}
                          className="w-16 h-16 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.original_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.width}x{item.height} • {item.mime_type}
                          </p>
                          {item.alt_text && (
                            <p className="text-xs text-gray-400 truncate">
                              Alt: {item.alt_text}
                            </p>
                          )}
                        </div>
                        {selectedMedia?.id === item.id && (
                          <Check className="w-5 h-5 text-primary-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Panel */}
              {selectedMedia && (
                <div className="w-80 border-l bg-gray-50 p-4 flex flex-col">
                  <h3 className="font-medium text-gray-900 mb-3">Imagem Selecionada</h3>
                  
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
                    <img
                      src={getPreviewUrl(selectedMedia, 400)}
                      alt={selectedMedia.alt_text || selectedMedia.original_name}
                      className="w-full h-full object-contain"
                    />
                    {/* Focal Point Indicator */}
                    <div 
                      className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        left: `${(selectedMedia.focal_x || 0.5) * 100}%`,
                        top: `${(selectedMedia.focal_y || 0.5) * 100}%`,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)'
                      }}
                    />
                  </div>

                  <div className="space-y-3 text-sm flex-1">
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <p className="font-medium truncate">{selectedMedia.original_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Dimensões:</span>
                      <p className="font-medium">{selectedMedia.width}x{selectedMedia.height}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{selectedMedia.mime_type}</p>
                    </div>
                    {selectedMedia.alt_text && (
                      <div>
                        <span className="text-gray-500">Alt Text:</span>
                        <p className="font-medium">{selectedMedia.alt_text}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Ponto Focal:</span>
                      <p className="font-medium">
                        X: {Math.round((selectedMedia.focal_x || 0.5) * 100)}% | 
                        Y: {Math.round((selectedMedia.focal_y || 0.5) * 100)}%
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    💡 Edite o ponto focal na página de Mídia
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500">
                {filteredMedia.length} {filteredMedia.length === 1 ? 'imagem' : 'imagens'}
                {search && ` encontradas para "${search}"`}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedMedia}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selecionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * MediaPickerInline - Versão compacta para uso em formulários
 */
export function MediaPickerInline({ value, onChange, label, preset, aspectRatio = "16/9" }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <MediaPicker
        value={value}
        onChange={onChange}
        preset={preset}
        aspectRatio={aspectRatio}
      />
    </div>
  )
}

/**
 * MediaPickerMultiple - Para seleção de múltiplas imagens (galeria)
 */
export function MediaPickerMultiple({ value = [], onChange, maxItems = 10, aspectRatio = "1/1" }) {
  const handleAdd = (media) => {
    if (value.length < maxItems) {
      onChange([...value, media])
    }
  }

  const handleRemove = (index) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleReorder = (fromIndex, toIndex) => {
    const newValue = [...value]
    const [moved] = newValue.splice(fromIndex, 1)
    newValue.splice(toIndex, 0, moved)
    onChange(newValue)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {value.map((item, index) => (
          <div 
            key={item.id || index} 
            className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
          >
            <img
              src={item.url}
              alt={item.alt_text || ''}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1.5 bg-white rounded-full hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-xs rounded">
              {index + 1}
            </span>
          </div>
        ))}
        
        {value.length < maxItems && (
          <MediaPicker
            onChange={handleAdd}
            aspectRatio={aspectRatio}
          />
        )}
      </div>
      
      <p className="text-xs text-gray-500">
        {value.length} de {maxItems} imagens
      </p>
    </div>
  )
}
