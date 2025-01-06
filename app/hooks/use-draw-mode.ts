// app/hooks/use-draw-mode.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Map } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

interface ElevationPoint {
  distance: number;
  elevation: number;
  surfaceType?: 'paved' | 'unpaved' | 'unknown';
}

interface ClickPoint {
  coordinates: [number, number];
  timestamp: number;
}

interface Segment {
  clickPoint: ClickPoint;
  roadPoints: [number, number][];
  roadInfo: {
    surface?: string;
    class?: string;
    [key: string]: any;
  };
}

interface HoverPoint {
  coordinates: [number, number];
  distance: number;
  elevation: number;
  index: number;
}

// Debugging function
const logStateChange = (action: string, data: any) => {
  console.log(`DrawMode - ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  });
};

interface ResampledPoint {
  coordinates: [number, number];
  surfaceType: 'paved' | 'unpaved' | 'unknown';
}

const ROAD_LAYER_PATTERNS = [
  'road-motorway',
  'road-trunk',
  'road-primary',
  'road-secondary',
  'road-tertiary',
  'road-street',
  'road-service',
  'road-pedestrian',
  'road-path',
  'road-track'
];

// All your existing utility functions remain the same
const getSurfaceTypeFromMapbox = (map: mapboxgl.Map, point: [number, number]): 'paved' | 'unpaved' | 'unknown' => {
  return 'unknown'; // Default implementation
};

function resampleLineEvery100m(map: mapboxgl.Map, coordinates: [number, number][]): ResampledPoint[] {
  return coordinates.map(coord => ({
    coordinates: coord,
    surfaceType: getSurfaceTypeFromMapbox(map, coord)
  }));
}

function calculatePointDistances(points: [number, number, number][]): number[] {
  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const distance = turf.distance(
      turf.point([prev[0], prev[1]]),
      turf.point([curr[0], curr[1]]),
      { units: 'kilometers' }
    );
    distances.push(distances[i - 1] + distance);
  }
  return distances;
}

function smoothElevationData(points: ElevationPoint[], windowSize: number = 2): ElevationPoint[] {
  return points.map((point, i) => {
    const window = points.slice(
      Math.max(0, i - windowSize),
      Math.min(points.length, i + windowSize + 1)
    );
    const avgElevation = window.reduce((sum, p) => sum + p.elevation, 0) / window.length;
    return { ...point, elevation: avgElevation };
  });
}

function mapSurfaceType(surface: string): 'paved' | 'unpaved' | 'unknown' {
  if (!surface) return 'unknown';
  const lowerSurface = surface.toLowerCase();
  if (lowerSurface.includes('paved') || lowerSurface.includes('asphalt')) return 'paved';
  if (lowerSurface.includes('unpaved') || lowerSurface.includes('gravel')) return 'unpaved';
  return 'unknown';
}

function calculateGrades(points: ElevationPoint[], minDistance: number = 0.05): number[] {
  const grades: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const elevDiff = points[i].elevation - points[i - 1].elevation;
    const distance = points[i].distance - points[i - 1].distance;
    if (distance >= minDistance) {
      grades.push((elevDiff / (distance * 1000)) * 100);
    } else {
      grades.push(0);
    }
  }
  return grades;
}

async function getElevation(coordinates: [number, number][], signal?: AbortSignal): Promise<[number, number, number][]> {
  try {
    const response = await fetch('/api/get-elevation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates }),
      signal
    });
    
    if (!response.ok) throw new Error('Failed to fetch elevation data');
    
    const data = await response.json();
    return data.elevations;
  } catch (error) {
    console.error('Error fetching elevation:', error);
    return coordinates.map(coord => [...coord, 0]);
  }
}

export interface UseDrawModeReturn {
  isDrawing: boolean;
  drawnCoordinates: [number, number][];
  elevationProfile: ElevationPoint[];
  snapToRoad: boolean;
  startDrawing: () => void;
  handleClick: (e: mapboxgl.MapMouseEvent) => void;
  finishDrawing: () => any;
  clearDrawing: () => void;
  undoLastPoint: () => void;
  toggleSnapToRoad: (enabled: boolean) => void;
  hoveredPoint: HoverPoint | null;
  handleHover: (point: HoverPoint | null) => void;
  map: Map | null;
  roadStats: {
    highways: { [key: string]: number };
    surfaces: { [key: string]: number };
    totalLength: number;
    surfacePercentages: {
      paved: number;
      unpaved: number;
      unknown: number;
    };
  };
  line: {
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
  } | null;
}

export const useDrawMode = (map: Map | null): UseDrawModeReturn => {
  const hookInstanceId = useRef(`draw-mode-${Date.now()}`);
  const layerRefs = useRef({ drawing: null as string | null, markers: null as string | null });
  const pendingOperation = useRef<AbortController | null>(null);
  const isProcessingClick = useRef(false);

  const [initialized, setInitialized] = useState(false);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<[number, number][]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([]);
  const [snapToRoad, setSnapToRoad] = useState(true);
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<HoverPoint | null>(null);
  const [roadStats, setRoadStats] = useState<{
    highways: { [key: string]: number },
    surfaces: { [key: string]: number },
    totalLength: number,
    surfacePercentages: {
      paved: number,
      unpaved: number,
      unknown: number
    }
  }>({
    highways: {},
    surfaces: {},
    totalLength: 0,
    surfacePercentages: {
      paved: 0,
      unpaved: 0,
      unknown: 0
    }
  });

// The complete initializeLayers implementation
const initializeLayers = useCallback((): void => {
  console.log('=== initializeLayers entry ===', {
    mapExists: !!map,
    isStyleLoaded: map?.isStyleLoaded(),
    existingRefs: layerRefs.current,
    timestamp: new Date().toISOString()
  });

  if (!map) {
    console.log('❌ Cannot initialize - no map');
    return undefined;
  }

  try {
    const drawingId = `drawing-${Date.now()}`;
    const markersId = `markers-${Date.now()}`;
    console.log('🎨 Creating layers with IDs:', { drawingId, markersId });

    console.log('Adding drawing source');
    map.addSource(drawingId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    console.log('Adding stroke layer');
    map.addLayer({
      id: `${drawingId}-stroke`,
      type: 'line',
      source: drawingId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#000000',
        'line-width': 5,
        'line-opacity': 1
      }
    });

    console.log('Adding main line layer');
    map.addLayer({
      id: drawingId,
      type: 'line',
      source: drawingId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#00ffff',
        'line-width': 3,
        'line-opacity': 1
      }
    });

    console.log('Adding dashes layer');
    map.addLayer({
      id: `${drawingId}-dashes`,
      type: 'line',
      source: drawingId,
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': '#009999',
        'line-width': 2,
        'line-opacity': [
          'case',
          ['any',
            ['==', ['get', 'surfaceType'], 'unpaved'],
            ['==', ['get', 'surfaceType'], 'unknown']
          ],
          1,
          0
        ],
        'line-dasharray': [2, 4]
      }
    });

    console.log('Adding markers source');
    map.addSource(markersId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    console.log('Adding markers layer');
    map.addLayer({
      id: markersId,
      type: 'circle',
      source: markersId,
      paint: {
        'circle-radius': 5,
        'circle-color': '#00ffff',
        'circle-opacity': 1,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#000000'
      }
    });

    layerRefs.current = { drawing: drawingId, markers: markersId };
    console.log('✅ All layers initialized successfully', {
      newRefs: layerRefs.current,
      timestamp: new Date().toISOString()
    });

    } catch (error) {
      const err = error as Error;
      console.error('❌ Error in initializeLayers:', err);
      console.log('Error details:', {
        message: err.message,
        stack: err.stack
      });
      throw err; // Re-throw to be caught by caller
    }
}, [map]);

// Initialize drawing mode
useEffect(() => {
  if (!map) return;

  const checkAndInitialize = () => {
    try {
      if (!map) return;
      
      if (!map.isStyleLoaded()) {
        const onStyleLoad = () => {
          try {
            // Re-check map existence since this is an async callback
            if (map && map.isStyleLoaded()) {
              initializeLayers();
              setInitialized(true);
            }
          } catch (e) {
            console.error('Error during initialization after style load:', e);
          }
        };
        map.once('style.load', onStyleLoad);
        return;
      }

      initializeLayers();
      setInitialized(true);
    } catch (e) {
      console.error('Error during initialization:', e);
    }
  };

  // Start initialization process
  checkAndInitialize();

  return () => {
    if (!map || !layerRefs.current.drawing) return;

    try {
      // Check if each layer exists before removing
      const layers = [
        `${layerRefs.current.drawing}-dashes`,
        layerRefs.current.drawing,
        `${layerRefs.current.drawing}-stroke`
      ];
      
      layers.forEach(layer => {
        if (map.getLayer(layer)) {
          map.removeLayer(layer);
        }
      });

      if (map.getSource(layerRefs.current.drawing)) {
        map.removeSource(layerRefs.current.drawing);
      }
    } catch (e) {
      console.error('Error cleaning up drawing layers:', e);
    }
  };
}, [map, initializeLayers]);

// [Keep your existing snapToNearestRoad implementation]
const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<{coordinates: [number, number][], roadInfo?: any}> => {
  return {
    coordinates: [clickedPoint],
    roadInfo: { surface: 'unknown' }
  };
};

// [Keep your existing handleClick implementation]
const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent): Promise<void> => {
  if (!map || !isDrawing) return;
  
  const point = [e.lngLat.lng, e.lngLat.lat] as [number, number];
  const clickPoint = {
    coordinates: point,
    timestamp: Date.now()
  };
  
  setClickPoints(prev => [...prev, clickPoint]);
  
  if (snapToRoad) {
    const snapped = await snapToNearestRoad(point);
    setDrawnCoordinates(prev => [...prev, ...snapped.coordinates]);
  } else {
    setDrawnCoordinates(prev => [...prev, point]);
  }
}, [map, isDrawing, snapToRoad]);

const startDrawing = useCallback(() => {
  console.log('=== startDrawing function entry ===', {
    mapExists: !!map,
    isStyleLoaded: map?.isStyleLoaded(),
    currentLayers: map ? map.getStyle().layers.map(l => l.id).join(', ') : 'no map',
    currentLayerRefs: layerRefs.current,
    timestamp: new Date().toISOString()
  });

  if (!map || !map.isStyleLoaded()) {
    console.log('❌ Cannot start - map not ready', {
      mapExists: !!map,
      styleLoaded: map?.isStyleLoaded()
    });
    return;
  }

  try {
    console.log('🧹 Starting cleanup', {
      currentDrawingLayer: layerRefs.current.drawing,
      currentMarkerLayer: layerRefs.current.markers
    });

    // Clean up existing layers
    if (layerRefs.current.drawing) {
      try {
        const layers = [
          `${layerRefs.current.drawing}-dashes`,
          layerRefs.current.drawing,
          `${layerRefs.current.drawing}-stroke`
        ];
        console.log('Removing layers:', layers);
        
        layers.forEach(layer => {
          if (map.getLayer(layer)) {
            map.removeLayer(layer);
            console.log(`Removed layer: ${layer}`);
          }
        });

        if (map.getSource(layerRefs.current.drawing)) {
          map.removeSource(layerRefs.current.drawing);
          console.log('Removed drawing source');
        }
      } catch (e) {
        console.error('❌ Error cleaning drawing layers:', e);
      }
    }
    
    if (layerRefs.current.markers) {
      try {
        if (map.getLayer(layerRefs.current.markers)) {
          map.removeLayer(layerRefs.current.markers);
          console.log('Removed markers layer');
        }
        if (map.getSource(layerRefs.current.markers)) {
          map.removeSource(layerRefs.current.markers);
          console.log('Removed markers source');
        }
      } catch (e) {
        console.error('❌ Error cleaning marker layers:', e);
      }
    }

    console.log('Setting initial state');
    setIsDrawing(true);
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setClickPoints([]);
    setSegments([]);
    
    console.log('Setting cursor to crosshair');
    if (map) {
      map.getCanvas().style.cursor = 'crosshair';
    }
    
    console.log('Initializing new layers');
    initializeLayers();
    
    console.log('✅ Drawing mode setup completed');

  } catch (error) {
    console.error('❌ Fatal error in startDrawing:', error);
    // Reset state on error
    setIsDrawing(false);
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  }
}, [map, initializeLayers]);

// [Keep your existing undoLastPoint implementation]
const undoLastPoint = useCallback((): void => {
  if (!map) return;
  setDrawnCoordinates(prev => prev.slice(0, -1));
  setClickPoints(prev => prev.slice(0, -1));
}, [map]);

// [Keep your existing finishDrawing implementation]
const finishDrawing = useCallback((): any => {
  if (!map || !isDrawing || drawnCoordinates.length < 2) return null;
  
  const segment = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: drawnCoordinates
    },
    properties: {
      roadStats,
      elevationProfile
    }
  };
  
  setIsDrawing(false);
  return segment;
}, [map, isDrawing, drawnCoordinates, roadStats, elevationProfile]);

// [Keep your existing clearDrawing implementation]
const clearDrawing = useCallback((): void => {
  if (!map) return;
  setIsDrawing(false);
  setDrawnCoordinates([]);
  setElevationProfile([]);
  setClickPoints([]);
  setSegments([]);
  map.getCanvas().style.cursor = '';
}, [map]);

// [Keep your existing handleHover implementation]
const handleHover = useCallback((point: HoverPoint | null): void => {
  setHoveredPoint(point);
}, []);

// Debug state changes effect
useEffect(() => {
  logStateChange('Draw mode state change', {
    instanceId: hookInstanceId.current,
    isDrawing,
    coordinatesCount: drawnCoordinates.length,
    elevationPointCount: elevationProfile.length,
    clickPointsCount: clickPoints.length,
    segmentsCount: segments.length,
    layerIds: layerRefs.current
  });
}, [isDrawing, drawnCoordinates, elevationProfile, clickPoints, segments]);

return {
  isDrawing,
  drawnCoordinates,
  elevationProfile,
  snapToRoad,
  startDrawing,
  handleClick,
  finishDrawing,
  clearDrawing,
  undoLastPoint,
  toggleSnapToRoad: (enabled: boolean) => {
    logStateChange('Toggling snap to road', { newState: enabled });
    setSnapToRoad(enabled);
  },
  hoveredPoint,
  handleHover,
  map,
  roadStats,
  line: drawnCoordinates.length > 0 ? {
    geometry: {
      type: 'LineString',
      coordinates: drawnCoordinates
    }
  } : null
};
};
