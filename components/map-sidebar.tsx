// components/map-sidebar.tsx
'use client';

import React, { useState } from 'react';
import { Search, Layers, Map, Navigation, ChevronRight, ChevronLeft, Camera, Route, FileUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "../app/hooks/use-toast";
import { PhotoUploadDialog } from '../components/photo-upload-dialog';
import { DrawSegmentPanel } from '../components/panels/draw-segment-panel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { MAP_STYLES } from '../app/constants/map-styles';
import type { MapStyle } from '../app/types/map';

interface MapSidebarProps {
  onSearch: (query: string) => void;
  onLocationClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLayerToggle: (layerId: string) => void;
  selectedStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
  availableLayers: Array<{ id: string; name: string; visible: boolean }>;
  mapillaryVisible: boolean;
  overlayStates: {
    segments: boolean;
    photos: boolean;
    'gravel-roads': boolean;
    'asphalt-roads': boolean;
    'speed-limits': boolean;
    'private-roads': boolean;
    mapillary: boolean;
  };
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MapSidebar({
  onSearch,
  onLocationClick,
  onZoomIn,
  onZoomOut,
  onLayerToggle,
  selectedStyle,
  onStyleChange,
  availableLayers,
  mapillaryVisible,
  overlayStates,
  isOpen,
  setIsOpen
}: MapSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
<div 
  className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] transform transition-transform duration-300 ease-in-out z-40 ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`}
>
  {/* Toggle Button */}
  <Button
    variant="outline"
    size="icon"
    className="absolute -right-12 top-4 bg-background/40 backdrop-blur-sm z-50 shadow-md"
    onClick={() => setIsOpen(!isOpen)}
  >
    {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
  </Button>

  <div className="w-80 h-full flex flex-col p-4 overflow-y-auto bg-background/40 backdrop-blur-sm">
    {/* Search Section */}
    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
      <Input
        type="text"
        placeholder="Search location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 bg-background/60"
      />
      <Button type="submit" size="icon" className="bg-background/60">
        <Search className="h-4 w-4" />
      </Button>
    </form>

    {/* Map Controls */}
    <div className="hidden md:flex gap-2 mb-4">
      <Button variant="outline" size="icon" className="bg-background/60" onClick={onZoomIn}>
        <span className="text-lg font-bold">+</span>
      </Button>
      <Button variant="outline" size="icon" className="bg-background/60" onClick={onZoomOut}>
        <span className="text-lg font-bold">−</span>
      </Button>
      <Button variant="outline" size="icon" className="bg-background/60" onClick={onLocationClick}>
        <Navigation className="h-4 w-4" />
      </Button>
    </div>

    {/* Accordion Sections */}
    <Accordion type="multiple" className="w-full space-y-2 [&>*]:bg-transparent">
          {/* Map Layers */}
          <AccordionItem value="map-layers">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Map Layers
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={selectedStyle}
                onValueChange={(value) => onStyleChange(value as MapStyle)}
                className="space-y-2"
              >
                {Object.values(MAP_STYLES).map((style) => (
                  <div key={style.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={style.id} id={style.id} />
                    <label htmlFor={style.id}>{style.title}</label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Map Overlays */}
          <AccordionItem value="map-overlays">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Map Overlays
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {[
                  { id: 'segments', label: 'Segments' },
                  { id: 'photos', label: 'Photos' },
                  { id: 'gravel-roads', label: 'Gravel / Unpaved Roads' },
                  { id: 'bike-infrastructure', label: 'Bike Infrastructure' },  // Add this line
                  { id: 'unknown-surface', label: 'Unknown Surface Roads' },
                  { id: 'private-roads', label: 'Private Access Roads' },
                  { id: 'asphalt-roads', label: 'Asphalt / Paved Roads' },
                  { id: 'speed-limits', label: 'Speed Limits' },
                  { id: 'mapillary', label: 'Mapillary' }
                ].map((overlay) => (
                  <div key={overlay.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={overlay.id}
                      className="h-4 w-4"
                      checked={overlay.id === 'mapillary' ? mapillaryVisible : overlayStates[overlay.id]}
                      onChange={() => onLayerToggle(overlay.id)}
                      disabled={overlay.id === 'mapillary' && MAP_STYLES[selectedStyle].type === 'google'}
                    />
                    <label 
                      htmlFor={overlay.id}
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
            </AccordionContent>
          </AccordionItem>

          {/* Points of Interest */}
          <AccordionItem value="pois">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Points of Interest
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {[
                  { id: 'water-points', label: 'Water Points' },
                  { id: 'campsites', label: 'Campsites' },
                  { id: 'supermarkets', label: 'Supermarkets' },
                  { id: 'cafes', label: 'Cafes' }
                ].map((poi) => (
                  <div key={poi.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={poi.id}
                      className="h-4 w-4"
                      checked={overlayStates[poi.id] || false}
                      onChange={() => onLayerToggle(poi.id)}
                    />
                    <label htmlFor={poi.id}>{poi.label}</label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Upload Photo */}
          <AccordionItem value="upload-photo">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Upload Photo
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Button 
                className="w-full" 
                onClick={() => {
                  if (!user) {
                    toast({
                      title: "Authentication Required",
                      description: "Please sign in to upload photos",
                      variant: "destructive",
                    });
                    window.location.href = '/api/auth/login';
                    return;
                  }
                  setIsPhotoDialogOpen(true);
                }}
              >
                Choose Photo
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* Draw Segment */}
          <AccordionItem value="draw-segment">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Draw Segment
              </div>
            </AccordionTrigger>
            <AccordionContent>
  <DrawSegmentPanel />
</AccordionContent>
          </AccordionItem>

          {/* Overlay GPX */}
          <AccordionItem value="overlay-gpx">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Overlay GPX
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Button className="w-full">
                Upload GPX File
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog 
        open={isPhotoDialogOpen} 
        onOpenChange={setIsPhotoDialogOpen}
        onUploadComplete={() => {
          // Refresh the photos layer or markers if needed
          onLayerToggle('photos');
        }}
      />
    </div>
  );
}