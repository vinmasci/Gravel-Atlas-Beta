// components/mobile-sidebar.tsx
import { useState } from 'react';
import { Search, Layers, Map, Navigation, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MobileSidebar({ onLayerToggle, onLocationClick, onZoomIn, onZoomOut, ...props }) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {/* Search Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-lg">
            <Search className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[40vh]">
          {/* Search content */}
        </SheetContent>
      </Sheet>
  
      {/* Layers Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="secondary" className="bg-background/80 backdrop-blur-sm shadow-lg">
            <Layers className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh]">
          {/* Layers content */}
        </SheetContent>
      </Sheet>
  
      {/* Zoom buttons and location */}
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