"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PhotoDisplayData } from '@/app/types/photos'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, MapPinIcon } from 'lucide-react'

interface PhotoViewerProps {
  photo: PhotoDisplayData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PhotoViewer({ photo, open, onOpenChange }: PhotoViewerProps) {
  if (!photo) return null

  const formatDate = (dateValue: any) => {
    try {
      const date = new Date(typeof dateValue === 'string' ? parseInt(dateValue) : dateValue);
      if (isNaN(date.getTime())) {
        console.log('Invalid date from:', dateValue);
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return 'Invalid Date';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0">
        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          <div className="relative w-full aspect-video">
            <img 
              src={photo.url} 
              alt={photo.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{photo.title}</h2>
              
              {/* User info */}
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={photo.uploadedBy.picture} />
                  <AvatarFallback>{photo.uploadedBy.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{photo.uploadedBy.name}</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {photo.dateTaken && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(photo.dateTaken)}</span>
                </div>
              )}
              {photo.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>
                    {photo.location.lat.toFixed(6)}, {photo.location.lng.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {photo.description && (
              <p className="text-muted-foreground">
                {photo.description}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}