import { createContext, useContext, useState, useEffect } from 'react';
import { useDrawMode } from '../../app/hooks/use-draw-mode';
import type { UseDrawModeReturn } from '../../app/hooks/use-draw-mode';

const DrawModeContext = createContext<UseDrawModeReturn | null>(null);

export const useDrawModeContext = () => {
  const context = useContext(DrawModeContext);
  if (!context) throw new Error('useDrawModeContext must be used within DrawModeProvider');
  return context;
};

interface DrawModeProviderProps {
  children: React.ReactNode;
  map: mapboxgl.Map | null;
}

export const DrawModeProvider: React.FC<DrawModeProviderProps> = ({ children, map }) => {
  const [mapReady, setMapReady] = useState(false);
  const drawMode = useDrawMode(map);

  useEffect(() => {
    if (!map) return;

    const checkMapStyle = () => {
      if (map.isStyleLoaded()) {
        setMapReady(true);
      } else {
        const handleStyleLoad = () => setMapReady(true);
        map.once('style.load', handleStyleLoad);
        return () => map.off('style.load', handleStyleLoad);
      }
    };

    checkMapStyle();
  }, [map]);

  // Don't render children until map style is loaded
  if (!mapReady) {
    return null;
  }

  return (
    <DrawModeContext.Provider value={drawMode}>
      {children}
    </DrawModeContext.Provider>
  );
};