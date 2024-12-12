"use client"

import React from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { PhotoDisplayData } from '@/app/types/photos'
import { PhotoMarker } from '../map/photo-marker'
import { PhotoViewer } from '../photos/photo-viewer'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PhotosLayerProps {
  map: mapboxgl.Map | null
}

export function PhotosLayer({ map }: PhotosLayerProps) {
  const { user } = useUser()
  const [isEnabled, setIsEnabled] = React.useState(true)
  const [photos, setPhotos] = React.useState<PhotoDisplayData[]>([])
  const [selectedPhoto, setSelectedPhoto] = React.useState<PhotoDisplayData | null>(null)
  const [viewerOpen, setViewerOpen] = React.useState(false)

  // Fetch photos when component mounts
  React.useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch('/api/photos')
        if (!res.ok) throw new Error('Failed to fetch photos')
        const data = await res.json()
        setPhotos(data)
      } catch (error) {
        console.error('Error fetching photos:', error)
      }
    }

    fetchPhotos()
  }, [])

  const handlePhotoClick = (photo: PhotoDisplayData) => {
    setSelectedPhoto(photo)
    setViewerOpen(true)
  }

  if (!map) return null

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Switch
          id="photo-layer"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
        <Label htmlFor="photo-layer">Show Photos</Label>
      </div>

      {isEnabled && photos.map(photo => (
        <PhotoMarker
          key={photo.id}
          photo={photo}
          map={map}
          onClick={handlePhotoClick}
        />
      ))}

      <PhotoViewer
        photo={selectedPhoto}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  )
}