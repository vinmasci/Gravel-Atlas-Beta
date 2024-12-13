'use client';

import { createContext, useContext } from 'react';
import type { Map } from 'mapbox-gl';

interface MapContextType {
  map: Map | null;
  setMap: (map: Map | null) => void;
}

export const MapContext = createContext<MapContextType>({
  map: null,
  setMap: () => {},
});

export const useMapContext = () => useContext(MapContext);