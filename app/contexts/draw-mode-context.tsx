// TO (replace with this entire file):
// app/contexts/draw-mode-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDrawMode } from '../hooks/use-draw-mode';
import type { UseDrawModeReturn } from '../hooks/use-draw-mode';

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

// TO (replace with this code):
useEffect(() => {
  let mounted = true;
  let checkInterval: NodeJS.Timeout | null = null;

  const initialize = () => {
    if (!mounted) return;
    
    console.log('🎯 Attempting initialization with:', {
      hasMap: !!map,
      styleLoaded: map?.isStyleLoaded?.(),
      timestamp: new Date().toISOString()
    });

    if (!map) {
      console.log('❌ No map available');
      setIsInitialized(false);
      return;
    }

    // Start checking for style loaded
    if (checkInterval) clearInterval(checkInterval);
    
    checkInterval = setInterval(() => {
      if (!mounted) return;
      
      console.log('🔄 Checking style loaded status:', {
        isLoaded: map.isStyleLoaded(),
        timestamp: new Date().toISOString()
      });

      if (map.isStyleLoaded()) {
        if (checkInterval) clearInterval(checkInterval);
        console.log('✅ Style loaded detected, initializing');
        setIsInitialized(true);
      }
    }, 100); // Check every 100ms
  };

  initialize();

  return () => {
    mounted = false;
    if (checkInterval) clearInterval(checkInterval);
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
    usingActualDrawMode: contextValue.drawMode !== defaultDrawModeValue,
    timestamp: new Date().toISOString()
  });

  return (
    <DrawModeContext.Provider value={contextValue}>
      {children}
    </DrawModeContext.Provider>
  );
};