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
  console.log('=== DrawModeProvider Render ===', {
    hasMap: !!map,
    isInitialized,
    timestamp: new Date().toISOString()
  });

  const drawMode = useDrawMode(map);
  
  console.log('=== DrawMode Hook Result ===', {
    hasDrawMode: !!drawMode,
    methods: {
      hasStartDrawing: !!drawMode.startDrawing,
      hasHandleClick: !!drawMode.handleClick
    },
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!map) {
      setIsInitialized(false);
      return;
    }

    const checkInit = () => {
      if (map.isStyleLoaded()) {
        setIsInitialized(true);
        return true;
      }
      return false;
    };

    // Try to initialize immediately
    if (!checkInit()) {
      const handleStyleLoad = () => {
        checkInit();
      };
      
      map.on('style.load', handleStyleLoad);
      return () => {
        map.off('style.load', handleStyleLoad);
      };
    }
  }, [map]);

  const contextValue = {
    isInitialized,
    drawMode: isInitialized ? drawMode : defaultDrawModeValue
  };

  return (
    <DrawModeContext.Provider value={contextValue}>
      {children}
    </DrawModeContext.Provider>
  );
};