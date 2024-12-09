// components/map-view.tsx
'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl';
import { Loader } from '@googlemaps/js-api-loader';
import 'mapbox-gl/dist/mapbox-gl.css';
import { updatePhotoLayer } from '@/lib/photo-layer';
import { MapSidebar } from './map-sidebar';
import { MAP_STYLES } from '@/app/constants/map-styles';
import type { MapStyle } from '@/app/types/map';
import { addMapillaryLayers } from '@/lib/mapillary';
import { CustomAlert } from './ui/custom-alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Search, Layers, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Initialize Google Maps loader
const googleLoader = new Loader({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  version: 'weekly',
  libraries: ['maps', 'places']
});

const LoadingSpinner = () => (
  <div className="absolute top-4 right-4 z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
  </div>
);

interface MobileControlsProps {
  onSearch: (query: string) => void;
  onLocationClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayerToggle: (layerId: string) => void;
  selectedStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  overlayStates: Record<string, boolean>;
  mapillaryVisible: boolean;
}

const MobileControls = ({
  onSearch,
  onLocationClick,
  onZoomIn,
  onZoomOut,
  onLayerToggle,
  selectedStyle,
  onStyleChange,
  overlayStates,
  mapillaryVisible
}: MobileControlsProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {/* Search control */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-background/80 backdrop-blur-sm shadow-lg"
          >
            <Search className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[40vh]">
          <form onSubmit={handleSearch} className="flex gap-2 p-4">
            <Input
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Layers control */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-background/80 backdrop-blur-sm shadow-lg"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] pt-8">
          <div className="space-y-6 p-4">
            <div>
              <h3 className="font-medium mb-4">Map Style</h3>
              <RadioGroup
                value={selectedStyle}
                onValueChange={(value) => onStyleChange(value as MapStyle)}
                className="space-y-2"
              >
                {Object.values(MAP_STYLES).map((style) => (
                  <div key={style.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={style.id} id={`mobile-${style.id}`} />
                    <label htmlFor={`mobile-${style.id}`}>{style.title}</label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <h3 className="font-medium mb-4">Map Overlays</h3>
              <div className="space-y-3">
                {[
                  { id: 'segments', label: 'Segments' },
                  { id: 'photos', label: 'Photos' },
                  { id: 'gravel-roads', label: 'Gravel / Unpaved Roads' },
                  { id: 'asphalt-roads', label: 'Asphalt / Paved Roads' },
                  { id: 'speed-limits', label: 'Speed Limits' },
                  { id: 'private-roads', label: 'Private Access Roads' },
                  { id: 'mapillary', label: 'Mapillary' }
                ].map((overlay) => (
                  <div key={overlay.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`mobile-${overlay.id}`}
                      className="h-4 w-4"
                      checked={overlay.id === 'mapillary' ? mapillaryVisible : overlayStates[overlay.id]}
                      onChange={() => onLayerToggle(overlay.id)}
                      disabled={overlay.id === 'mapillary' && MAP_STYLES[selectedStyle].type === 'google'}
                    />
                    <label 
                      htmlFor={`mobile-${overlay.id}`}
                      className={
                        overlay.id === 'mapillary' && MAP_STYLES[selectedStyle].type === 'google'
                          ? 'text-muted-foreground'
                          : ''
                      }
                    >
                      {overlay.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Zoom and navigation controls */}
      <Button
        size="icon"
        variant="secondary"
        onClick={onZoomIn}
        className="bg-background/80 backdrop-blur-sm shadow-lg"
      >
        <span className="text-lg font-bold">+</span>
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        onClick={onZoomOut}
        className="bg-background/80 backdrop-blur-sm shadow-lg"
      >
        <span className="text-lg font-bold">−</span>
      </Button>

      <Button
        size="icon"
        variant="secondary"
        onClick={onLocationClick}
        className="bg-background/80 backdrop-blur-sm shadow-lg"
      >
        <Navigation className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function MapView() {
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const googleMap = useRef<google.maps.Map | null>(null);
  const mapRef = useRef<any>(null);
  const styleTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [selectedStyle, setSelectedStyle] = useState<MapStyle>('mapbox');
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Add the new useEffect here
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.error('Mapbox token is missing');
    }
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
    }
    if (!process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY) {
      console.error('Thunderforest API key is missing');
    }
  }, []);

  const [viewState, setViewState] = useState({
    longitude: 144.9631,
    latitude: -37.8136,
    zoom: 10
  });

  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [mapillaryVisible, setMapillaryVisible] = useState(false);
  const [overlayStates, setOverlayStates] = useState({
    segments: false,
    photos: false,
    'gravel-roads': false,
    'asphalt-roads': false,
    'speed-limits': false,
    'private-roads': false,
    mapillary: false
  });

  const [layers] = useState([
    { id: 'gravel-roads', name: 'Gravel Roads', visible: true },
    { id: 'water-points', name: 'Water Points', visible: true },
    { id: 'campsites', name: 'Campsites', visible: false },
  ]);

    // ADD THIS EFFECT HERE
    useEffect(() => {
      googleLoader.load().then(() => {
        setIsGoogleLoaded(true);
      }).catch((error) => {
        console.error('Error loading Google Maps:', error);
      });
    }, []);  

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    if (savedSidebarState !== null) {
      setIsOpen(savedSidebarState === 'true');
    }
  }, []);

  // Handle sidebar toggle with localStorage
  const handleSidebarToggle = (newState: boolean) => {
    setIsOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        handleSidebarToggle(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Map container styles based on sidebar state and device
  const mapContainerStyle = isOpen && !isMobile ? {
    width: 'calc(100% - 320px)',
    height: '100%',
    marginLeft: '320px',
    transition: 'all 0.3s ease-in-out'
  } : {
    width: '100%',
    height: '100%',
    marginLeft: '0',
    transition: 'all 0.3s ease-in-out'
  };

  const initializeOverlays = useCallback((map: mapboxgl.Map) => {
    if (overlayStates.mapillary && !MAP_STYLES[selectedStyle].type.includes('google')) {
      try {
        addMapillaryLayers(map);
        map.setLayoutProperty('mapillary-sequences', 'visibility', 'visible');
        map.setLayoutProperty('mapillary-images', 'visibility', 'visible');
        setMapillaryVisible(true);
      } catch (error) {
        console.error('Error initializing Mapillary layer:', error);
      }
    }
  }, [overlayStates, selectedStyle]);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim() || !isGoogleLoaded) return;

    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newPosition = {
          latitude: location.lat(),
          longitude: location.lng(),
          zoom: 14
        };
        
        setViewState(newPosition);

        if (googleMap.current) {
          googleMap.current.setCenter(location);
          googleMap.current.setZoom(14);
        }

        if (mapRef.current) {
          mapRef.current.getMap().flyTo({
            center: [location.lng(), location.lat()],
            zoom: 14
          });
        }
      } else {
        console.error('Geocode was not successful:', status);
      }
    });
  }, [isGoogleLoaded]);

  const handleLocationClick = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 14
          };
          setViewState(newPosition);

          if (googleMap.current) {
            googleMap.current.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            googleMap.current.setZoom(14);
          }

          if (mapRef.current) {
            mapRef.current.getMap().flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 14
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min((viewState.zoom || 0) + 1, 20);
    setViewState(prev => ({
      ...prev,
      zoom: newZoom
    }));

    if (googleMap.current) {
      googleMap.current.setZoom(newZoom);
    }

    if (mapRef.current) {
      mapRef.current.getMap().zoomTo(newZoom);
    }
  }, [viewState.zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max((viewState.zoom || 0) - 1, 1);
    setViewState(prev => ({
      ...prev,
      zoom: newZoom
    }));

    if (googleMap.current) {
      googleMap.current.setZoom(newZoom);
    }

    if (mapRef.current) {
      mapRef.current.getMap().zoomTo(newZoom);
    }
  }, [viewState.zoom]);

  const handleLayerToggle = useCallback((layerId: string) => {
    if (layerId === 'photos') {
      setOverlayStates(prev => {
        const newState = { ...prev, photos: !prev.photos };
        const map = mapRef.current?.getMap();
        if (map && !MAP_STYLES[selectedStyle].type.includes('google')) {
          updatePhotoLayer(map, newState.photos)
            .catch(error => console.error('Error updating photo layer:', error));
        }
        return newState;
      });
    } else if (layerId === 'mapillary') {
      if (MAP_STYLES[selectedStyle].type === 'google') {
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        return;
      }

      setMapillaryVisible(prev => {
        const newVisibility = !prev;
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          const visibility = newVisibility ? 'visible' : 'none';
          
          try {
            if (map.getLayer('mapillary-sequences')) {
              map.setLayoutProperty('mapillary-sequences', 'visibility', visibility);
              map.setLayoutProperty('mapillary-images', 'visibility', visibility);
            } else if (newVisibility) {
              addMapillaryLayers(map);
            }
          } catch (error) {
            console.error('Error toggling Mapillary layers:', error);
          }
        }
        
        setOverlayStates(prev => ({
          ...prev,
          mapillary: newVisibility
        }));
        
        return newVisibility;
      });
    } else {
      setOverlayStates(prev => ({
        ...prev,
        [layerId]: !prev[layerId]
      }));
    }
  }, [selectedStyle]);

  const handleStyleChange = useCallback((newStyle: MapStyle) => {
    if (styleTimeout.current) {
      clearTimeout(styleTimeout.current);
    }

    setIsLoading(true);

    styleTimeout.current = setTimeout(() => {
      if (googleMap.current && MAP_STYLES[selectedStyle].type === 'google') {
        googleMap.current = null;
        if (mapContainer.current) {
          mapContainer.current.innerHTML = '';
        }
      }

      setSelectedStyle(newStyle);
      
      if (MAP_STYLES[newStyle].type === 'google') {
        setMapillaryVisible(false);
        setOverlayStates(prev => ({
          ...prev,
          mapillary: false
        }));
      } else {
        const map = mapRef.current?.getMap();
        if (map) {
          map.once('style.load', () => {
            initializeOverlays(map);
          });
        }
      }

      setTimeout(() => setIsLoading(false), 500);
    }, 300);
  }, [selectedStyle, initializeOverlays]);

  useEffect(() => {
    if (MAP_STYLES[selectedStyle].type === 'google' && isGoogleLoaded && mapContainer.current) {
      googleMap.current = new google.maps.Map(mapContainer.current, {
        center: { lat: viewState.latitude, lng: viewState.longitude },
        zoom: viewState.zoom,
        mapTypeId: MAP_STYLES[selectedStyle].style
      });
    }
  }, [selectedStyle, isGoogleLoaded, viewState, mapContainer]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map && !MAP_STYLES[selectedStyle].type.includes('google')) {
      map.once('style.load', () => {
        updatePhotoLayer(map, overlayStates.photos)
          .catch(error => console.error('Error updating photo layer:', error));
      });
    }
  }, [selectedStyle]);

  if (MAP_STYLES[selectedStyle].type === 'google') {
    return (
      <div className="w-full h-full relative">
        <div ref={mapContainer} style={mapContainerStyle} />
        {isLoading && <LoadingSpinner />}
        {showAlert && (
          <CustomAlert message="Mapillary overlay is not available with Google Maps layers" />
        )}
        {isMobile ? (
          <MobileControls
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLayerToggle={handleLayerToggle}
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
            overlayStates={overlayStates}
            mapillaryVisible={mapillaryVisible}
          />
        ) : (
          <MapSidebar
            isOpen={isOpen}
            setIsOpen={handleSidebarToggle}
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            availableLayers={layers}
            onLayerToggle={handleLayerToggle}
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
            mapillaryVisible={mapillaryVisible}
            overlayStates={overlayStates}
          />
        )}
      </div>
    );
  }

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
/>
      {isLoading && <LoadingSpinner />}
      {showAlert && (
        <CustomAlert message="Mapillary overlay is not available with Google Maps layers" />
      )}
      
      {isMobile ? (
        <MobileControls
          onSearch={handleSearch}
          onLocationClick={handleLocationClick}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLayerToggle={handleLayerToggle}
          selectedStyle={selectedStyle}
          onStyleChange={handleStyleChange}
          overlayStates={overlayStates}
          mapillaryVisible={mapillaryVisible}
        />
      ) : (
        <MapSidebar
          isOpen={isOpen}
          setIsOpen={handleSidebarToggle}
          onSearch={handleSearch}
          onLocationClick={handleLocationClick}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          availableLayers={layers}
          onLayerToggle={handleLayerToggle}
          selectedStyle={selectedStyle}
          onStyleChange={handleStyleChange}
          mapillaryVisible={mapillaryVisible}
          overlayStates={overlayStates}
        />
      )}
    </div>
  );
}