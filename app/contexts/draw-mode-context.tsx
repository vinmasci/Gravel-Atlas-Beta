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

const DrawModeContext = createContext<UseDrawModeReturn>(defaultDrawModeValue);

export const useDrawModeContext = () => {
  const context = useContext(DrawModeContext);
  return context || defaultDrawModeValue;
};

interface DrawModeProviderProps {
  children: React.ReactNode;
  map: mapboxgl.Map | null;
}

export const DrawModeProvider: React.FC<DrawModeProviderProps> = ({ children, map }) => {
  const [isReady, setIsReady] = React.useState(false);
  const drawMode = useDrawMode(map);  // Remove the conditional here

  React.useEffect(() => {
    if (map && map.isStyleLoaded()) {
      setIsReady(true);
    } else if (map) {
      const handleStyleLoad = () => {
        setIsReady(true);
      };
      map.once('style.load', handleStyleLoad);
      return () => {
        map.off('style.load', handleStyleLoad);
      };
    }
  }, [map]);

  // Only provide the drawMode when everything is ready
  const value = React.useMemo(() => 
    isReady ? drawMode : defaultDrawModeValue
  , [isReady, drawMode]);

  return (
    <DrawModeContext.Provider value={value || defaultDrawModeValue}>
      {children}
    </DrawModeContext.Provider>
  );
};