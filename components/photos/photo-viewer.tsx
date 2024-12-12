"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
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

  const { uploadedBy } = photo

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
              
              {/* User info and social links */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={uploadedBy.picture} />
                    <AvatarFallback>{uploadedBy.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{uploadedBy.name}</p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center space-x-3 text-sm">
                  {uploadedBy.website && (
                    <a 
                      href={uploadedBy.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Website"
                    >
                      <i className="fa-solid fa-globe w-4 h-4"></i>
                    </a>
                  )}
                  {uploadedBy.socialLinks?.instagram && (
                    <a 
                      href={uploadedBy.socialLinks.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                      title="Instagram"
                    >
                      <i className="fa-brands fa-instagram w-4 h-4"></i>
                    </a>
                  )}
                  {uploadedBy.socialLinks?.strava && (
                    <a 
                      href={uploadedBy.socialLinks.strava} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-[#FC4C02] transition-colors"
                      title="Strava"
                    >
                      <i className="fa-brands fa-strava w-4 h-4"></i>
                    </a>
                  )}
                  {uploadedBy.socialLinks?.facebook && (
                    <a 
                      href={uploadedBy.socialLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-[#4267B2] transition-colors"
                      title="Facebook"
                    >
                      <i className="fa-brands fa-facebook w-4 h-4"></i>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {photo.dateTaken && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{new Date(photo.dateTaken).toLocaleDateString()}</span>
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