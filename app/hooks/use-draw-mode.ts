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
  // [Keep existing implementation]
};

function resampleLineEvery100m(map: mapboxgl.Map, coordinates: [number, number][]): ResampledPoint[] {
  // [Keep existing implementation]
}

function calculatePointDistances(points: [number, number, number][]) {
  // [Keep existing implementation]
}

function smoothElevationData(points: ElevationPoint[], windowSize: number = 2): ElevationPoint[] {
  // [Keep existing implementation]
}

function mapSurfaceType(surface: string): 'paved' | 'unpaved' | 'unknown' {
  // [Keep existing implementation]
}

function calculateGrades(points: ElevationPoint[], minDistance: number = 0.05): number[] {
  // [Keep existing implementation]
}

async function getElevation(coordinates: [number, number][], signal?: AbortSignal): Promise<[number, number, number][]> {
  // [Keep existing implementation]
}

export const useDrawMode = (map: Map | null) => {
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
const initializeLayers = useCallback(() => {
  console.log('=== initializeLayers entry ===', {
    mapExists: !!map,
    isStyleLoaded: map?.isStyleLoaded(),
    existingRefs: layerRefs.current,
    timestamp: new Date().toISOString()
  });

  if (!map) {
    console.log('❌ Cannot initialize - no map');
    return;
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
    console.error('❌ Error in initializeLayers:', error);
    console.log('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to be caught by caller
  }
}, [map]);

// Initialize drawing mode
useEffect(() => {
  if (!map) return;

  const checkAndInitialize = () => {
    if (!map.isStyleLoaded()) {
      map.once('style.load', checkAndInitialize);
      return;
    }

    try {
      initializeLayers();
      setInitialized(true);
    } catch (e) {
      console.error('Error during initialization:', e);
    }
  };

  checkAndInitialize();

  return () => {
    if (map && layerRefs.current.drawing) {
      try {
        map.removeLayer(`${layerRefs.current.drawing}-dashes`);
        map.removeLayer(layerRefs.current.drawing);
        map.removeLayer(`${layerRefs.current.drawing}-stroke`);
        map.removeSource(layerRefs.current.drawing);
      } catch (e) {
        console.error('Error cleaning up drawing layers:', e);
      }
    }
  };
}, [map, initializeLayers]);

// [Keep your existing snapToNearestRoad implementation]
const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<{coordinates: [number, number][], roadInfo?: any}> => {
  // [Keep existing implementation]
};

// [Keep your existing handleClick implementation]
const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
  // [Keep existing implementation]
}, [map, isDrawing, drawnCoordinates, elevationProfile, snapToRoad, clickPoints, segments]);

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
    map.getCanvas().style.cursor = 'crosshair';
    
    console.log('Initializing new layers');
    initializeLayers();
    
    console.log('✅ Drawing mode setup completed');

  } catch (error) {
    console.error('❌ Fatal error in startDrawing:', error);
    // Reset state on error
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
  }
}, [map, initializeLayers]);

// [Keep your existing undoLastPoint implementation]
const undoLastPoint = useCallback(() => {
  // [Keep existing implementation]
}, [map, segments, clickPoints]);

// [Keep your existing finishDrawing implementation]
const finishDrawing = useCallback(() => {
  // [Keep existing implementation]
}, [map, isDrawing, drawnCoordinates, roadStats]);

// [Keep your existing clearDrawing implementation]
const clearDrawing = useCallback(() => {
  // [Keep existing implementation]
}, [map]);

// [Keep your existing handleHover implementation]
const handleHover = useCallback((point: HoverPoint | null) => {
  // [Keep existing implementation]
}, [map]);

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