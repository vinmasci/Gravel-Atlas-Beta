"use client"

import React from 'react'
import { Marker, Popup } from 'mapbox-gl'
import { PhotoDisplayData } from '@/app/types/photos'

interface PhotoMarkerProps {
  photo: PhotoDisplayData
  map: mapboxgl.Map
  onClick: (photo: PhotoDisplayData) => void
}

export function PhotoMarker({ photo, map, onClick }: PhotoMarkerProps) {
  const markerRef = React.useRef<Marker | null>(null)
  const popupRef = React.useRef<Popup | null>(null)

  React.useEffect(() => {
    if (!photo.location) return

    // Create a popup for single photo
    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'photo-marker-popup',
      offset: [0, -10]
    })
    .setHTML(`
      <div class="p-2 bg-white rounded-lg shadow-lg">
        <div class="relative">
          <img 
            src="${photo.url}" 
            alt="${photo.title}"
            class="w-full h-36 object-cover rounded-sm"
          />
        </div>
        <div class="mt-2">
          <h3 class="font-semibold text-sm">${photo.title}</h3>
          ${photo.description ? `<p class="text-xs text-gray-600 mt-1">${photo.description}</p>` : ''}
          <div class="flex items-center gap-2 mt-2">
            <img 
              src="${photo.uploadedBy.picture}" 
              alt="${photo.uploadedBy.name}"
              class="w-6 h-6 rounded-full"
            />
            <span class="text-xs text-gray-700">${photo.uploadedBy.name}</span>
          </div>
        </div>
      </div>
    `)

    // Create marker element
    const el = document.createElement('div')
    el.className = 'photo-marker'
    el.innerHTML = `
      <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg">
        <img 
          src="${photo.url}" 
          alt="${photo.title}"
          class="w-full h-full object-cover"
        />
      </div>
    `

    // Create marker
    const marker = new Marker({
      element: el,
      anchor: 'bottom'
    })
    .setLngLat([photo.location.lng, photo.location.lat])
    .addTo(map)

    // Add hover handlers
    el.addEventListener('mouseenter', () => {
      popup.setLngLat([photo.location.lng, photo.location.lat]).addTo(map)
    })

    el.addEventListener('mouseleave', () => {
      popup.remove()
    })

    // Add click handler
    el.addEventListener('click', () => {
      onClick(photo)
    })

    markerRef.current = marker
    popupRef.current = popup

    return () => {
      marker.remove()
      popup.remove()
    }
  }, [photo, map, onClick])

  return null
}