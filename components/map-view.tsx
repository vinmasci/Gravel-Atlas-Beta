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
import { addPavedRoadsSource, addPavedRoadsLayer, updatePavedRoadsLayer } from '@/lib/paved-roads-layer';
import { addWaterPointsSource, addWaterPointsLayer, updateWaterPointsLayer } from '@/lib/water-points-layer'
import { MAP_STYLES } from '@/app/constants/map-styles'
import type { MapStyle } from '@/app/types/map'
import { addMapillaryLayers } from '@/lib/mapillary'
import { CustomAlert } from './ui/custom-alert'
import { useMapContext } from '@/app/contexts/map-context'
import { SegmentSheet } from './segments/segment-sheet'
import { FloatingElevationProfile } from './segments/floating-elevation-profile'

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
  onMapInit: (map: mapboxgl.Map) => void
}

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
  onMapInit
}: MapViewProps) {
  
  const { map: mapInstance, setMap: setMapInstance } = useMapContext()
  const mapContainer = useRef<HTMLDivElement>(null)
  const googleMap = useRef<google.maps.Map | null>(null)
  const mapRef = useRef<any>(null)
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
    distance: number;
    elevation: number;
    surfaceType?: 'paved' | 'unpaved' | 'unknown';
  }

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  }

  const initializeLayers = useCallback((map: mapboxgl.Map) => {
    if (!map || MAP_STYLES[selectedStyle].type.includes('google')) return;

    // First, clean up any existing layers and sources
    try {
      ['gravel-roads', 'bike-infrastructure', 'water-points', 'unknown-surface', 'private-roads'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      });
    } catch (error) {
      console.log('Error cleaning up layers:', error);
    }

    // Now add all the layers
    try {
      // Load water icon
      map.loadImage('/icons/glass-water-droplet-duotone-thin.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('water-icon')) {
          map.addImage('water-icon', image);
        }
      });
      
      // Add and update all layers
      addGravelRoadsSource(map);
      addGravelRoadsLayer(map);
      updateGravelRoadsLayer(map, overlayStates['gravel-roads']);

      addPavedRoadsSource(map);  // Add this line
      addPavedRoadsLayer(map);   // Add this line
      updatePavedRoadsLayer(map, overlayStates['asphalt-roads']);  // Add this line
      
      addBikeInfraSource(map);
      addBikeInfraLayer(map);
      updateBikeInfraLayer(map, overlayStates['bike-infrastructure']);
      
      addWaterPointsSource(map);
      addWaterPointsLayer(map);
      updateWaterPointsLayer(map, overlayStates['water-points']);

      addUnknownSurfaceSource(map);
      addUnknownSurfaceLayer(map);
      updateUnknownSurfaceLayer(map, overlayStates['unknown-surface']);

      addPrivateRoadsLayer(map);
      updatePrivateRoadsLayer(map, overlayStates['private-roads']);

      // Initialize photos and segments
      updatePhotoLayer(map, overlayStates.photos);
      updateSegmentLayer(map, overlayStates.segments);
    } catch (error) {
      console.log('Error initializing layers:', error);
    }
  }, [selectedStyle, overlayStates]);

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
    if (!mapInstance) return;
    updatePhotoLayer(mapInstance, overlayStates.photos);
  }, [mapInstance, overlayStates.photos]);

  useEffect(() => {
    if (!mapInstance) return;
    updateSegmentLayer(
      mapInstance, 
      overlayStates.segments,
      (segmentData) => setSelectedSegment(segmentData)
    );
  }, [mapInstance, overlayStates.segments]);

  useEffect(() => {
    if (!mapInstance) return;
    try {
      if (mapillaryVisible) {
        if (!mapInstance.getSource('mapillary')) {
          addMapillaryLayers(mapInstance);
        }
        if (mapInstance.getLayer('mapillary-location')) {
          mapInstance.setLayoutProperty('mapillary-location', 'visibility', 'visible');
          mapInstance.setLayoutProperty('mapillary-sequence', 'visibility', 'visible');
        }
      } else {
        if (mapInstance.getLayer('mapillary-location')) {
          mapInstance.setLayoutProperty('mapillary-location', 'visibility', 'none');
          mapInstance.setLayoutProperty('mapillary-sequence', 'visibility', 'none');
        }
      }
    } catch (error) {
      console.log('Mapillary layer error:', error);
    }
  }, [mapInstance, mapillaryVisible]);

  useEffect(() => {
    if (!mapInstance) return;
    updateGravelRoadsLayer(mapInstance, overlayStates['gravel-roads']);
  }, [mapInstance, overlayStates['gravel-roads']]);

  useEffect(() => {
    if (!mapInstance) return;
    updateBikeInfraLayer(mapInstance, overlayStates['bike-infrastructure']);
  }, [mapInstance, overlayStates['bike-infrastructure']]);

  useEffect(() => {
    if (!mapInstance) return;
    updatePavedRoadsLayer(mapInstance, overlayStates['asphalt-roads']);
  }, [mapInstance, overlayStates['asphalt-roads']]);

  useEffect(() => {
    if (!mapInstance) return;
    updateUnknownSurfaceLayer(mapInstance, overlayStates['unknown-surface']);
  }, [mapInstance, overlayStates['unknown-surface']]);

  useEffect(() => {
    if (!mapInstance) return;
    updatePrivateRoadsLayer(mapInstance, overlayStates['private-roads']);
  }, [mapInstance, overlayStates['private-roads']]);

  useEffect(() => {
    if (!mapInstance) return;
    updateWaterPointsLayer(mapInstance, overlayStates['water-points']);
  }, [mapInstance, overlayStates['water-points']]);

  // Effect to reinitialize layers when style changes
  useEffect(() => {
    if (!mapInstance) return;
    
    mapInstance.once('style.load', () => {
      initializeLayers(mapInstance);
    });
  }, [mapInstance, selectedStyle, initializeLayers]);

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
      mapStyle={MAP_STYLES[selectedStyle].style}
      projection={selectedStyle === 'osm-cycle' ? 'mercator' : 'globe'}
      reuseMaps
      ref={mapRef}
      onLoad={(evt) => {
        const map = evt.target;
        setMapInstance(map);
        onMapInit(map);
        
        map.once('style.load', () => {
          // Initialize base layers only after style is loaded
          addGravelRoadsSource(map);
          addGravelRoadsLayer(map);
          addBikeInfraSource(map);
          addBikeInfraLayer(map);
          addUnknownSurfaceSource(map);
          addUnknownSurfaceLayer(map);
          addPavedRoadsSource(map);
          addPavedRoadsLayer(map);
          addPrivateRoadsLayer(map);
          
          // Load water icon first, then add water points layer
          map.loadImage('/icons/glass-water-droplet-duotone-thin.png', (error, image) => {
            if (error) throw error;
            if (!map.hasImage('water-icon')) {
              map.addImage('water-icon', image);
              addWaterPointsSource(map);
              addWaterPointsLayer(map);
              updateWaterPointsLayer(map, overlayStates['water-points']);
            }
          });
          
          // Then update their visibility
          updateGravelRoadsLayer(map, overlayStates['gravel-roads']);
          updateBikeInfraLayer(map, overlayStates['bike-infrastructure']);
          updateWaterPointsLayer(map, overlayStates['water-points']);
          updateUnknownSurfaceLayer(map, overlayStates['unknown-surface']);
          updatePrivateRoadsLayer(map, overlayStates['private-roads']);
        });
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

export default function MapView(props: MapViewProps) {
return <MapViewInner {...props} />
}