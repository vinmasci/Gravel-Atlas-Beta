'use client'

import { MapContext } from '@/app/contexts/map-context'
import { DrawModeProvider } from '@/app/contexts/draw-mode-context'
import React, { useState, useCallback } from 'react'
import MapView from '@/components/map-view'
import { NavSidebar } from '@/components/nav-sidebar'
import { MAP_STYLES } from '@/app/constants/map-styles'
import type { MapStyle } from '@/app/types/map'
import { useToast } from "@/app/hooks/use-toast"

export default function Home() {
  const [selectedStyle, setSelectedStyle] = useState<MapStyle>('mapbox')
  const [mapillaryVisible, setMapillaryVisible] = useState(false)
  const { toast } = useToast()

  const [viewState, setViewState] = useState({
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 10
  })

  const [overlayStates, setOverlayStates] = useState({
    segments: false,
    photos: false,
    'gravel-roads': false,
    'asphalt-roads': false,
    'speed-limits': false,
    'private-roads': false,
    'water-points': false,
    mapillary: false,
    'bike-infrastructure': false,
    'unknown-surface': false
  })

  const [layers] = useState([
    { id: 'gravel-roads', name: 'Gravel Roads', visible: true },
    { id: 'water-points', name: 'Water Points', visible: true },
    { id: 'campsites', name: 'Campsites', visible: false },
  ])

  // Handle search
  const handleSearch = useCallback((query: string) => {
    // Pass to MapView
    if (query) {
      setMapView?.handleSearch(query)
    }
  }, [])

  // Handle location click
  const handleLocationClick = useCallback(() => {
    setMapView?.handleLocationClick()
  }, [])

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.min((prev.zoom || 0) + 1, 20)
    }))
  }, [])

  const handleZoomOut = useCallback(() => {
    setViewState(prev => ({
      ...prev,
      zoom: Math.max((prev.zoom || 0) - 1, 1)
    }))
  }, [])

  // Handle layer toggle
  const handleLayerToggle = useCallback((layerId: string) => {
    setOverlayStates(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }))
  }, [])

  // Handle style change
  const handleStyleChange = useCallback((newStyle: MapStyle) => {
    setSelectedStyle(newStyle)
    if (MAP_STYLES[newStyle].type === 'google') {
      setMapillaryVisible(false)
      setOverlayStates(prev => ({
        ...prev,
        mapillary: false
      }))
    }
  }, [])

  return (
    <div className="h-full w-full relative">
      <MapContext.Provider value={{ map: null, setMap: () => {} }}>
        <DrawModeProvider map={null}>
          <NavSidebar 
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLayerToggle={handleLayerToggle}
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
            availableLayers={layers}
            mapillaryVisible={mapillaryVisible}
            overlayStates={overlayStates}
            className="z-[60]"
          />
          <MapView
            viewState={viewState}
            setViewState={setViewState}
            selectedStyle={selectedStyle}
            overlayStates={overlayStates}
            mapillaryVisible={mapillaryVisible}
          />
        </DrawModeProvider>
      </MapContext.Provider>
    </div>
  )
}