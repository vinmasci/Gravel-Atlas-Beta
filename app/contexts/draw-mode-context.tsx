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
    const checkInit = () => {
      const isReady = !!map && map.isStyleLoaded();
      console.log('Checking initialization:', {
        hasMap: !!map,
        styleLoaded: map?.isStyleLoaded(),
        currentlyInitialized: isInitialized,
        shouldBeInitialized: isReady
      });
      
      if (isReady !== isInitialized) {
        console.log(`Setting initialized to ${isReady}`);
        setIsInitialized(isReady);
      }
    };

    // Check immediately
    checkInit();

    // Set up style.load listener if needed
    if (map && !map.isStyleLoaded()) {
      console.log('Setting up style.load listener');
      const handleStyleLoad = () => {
        console.log('Style loaded event received');
        checkInit();
      };
      
      map.on('style.load', handleStyleLoad);
      return () => {
        map.off('style.load', handleStyleLoad);
      };
    }
  }, [map, isInitialized]);

  const contextValue = {
    isInitialized: !!map && map.isStyleLoaded(), // Important change here
    drawMode: (!!map && map.isStyleLoaded()) ? drawMode : defaultDrawModeValue
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