import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [isReady, setIsReady] = React.useState(false);
  const drawMode = useDrawMode(isReady ? map : null);

  React.useEffect(() => {
    if (map && map.isStyleLoaded()) {
      setIsReady(true);
    } else if (map) {
      map.once('style.load', () => {
        setIsReady(true);
      });
    }
  }, [map]);

  return (
    <DrawModeContext.Provider value={drawMode}>
      {children}
    </DrawModeContext.Provider>
  );
};