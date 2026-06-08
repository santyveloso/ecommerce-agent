import { useState, useEffect } from 'react'
import { uid } from './helpers'
import { API } from './constants'

interface GeneratedImage {
  id: string
  prompt: string
  url: string
  timestamp: string
}

export function useStudioState() {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem('ec_studio_images')
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [studioInput, setStudioInput] = useState('')
  const [studioLoading, setStudioLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [demoMode, setDemoMode] = useState(true)
  const [cardSize, setCardSize] = useState<'S' | 'M' | 'L'>('S')
  const [modalImage, setModalImage] = useState<GeneratedImage | null>(null)

  useEffect(() => { localStorage.setItem('ec_studio_images', JSON.stringify(generatedImages)) }, [generatedImages])

  const studioUploads = generatedImages

  const handleStudioSend = async (e: React.FormEvent, contextImage?: GeneratedImage | null) => {
    e.preventDefault()
    if (!studioInput.trim() || studioLoading) return
    const userText = studioInput.trim()
    setStudioInput('')
    setStudioLoading(true)

    const imgContext = contextImage || selectedImage
    const promptContext = imgContext
      ? `[Variation of: ${imgContext.prompt}] ${userText}`
      : userText

    setSelectedImage(null)

    try {
      const res = await fetch(`${API}/studio/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptContext })
      })
      if (res.ok) {
        const d = await res.json()
        const newImage: GeneratedImage = {
          id: uid(),
          prompt: userText,
          url: d.media?.url || '',
          timestamp: new Date().toISOString(),
        }
        setGeneratedImages(prev => [newImage, ...prev])
      } else {
        const newImage: GeneratedImage = {
          id: uid(),
          prompt: userText,
          url: '',
          timestamp: new Date().toISOString(),
        }
        setGeneratedImages(prev => [newImage, ...prev])
      }
    } catch {
      const newImage: GeneratedImage = {
        id: uid(),
        prompt: userText,
        url: '',
        timestamp: new Date().toISOString(),
      }
      setGeneratedImages(prev => [newImage, ...prev])
    } finally {
      setStudioLoading(false)
      setSelectedImage(null)
    }
  }

  const deleteAsset = async (filename: string) => {
    try {
      const res = await fetch(`${API}/studio/upload/${filename}`, { method: 'DELETE' })
      if (res.ok) setGeneratedImages(prev => prev.filter(a => (a as any).filename !== filename))
    } catch (err) { console.error('Erro ao eliminar', err) }
  }

  return {
    generatedImages, setGeneratedImages,
    studioInput, setStudioInput,
    studioLoading,
    selectedImage, setSelectedImage,
    demoMode, setDemoMode,
    cardSize, setCardSize,
    modalImage, setModalImage,
    studioUploads,
    handleStudioSend, deleteAsset,
  }
}
