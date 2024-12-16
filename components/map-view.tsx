'use client'

import React, { useCallback, useRef, useEffect, useState } from 'react'
import Map from 'react-map-gl'
import { Loader } from '@googlemaps/js-api-loader'
import 'mapbox-gl/dist/mapbox-gl.css'
import { updatePhotoLayer } from '@/lib/photo-layer'
import { updateSegmentLayer } from '@/lib/segment-layer'
import { addGravelRoadsSource, addGravelRoadsLayer, updateGravelRoadsLayer } from '@/lib/gravel-roads-layer'
import { addBikeInfraSource, addBikeInfraLayer, updateBikeInfraLayer } from '@/lib/bike-infrastructure-layer'
import { addPrivateRoadsLayer, updatePrivateRoadsLayer } from '@/lib/private-roads-layer'
import { addUnknownSurfaceSource, addUnknownSurfaceLayer, updateUnknownSurfaceLayer } from '@/lib/unknown-surface-layer'
import { addWaterPointsSource, addWaterPointsLayer, updateWaterPointsLayer } from '@/lib/water-points-layer'
import { MAP_STYLES } from '@/app/constants/map-styles'
import type { MapStyle } from '@/app/types/map'
import { addMapillaryLayers } from '@/lib/mapillary'
import { CustomAlert } from './ui/custom-alert'
import { MapContext } from '@/app/contexts/map-context'
import { DrawModeProvider } from '@/app/contexts/draw-mode-context'
import { SegmentSheet } from './segments/segment-sheet'
import { FloatingElevationProfile } from './segments/floating-elevation-profile'
import { useDrawMode } from '@/app/hooks/use-draw-mode'

interface ViewState {
  longitude: number
  latitude: number
  zoom: number
}

interface MapViewProps {
  viewState: ViewState
  setViewState: (viewState: ViewState) => void
  selectedStyle: MapStyle
  overlayStates: {
    segments: boolean
    photos: boolean
    'gravel-roads': boolean
    'asphalt-roads': boolean
    'speed-limits': boolean
    'private-roads': boolean
    mapillary: boolean
    'water-points': boolean
    'bike-infrastructure': boolean
    'unknown-surface': boolean
  }
  mapillaryVisible: boolean
}

// Add the new interface right after MapViewProps
interface MapViewInnerProps extends MapViewProps {
  onMapInit: (map: mapboxgl.Map) => void
}

// Initialize Google Maps loader
const googleLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['maps', 'places']
})

const LoadingSpinner = () => (
  <div className="absolute top-4 right-4 z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
  </div>
)

function MapViewInner({
  viewState,
  setViewState,
  selectedStyle,
  overlayStates,
  mapillaryVisible,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const googleMap = useRef<google.maps.Map | null>(null)
  const mapRef = useRef<any>(null)
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  
  const [selectedSegment, setSelectedSegment] = useState<{
    id: string
    title: string
    userName: string
    auth0Id: string
    length: number
    averageRating?: number
    totalVotes?: number
    metadata?: {
      elevationProfile?: ElevationPoint[]
      elevationGain?: number
      elevationLoss?: number
    }
  } | null>(null)

  interface ElevationPoint {
    distance: number
    elevation: number
  }

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  }

  // Initialize Google Maps
  useEffect(() => {
    googleLoader.load().then(() => {
      setIsGoogleLoaded(true)
    }).catch((error) => {
      console.error('Error loading Google Maps:', error)
    })
  }, [])

  // Initialize Google Maps instance
  useEffect(() => {
    if (MAP_STYLES[selectedStyle].type === 'google' && isGoogleLoaded && mapContainer.current) {
      googleMap.current = new google.maps.Map(mapContainer.current, {
        center: { lat: viewState.latitude, lng: viewState.longitude },
        zoom: viewState.zoom,
        mapTypeId: MAP_STYLES[selectedStyle].style
      })
    }
  }, [selectedStyle, isGoogleLoaded, viewState])

  // Add terrain configuration
  useEffect(() => {
    if (!mapInstance || selectedStyle !== 'mapbox') return

    mapInstance.once('style.load', () => {
      try {
        if (!mapInstance.getSource('mapbox-dem')) {
          mapInstance.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          })

          mapInstance.setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1
          })
        }
      } catch (error) {
        console.error('Error adding terrain:', error)
      }
    })

    return () => {
      if (mapInstance && mapInstance.getSource('mapbox-dem')) {
        try {
          mapInstance.setTerrain(null)
          mapInstance.removeSource('mapbox-dem')
        } catch (e) {
          console.error('Error cleaning up terrain:', e)
        }
      }
    }
  }, [mapInstance, selectedStyle])

  // Layer visibility effects
  useEffect(() => {
    if (!mapInstance) return
    updatePhotoLayer(mapInstance, overlayStates.photos)
  }, [mapInstance, overlayStates.photos])

  useEffect(() => {
    if (!mapInstance) return
    updateSegmentLayer(mapInstance, overlayStates.segments)
  }, [mapInstance, overlayStates.segments])

  useEffect(() => {
    if (!mapInstance) return
    if (!mapInstance.getSource('mapillary')) {
      addMapillaryLayers(mapInstance)
    }
    if (mapillaryVisible) {
      mapInstance.setLayoutProperty('mapillary-location', 'visibility', 'visible')
      mapInstance.setLayoutProperty('mapillary-sequence', 'visibility', 'visible')
    } else {
      mapInstance.setLayoutProperty('mapillary-location', 'visibility', 'none')
      mapInstance.setLayoutProperty('mapillary-sequence', 'visibility', 'none')
    }
  }, [mapInstance, mapillaryVisible])

  useEffect(() => {
    if (!mapInstance) return
    updateGravelRoadsLayer(mapInstance, overlayStates['gravel-roads'])
  }, [mapInstance, overlayStates['gravel-roads']])

  useEffect(() => {
    if (!mapInstance) return
    updateBikeInfraLayer(mapInstance, overlayStates['bike-infrastructure'])
  }, [mapInstance, overlayStates['bike-infrastructure']])

  useEffect(() => {
    if (!mapInstance) return
    updateUnknownSurfaceLayer(mapInstance, overlayStates['unknown-surface'])
  }, [mapInstance, overlayStates['unknown-surface']])

  useEffect(() => {
    if (!mapInstance) return
    updatePrivateRoadsLayer(mapInstance, overlayStates['private-roads'])
  }, [mapInstance, overlayStates['private-roads']])

  useEffect(() => {
    if (!mapInstance) return
    updateWaterPointsLayer(mapInstance, overlayStates['water-points'])
  }, [mapInstance, overlayStates['water-points']])

  // Render Google Maps
  if (MAP_STYLES[selectedStyle].type === 'google') {
    return (
      <div className="relative h-full isolate">
        <div ref={mapContainer} style={mapContainerStyle} className="h-full w-full" />
        {isLoading && <LoadingSpinner />}
        {showAlert && (
          <CustomAlert message="Mapillary overlay is not available with Google Maps layers" />
        )}
      </div>
    )
  }

  // Render Mapbox
  return (
    <div className="w-full h-full relative">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={mapContainerStyle}
        mapStyle={
          selectedStyle === 'osm-cycle'
            ? MAP_STYLES[selectedStyle].style
            : selectedStyle === 'mapbox'
            ? MAP_STYLES[selectedStyle].style
            : 'mapbox://styles/mapbox/empty-v9'
        }
        projection={selectedStyle === 'osm-cycle' ? 'mercator' : 'globe'}
        reuseMaps
        ref={mapRef}
        onLoad={(evt) => {
          setMapInstance(evt.target)
          onMapInit(map)  // Add this line
          
          // Initialize map layers
          const map = evt.target
          if (map && !MAP_STYLES[selectedStyle].type.includes('google')) {
            // Load water icon
            map.loadImage('/icons/glass-water-droplet-duotone-thin.png', (error, image) => {
              if (error) throw error
              if (!map.hasImage('water-icon')) {
                map.addImage('water-icon', image)
              }
            })
            
            // Add and update all layers
            addGravelRoadsSource(map)
            addGravelRoadsLayer(map)
            updateGravelRoadsLayer(map, overlayStates['gravel-roads'])
            
            addBikeInfraSource(map)
            addBikeInfraLayer(map)
            updateBikeInfraLayer(map, overlayStates['bike-infrastructure'])
            
            addWaterPointsSource(map)
            addWaterPointsLayer(map)
            updateWaterPointsLayer(map, overlayStates['water-points'])

            addUnknownSurfaceSource(map)
            addUnknownSurfaceLayer(map)
            updateUnknownSurfaceLayer(map, overlayStates['unknown-surface'])

            addPrivateRoadsLayer(map)
            updatePrivateRoadsLayer(map, overlayStates['private-roads'])

            // Initialize photos and segments
            updatePhotoLayer(map, overlayStates.photos)
            updateSegmentLayer(map, overlayStates.segments)
          }
        }}
      />
      {isLoading && <LoadingSpinner />}
      {showAlert && (
        <CustomAlert message="Mapillary overlay is not available with Google Maps layers" />
      )}

      {mapInstance && <FloatingElevationProfile />}

      <SegmentSheet
        open={!!selectedSegment}
        onOpenChange={(open) => !open && setSelectedSegment(null)}
        segment={selectedSegment}
        onUpdate={(updatedSegment) => {
          setSelectedSegment(updatedSegment)
        }}
      />
    </div>
  )
}

// Export the wrapped component
export default function MapView(props: MapViewProps) {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null)

  return (
    <MapContext.Provider value={{ map: mapInstance, setMap: setMapInstance }}>
      <DrawModeProvider map={mapInstance}>
        <MapViewInner 
          {...props} 
          onMapInit={(map) => setMapInstance(map)}
        />
      </DrawModeProvider>
    </MapContext.Provider>
  )
}