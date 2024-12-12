"use client"

import React from 'react'
import { Marker, Popup } from 'mapbox-gl'
import { PhotoDisplayData } from '@/app/types/photos'
import Image from 'next/image'

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

    // Create a popup
    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '300px',
      className: 'photo-marker-popup'
    })
// In the popup HTML for clusters, replace the grid section with:
.setHTML(`
  <div class="flex gap-1 p-2 bg-white rounded-lg shadow-lg">
    ${previewFeatures.slice(0, 3).map((feature, i) => `
      <div class="relative">
        <img 
          src="${feature.properties.url}" 
          alt="${feature.properties.title}"
          class="w-24 h-24 object-cover rounded-sm"
        />
        ${i === 2 && totalCount > 3 ? `
          <div class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-sm">
            <span class="text-white font-semibold">+${totalCount - 3}</span>
          </div>
        ` : ''}
      </div>
    `).join('')}
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
    .setPopup(popup)
    .addTo(map)

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