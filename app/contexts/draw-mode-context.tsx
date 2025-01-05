import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDrawMode } from '../../app/hooks/use-draw-mode';
import type { UseDrawModeReturn } from '../../app/hooks/use-draw-mode';

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

// First define a separate loading state type
interface DrawModeState {
  isInitialized: boolean;
  drawMode: UseDrawModeReturn;
}

const DrawModeContext = createContext<DrawModeState>({
  isInitialized: false,
  drawMode: defaultDrawModeValue
});

export const useDrawModeContext = () => {
  const { isInitialized, drawMode } = useContext(DrawModeContext);
  
  if (!isInitialized) {
    return defaultDrawModeValue;
  }
  
  return drawMode;
};

export const DrawModeProvider: React.FC<DrawModeProviderProps> = ({ children, map }) => {
  const [state, setState] = React.useState<DrawModeState>({
    isInitialized: false,
    drawMode: defaultDrawModeValue
  });

  const drawMode = useDrawMode(map);

  React.useEffect(() => {
    const checkAndInitialize = () => {
      if (map && map.isStyleLoaded()) {
        setState({
          isInitialized: true,
          drawMode: {
            ...defaultDrawModeValue,
            ...drawMode,
            map: map
          }
        });
        return true;
      }
      return false;
    };

    // Try to initialize immediately
    if (!checkAndInitialize() && map) {
      // If not ready, wait for style load
      const handleStyleLoad = () => {
        checkAndInitialize();
      };
      
      map.on('style.load', handleStyleLoad);
      
      return () => {
        map.off('style.load', handleStyleLoad);
      };
    }
  }, [map, drawMode]);

  return (
    <DrawModeContext.Provider value={state}>
      {children}
    </DrawModeContext.Provider>
  );
};