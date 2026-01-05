import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload,
  Image,
  Trash2,
  Copy,
  Check,
  Search,
  Grid,
  List,
  X,
  ZoomIn,
  Move,
  FileImage,
  Film,
  File,
  Download,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, Button, Input, Modal, Loading, Badge } from '../components/ui'
import { mediaService } from '../services/api'

export default function MediaPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [focalPointModal, setFocalPointModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  // Fetch media
  const { data, isLoading } = useQuery({
    queryKey: ['media', search],
    queryFn: () => mediaService.list({ search }),
  })


  // Upload mutation - envia um arquivo por vez
  const uploadMutation = useMutation({
    mutationFn: async (files) => {
      const results = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'general')
        const result = await mediaService.upload(formData)
        results.push(result)
      }
      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(['media'])
      const count = results.length
      toast.success(`${count} arquivo${count > 1 ? 's' : ''} enviado${count > 1 ? 's' : ''} com sucesso!`)
      setUploading(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao enviar arquivos')
      setUploading(false)
    },
  })
  })

  // Update mutation (for focal point)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => mediaService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['media'])
      toast.success('Ponto focal atualizado!')
      setFocalPointModal(null)
    },
    onError: () => {
      toast.error('Erro ao atualizar')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => mediaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['media'])
      toast.success('Arquivo excluído!')
      setDeleteModal(null)
      setSelectedMedia(null)
    },
    onError: () => {
      toast.error('Erro ao excluir')
    },
  })

  const mediaList = data?.data || []

  // Filter by search - usando original_name ao invés de filename
  const filteredMedia = mediaList.filter(item =>
    item.original_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.alt_text?.toLowerCase().includes(search.toLowerCase())
  )

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setUploading(true)
      uploadMutation.mutate(files)
    }
  }, [uploadMutation])

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      setUploading(true)
      uploadMutation.mutate(files)
    }
  }

  const copyUrl = (media) => {
    const url = media.url || `https://cms-site-media.planacacabamentos.workers.dev/${media.id}`
    navigator.clipboard.writeText(url)
    setCopiedId(media.id)
    toast.success('URL copiada!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image
    if (mimeType?.startsWith('video/')) return Film
    return File
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mídia</h1>
          <p className="text-gray-500">Biblioteca de arquivos e imagens</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" />
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Area */}
      <Card>
        <CardBody
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loading />
              <p className="mt-2 text-gray-500">Enviando arquivos...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Arraste arquivos aqui ou{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-500 hover:underline"
                >
                  clique para selecionar
                </button>
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPG, GIF, WebP, PDF, DOC até 10MB
              </p>
            </>
          )}
        </CardBody>
      </Card>

      {/* Search and View Toggle */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar arquivos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Loading text="Carregando mídia..." />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="p-8 text-center">
              <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {search ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo enviado'}
              </h3>
              <p className="text-gray-500 mb-4">
                {search ? 'Tente outro termo de busca' : 'Comece enviando seus arquivos'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {filteredMedia.map((media) => {
                const FileIcon = getFileIcon(media.mime_type)
                const isImage = media.mime_type?.startsWith('image/')
                // Priorizar thumbnail_url para melhor performance
                const imageUrl = media.thumbnail_url || media.url
                return (
                  <div
                    key={media.id}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedMedia?.id === media.id
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMedia(media)}
                  >
                    {isImage ? (
                      <img
                        src={imageUrl}
                        alt={media.alt_text || media.original_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                        <FileIcon className="w-12 h-12 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-2 px-2 truncate max-w-full">
                          {media.original_name}
                        </span>
                      </div>
                    )}
                    
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyUrl(media)
                        }}
                      >
                        {copiedId === media.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      {isImage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFocalPointModal(media)
                          }}
                        >
                          <Move className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-white/90 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteModal(media)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                    
                    {/* Focal point indicator */}
                    {isImage && (media.focal_x !== 50 || media.focal_y !== 50) && (
                      <div
                        className="absolute w-3 h-3 bg-primary-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                          left: `${media.focal_x || 50}%`,
                          top: `${media.focal_y || 50}%`,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMedia.map((media) => {
                const FileIcon = getFileIcon(media.mime_type)
                const isImage = media.mime_type?.startsWith('image/')
                return (
                  <div
                    key={media.id}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      selectedMedia?.id === media.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => setSelectedMedia(media)}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {isImage ? (
                        <img
                          src={media.thumbnail_url || media.url}
                          alt={media.alt_text || media.original_name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <FileIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{media.original_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(media.file_size)} • {media.width && media.height ? `${media.width}×${media.height} • ` : ''}{new Date(media.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyUrl(media)
                        }}
                      >
                        {copiedId === media.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      {isImage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFocalPointModal(media)
                          }}
                        >
                          <Move className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteModal(media)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Selected Media Details */}
      {selectedMedia && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Detalhes do Arquivo</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedMedia(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {selectedMedia.mime_type?.startsWith('image/') ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.alt_text || selectedMedia.original_name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <File className="w-16 h-16 text-gray-400" />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900">{selectedMedia.original_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tamanho</label>
                <p className="text-gray-900">{formatFileSize(selectedMedia.file_size)}</p>
              </div>
              {selectedMedia.width && selectedMedia.height && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Dimensões</label>
                  <p className="text-gray-900">{selectedMedia.width} × {selectedMedia.height}px {selectedMedia.aspect_ratio && `(${selectedMedia.aspect_ratio})`}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">URL</label>
                <div className="flex gap-2">
                  <Input
                    value={selectedMedia.url || ''}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyUrl(selectedMedia)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {selectedMedia.mime_type?.startsWith('image/') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Ponto Focal</label>
                  <p className="text-gray-500 text-sm mb-2">
                    X: {selectedMedia.focal_x || 50}% | Y: {selectedMedia.focal_y || 50}%
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFocalPointModal(selectedMedia)}
                  >
                    <Move className="w-4 h-4" />
                    Ajustar Ponto Focal
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Focal Point Modal */}
      <Modal
        isOpen={!!focalPointModal}
        onClose={() => setFocalPointModal(null)}
        title="Ajustar Ponto Focal"
        size="lg"
      >
        {focalPointModal && (
          <FocalPointEditor
            media={focalPointModal}
            onSave={(focalX, focalY) => {
              updateMutation.mutate({
                id: focalPointModal.id,
                data: { focal_x: focalX, focal_y: focalY },
              })
            }}
            onCancel={() => setFocalPointModal(null)}
            loading={updateMutation.isPending}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Excluir Arquivo"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir{' '}
            <strong>{deleteModal?.original_name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteMutation.mutate(deleteModal.id)}
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

// Focal Point Editor Component
function FocalPointEditor({ media, onSave, onCancel, loading }) {
  const [focalX, setFocalX] = useState(media.focal_x || 50)
  const [focalY, setFocalY] = useState(media.focal_y || 50)
  const imageRef = useRef(null)

  const handleImageClick = (e) => {
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setFocalX(Math.round(x))
    setFocalY(Math.round(y))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Clique na imagem para definir o ponto focal. Este ponto será mantido visível em diferentes proporções de corte.
      </p>
      
      <div
        ref={imageRef}
        className="relative cursor-crosshair rounded-lg overflow-hidden bg-gray-100"
        onClick={handleImageClick}
      >
        <img
          src={media.url}
          alt={media.original_name}
          className="w-full"
          draggable={false}
        />
        {/* Focal point indicator */}
        <div
          className="absolute w-6 h-6 bg-primary-500 border-4 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${focalX}%`,
            top: `${focalY}%`,
          }}
        />
        {/* Crosshair lines */}
        <div
          className="absolute w-full h-px bg-primary-500/30 pointer-events-none"
          style={{ top: `${focalY}%` }}
        />
        <div
          className="absolute w-px h-full bg-primary-500/30 pointer-events-none"
          style={{ left: `${focalX}%` }}
        />
      </div>

      {/* Preview boxes */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Desktop (16:9)</p>
          <div className="aspect-video bg-gray-200 rounded overflow-hidden">
            <img
              src={media.url}
              alt="Preview"
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: `${focalX}% ${focalY}%`,
              }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Quadrado (1:1)</p>
          <div className="aspect-square bg-gray-200 rounded overflow-hidden">
            <img
              src={media.url}
              alt="Preview"
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: `${focalX}% ${focalY}%`,
              }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Mobile (9:16)</p>
          <div className="aspect-[9/16] bg-gray-200 rounded overflow-hidden max-h-32 mx-auto">
            <img
              src={media.url}
              alt="Preview"
              className="w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: `${focalX}% ${focalY}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>Ponto Focal: X: {focalX}% | Y: {focalY}%</span>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave(focalX, focalY)} loading={loading}>
          Salvar
        </Button>
      </div>
    </div>
  )
}
