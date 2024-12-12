"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from "@/app/hooks/use-toast"
import { Camera } from 'lucide-react'
import { useUser } from '@auth0/nextjs-auth0/client'
import exif from 'exif-reader'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PhotoMetadata } from '@/app/types/photos'

interface UploadPhotoDialogProps {
  onUploadComplete?: () => void;
}

// Helper function to convert GPS coordinates
function convertDMSToDD(degrees: number, minutes: number, seconds: number, direction: string) {
  let dd = degrees + minutes / 60 + seconds / 3600
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1
  }
  return dd
}

export function UploadPhotoDialog({ onUploadComplete }: UploadPhotoDialogProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [metadata, setMetadata] = React.useState<PhotoMetadata>({
    title: '',
    description: '',
  })
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)

  const extractImageMetadata = async (file: File): Promise<Partial<PhotoMetadata>> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer
          const exifData = exif(buffer)
          
          let latitude = null
          let longitude = null
          let dateTaken = null

          if (exifData.gps) {
            const { GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef } = exifData.gps
            
            if (GPSLatitude && GPSLatitudeRef && GPSLongitude && GPSLongitudeRef) {
              latitude = convertDMSToDD(
                GPSLatitude[0],
                GPSLatitude[1],
                GPSLatitude[2],
                GPSLatitudeRef
              )
              
              longitude = convertDMSToDD(
                GPSLongitude[0],
                GPSLongitude[1],
                GPSLongitude[2],
                GPSLongitudeRef
              )
            }
          }

          if (exifData.exif?.DateTimeOriginal) {
            dateTaken = new Date(exifData.exif.DateTimeOriginal).toISOString()
          }

          resolve({
            latitude,
            longitude,
            dateTaken,
            exifData: {
              make: exifData.image?.Make,
              model: exifData.image?.Model,
              exposureTime: exifData.exif?.ExposureTime,
              fNumber: exifData.exif?.FNumber,
              iso: exifData.exif?.ISO,
              focalLength: exifData.exif?.FocalLength,
            }
          })
        } catch (error) {
          console.error('Error extracting metadata:', error)
          resolve({})
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an image file"
      })
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size must be less than 10MB"
      })
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setSelectedFile(file)

    // Extract metadata
    const extractedMetadata = await extractImageMetadata(file)
    setMetadata(prev => ({
      ...prev,
      ...extractedMetadata
    }))
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file first"
      })
      return
    }

    if (!metadata.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a title"
      })
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('metadata', JSON.stringify(metadata))

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to upload photo')
      }

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      })

      setOpen(false)
      setMetadata({
        title: '',
        description: '',
      })
      setSelectedFile(null)
      setImagePreview(null)
      onUploadComplete?.()

    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload photo"
      })
    } finally {
      setIsUploading(false)
    }
  }

  React.useEffect(() => {
    // Cleanup preview URL when dialog closes or component unmounts
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  if (!user) {
    return (
      <Button 
        variant="outline" 
        onClick={() => window.location.href = '/api/auth/login'}
        className="flex-1"
      >
        <Camera className="mr-2 h-4 w-4" />
        Sign in to Add Photos
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <Camera className="mr-2 h-4 w-4" />
          Add Photo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogDescription>
            Add a photo to the map. GPS coordinates will be extracted if available.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {imagePreview && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="picture">Photo</Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {selectedFile && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={metadata.title}
                  onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for your photo"
                  disabled={isUploading}
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the location or conditions"
                  disabled={isUploading}
                  className="resize-none"
                  rows={3}
                />
              </div>

              {(metadata.latitude && metadata.longitude) ? (
                <p className="text-sm text-muted-foreground">
                  📍 GPS Location: {metadata.latitude.toFixed(6)}, {metadata.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No GPS data found in image
                </p>
              )}

              {metadata.dateTaken && (
                <p className="text-sm text-muted-foreground">
                  📅 Date Taken: {new Date(metadata.dateTaken).toLocaleDateString()}
                </p>
              )}

              {metadata.exifData && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {metadata.exifData.make && metadata.exifData.model && (
                    <p>📸 Camera: {metadata.exifData.make} {metadata.exifData.model}</p>
                  )}
                  {metadata.exifData.exposureTime && <p>⚡ Exposure: {metadata.exifData.exposureTime}s</p>}
                  {metadata.exifData.fNumber && <p>🎯 f/{metadata.exifData.fNumber}</p>}
                  {metadata.exifData.iso && <p>💡 ISO: {metadata.exifData.iso}</p>}
                  {metadata.exifData.focalLength && <p>🔍 Focal Length: {metadata.exifData.focalLength}mm</p>}
                </div>
              )}

              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !metadata.title.trim()}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </>
          )}

          {isUploading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Uploading photo...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}