import React, { useState } from 'react'
import { cn } from "@/lib/utils"
import { Search, Layers, Map, Navigation, ChevronRight, ChevronLeft, Camera, Route, FileUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useUser } from '@auth0/nextjs-auth0/client'
import { useToast } from "@/app/hooks/use-toast"
import { PhotoUploadDialog } from '@/components/photo-upload-dialog'
import { DrawSegmentPanel } from '@/components/panels/draw-segment-panel'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { MAP_STYLES } from '@/app/constants/map-styles'
import type { MapStyle } from '@/app/types/map'

// Your existing interface remains the same
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch: (query: string) => void
  onLocationClick: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onLayerToggle: (layerId: string) => void
  selectedStyle: MapStyle
  onStyleChange: (style: MapStyle) => void
  availableLayers: Array<{ id: string; name: string; visible: boolean }>
  mapillaryVisible: boolean
  overlayStates: {
    segments: boolean
    photos: boolean
    'gravel-roads': boolean
    'asphalt-roads': boolean
    'speed-limits': boolean
    'private-roads': boolean
    mapillary: boolean
    [key: string]: boolean
  }
  className?: string
}

export function NavSidebar({
  className,
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
  ...props
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-14 flex h-[calc(100vh-3.5rem)]",
        className
      )}
      {...props}
    >
<div
  className={cn(
    "group/sidebar relative flex flex-col gap-4 p-4",
    "bg-background/100 dark:bg-background/100", // Reverted back to original
    "backdrop-blur-md",
    "border-r border-border/40",
    "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
    isCollapsed ? "w-16" : "w-80"
  )}
>
        {/* Toggle Button - Updated styling */}
        <Button
          variant="secondary" // Changed to secondary for better contrast
          size="icon"
          className={cn(
            "absolute -right-12 top-4 z-50",
            "bg-background/80 backdrop-blur-sm shadow-md", // Increased background opacity
            "hover:bg-accent hover:text-accent-foreground", // Added hover state
            "transition-transform duration-300 ease-in-out"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {!isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>

        <div className={cn(
          "flex flex-col gap-4 transition-all duration-300",
          isCollapsed ? "px-2" : ""
        )}>
          {/* Search Form */}
          {!isCollapsed ? (
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
<Button 
  type="submit" 
  size="icon"
  variant="secondary"
  className="min-w-[40px] min-h-[40px] p-0 flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
>
  <Search className="h-4 w-4" />
</Button>
            </form>
) : (
    <div className="flex justify-center">
<Button 
  variant="secondary"
  size="icon"
  onClick={() => setIsCollapsed(false)}
  className={cn(
    "min-w-[40px] min-h-[40px] p-0",
    "bg-background/80 backdrop-blur-sm",
    "hover:bg-accent hover:text-accent-foreground",
    "transition-colors duration-300 ease-in-out",
    "flex items-center justify-center"
  )}
>
  <Search className="h-4 w-4" />
</Button>
    </div>
        )}
        
        {/* Map Controls */}
        <div className={cn(
          "flex gap-2",
          isCollapsed ? "flex-col items-center" : "md:flex"
        )}>
          <Button 
            variant="ghost"
            size="icon" 
            onClick={onZoomIn}
            className={cn(
              "bg-background/80 backdrop-blur-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-300 ease-in-out"
            )}
          >
            <span className="text-lg font-bold">+</span>
          </Button>
          <Button 
            variant="secondary"
            size="icon" 
            onClick={onZoomOut}
            className={cn(
              "bg-background/80 backdrop-blur-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-300 ease-in-out"
            )}
          >
            <span className="text-lg font-bold">−</span>
          </Button>
          <Button 
            variant="secondary"
            size="icon" 
            onClick={onLocationClick}
            className={cn(
              "bg-background/80 backdrop-blur-sm",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors duration-300 ease-in-out"
            )}
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

          {/* Accordions or Icons */}
          {!isCollapsed ? (
            <Accordion type="multiple" className="w-full">
              {/* Map Layers */}
              <AccordionItem value="map-layers" className="border-none"> {/* Removed border */}
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Map Layers
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
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
              <AccordionItem value="map-overlays" className="border-none">
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Map Overlays
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <div className="space-y-2">
                    {[
                      { id: 'segments', label: 'Segments' },
                      { id: 'photos', label: 'Photos' },
                      { id: 'gravel-roads', label: 'Gravel / Unpaved Roads' },
                      { id: 'bike-infrastructure', label: 'Bike Infrastructure' },
                      { id: 'unknown-surface', label: 'Unknown Surface Roads' },
                      { id: 'private-roads', label: 'Private Access Roads' },
                      { id: 'asphalt-roads', label: 'Asphalt / Paved Roads' },
                      { id: 'speed-limits', label: 'Speed Limits' },
                      { id: 'mapillary', label: 'Mapillary' }
                    ].map((overlay) => (
                      <div key={overlay.id} className="flex items-center space-x-2 hover:bg-accent/50 rounded px-2 py-1 transition-colors">
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
              <AccordionItem value="pois" className="border-none">
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Points of Interest
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <div className="space-y-2">
                    {[
                      { id: 'water-points', label: 'Water Points' },
                      { id: 'campsites', label: 'Campsites' },
                      { id: 'supermarkets', label: 'Supermarkets' },
                      { id: 'cafes', label: 'Cafes' }
                    ].map((poi) => (
                      <div key={poi.id} className="flex items-center space-x-2 hover:bg-accent/50 rounded px-2 py-1 transition-colors">
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
              <AccordionItem value="upload-photo" className="border-none">
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <Button 
                    className="w-full hover:bg-accent hover:text-accent-foreground" 
                    variant="secondary"
                    onClick={() => {
                      if (!user) {
                        toast({
                          title: "Authentication Required",
                          description: "Please sign in to upload photos",
                          variant: "destructive",
                        })
                        window.location.href = '/api/auth/login'
                        return
                      }
                      setIsPhotoDialogOpen(true)
                    }}
                  >
                    Choose Photo
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Draw Segment */}
              <AccordionItem value="draw-segment" className="border-none">
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Draw Segment
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <DrawSegmentPanel />
                </AccordionContent>
              </AccordionItem>

              {/* Overlay GPX */}
              <AccordionItem value="overlay-gpx" className="border-none">
                <AccordionTrigger className="hover:bg-accent rounded-md px-2 py-3 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Overlay GPX
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <Button 
                    className="w-full hover:bg-accent hover:text-accent-foreground"
                    variant="secondary"
                  >
                    Upload GPX File
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
/* Icon Mode - Updated with hover states */
<div className="flex flex-col gap-3 items-center">
  {[
    { icon: <Map className="h-4 w-4" />, title: "Map Layers" },
    { icon: <Layers className="h-4 w-4" />, title: "Map Overlays" },
    { icon: <Map className="h-4 w-4" />, title: "Points of Interest" },
    { icon: <Camera className="h-4 w-4" />, title: "Upload Photo" },
    { icon: <Route className="h-4 w-4" />, title: "Draw Segment" },
    { icon: <FileUp className="h-4 w-4" />, title: "Overlay GPX" }
  ].map((item, index) => (
    <Button 
      key={index}
      variant="ghost"
      size="icon" 
      onClick={() => setIsCollapsed(false)} 
      title={item.title}
      className={cn(
        "bg-background/80 backdrop-blur-sm",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-300 ease-in-out"
      )}
    >
      {item.icon}
    </Button>
  ))}
</div>
          )}
        </div>
      </div>

      {/* Photo Upload Dialog */}
      <PhotoUploadDialog 
        open={isPhotoDialogOpen} 
        onOpenChange={setIsPhotoDialogOpen}
        onUploadComplete={() => {
          onLayerToggle('photos')
        }}
      />
    </div>
  )
}