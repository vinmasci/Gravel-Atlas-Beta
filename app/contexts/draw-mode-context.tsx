// app/contexts/draw-mode-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDrawMode } from '../hooks/use-draw-mode';
import type { UseDrawModeReturn } from '../hooks/use-draw-mode';

// Create a default value that matches the shape of UseDrawModeReturn
const defaultDrawModeValue: UseDrawModeReturn = {
  isDrawing: false,
  drawnCoordinates: [],
  elevationProfile: [],
  snapToRoad: true,
  startDrawing: () => {},
  handleClick: () => {},
  finishDrawing: () => null,
  clearDrawing: () => {},
  undoLastPoint: () => {},
  toggleSnapToRoad: () => {},
  hoveredPoint: null,
  handleHover: () => {},
  map: null,
  roadStats: {
    highways: {},
    surfaces: {},
    totalLength: 0,
    surfacePercentages: {
      paved: 0,
      unpaved: 0,
      unknown: 0
    }
  },
  line: null
};

interface DrawModeContextValue {
  isInitialized: boolean;
  drawMode: UseDrawModeReturn;
}

const DrawModeContext = createContext<DrawModeContextValue>({
  isInitialized: false,
  drawMode: defaultDrawModeValue
});

export const useDrawModeContext = () => {
  const context = useContext(DrawModeContext);
  console.log('=== useDrawModeContext called ===', {
    contextExists: !!context,
    hasDrawMode: !!context?.drawMode,
    hasStartDrawing: !!context?.drawMode?.startDrawing,
    timestamp: new Date().toISOString()
  });
  
  if (context === undefined) {
    throw new Error('useDrawModeContext must be used within a DrawModeProvider');
  }
  return context.drawMode;
};

interface DrawModeProviderProps {
  children: React.ReactNode;
  map: mapboxgl.Map | null;
}

export const DrawModeProvider: React.FC<DrawModeProviderProps> = ({ children, map }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const drawMode = useDrawMode(map);

  useEffect(() => {
    if (!map) {
      console.log('No map instance available');
      setIsInitialized(false);
      return;
    }

    const initializeDrawMode = () => {
      console.log('Initializing draw mode:', {
        hasMap: !!map,
        styleLoaded: map.isStyleLoaded(),
        timestamp: new Date().toISOString()
      });

      if (!map.isStyleLoaded()) {
        console.log('Style not loaded, waiting for style.load event');
        map.once('style.load', initializeDrawMode);
        return;
      }

      try {
        // Ensure the map is fully interactive
        map.dragPan.enable();
        map.dragRotate.enable();
        
        setIsInitialized(true);
        console.log('Draw mode initialized successfully');
      } catch (error) {
        console.error('Error initializing draw mode:', error);
        setIsInitialized(false);
      }
    };

    // Start initialization
    initializeDrawMode();

    // Cleanup
    return () => {
      setIsInitialized(false);
    };
  }, [map]);

  const contextValue = {
    isInitialized,
    drawMode: isInitialized ? drawMode : defaultDrawModeValue
  };

  console.log('DrawModeProvider context:', {
    hasMap: !!map,
    styleLoaded: map?.isStyleLoaded(),
    isInitialized: contextValue.isInitialized,
    usingActualDrawMode: contextValue.drawMode !== defaultDrawModeValue
  });

  return (
    <DrawModeContext.Provider value={contextValue}>
      {children}
    </DrawModeContext.Provider>
  );
};
