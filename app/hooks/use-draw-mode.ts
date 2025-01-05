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
  logStateChange('Initializing layers', { mapExists: !!map });
  if (!map) return;

  // Clean up existing layers
  if (layerRefs.current.drawing) {
    try {
      map.removeLayer(`${layerRefs.current.drawing}-dashes`);
      map.removeLayer(layerRefs.current.drawing);
      map.removeLayer(`${layerRefs.current.drawing}-stroke`);
      map.removeSource(layerRefs.current.drawing);
    } catch (e) {
      console.error('Error cleaning up drawing layers:', e);
    }
  }
  if (layerRefs.current.markers) {
    try {
      map.removeLayer(layerRefs.current.markers);
      map.removeSource(layerRefs.current.markers);
    } catch (e) {
      console.error('Error cleaning up markers:', e);
    }
  }

  try {
    // Create new layers with unique IDs
    const drawingId = `drawing-${Date.now()}`;
    const markersId = `markers-${Date.now()}`;
    logStateChange('Creating new layers', { drawingId, markersId });

    // Add drawing layer
    map.addSource(drawingId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // 1. Bottom black stroke layer
    map.addLayer({
      id: `${drawingId}-stroke`,
      type: 'line',
      source: drawingId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#000000',
        'line-width': 5,
        'line-opacity': 1
      }
    });

    // 2. Middle cyan line layer
    map.addLayer({
      id: drawingId,
      type: 'line',
      source: drawingId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#00ffff',
        'line-width': 3,
        'line-opacity': 1
      }
    });

    // 3. Dash pattern for unpaved sections
    map.addLayer({
      id: `${drawingId}-dashes`,
      type: 'line',
      source: drawingId,
      layout: {
        'line-cap': 'butt',
        'line-join': 'round'
      },
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

    // Add hover handlers
    map.on('mousemove', drawingId, (e) => {
      if (!e.features?.[0]) return;

      const coordinates = e.lngLat.toArray() as [number, number];
      const allCoords = drawnCoordinates;
      let minDistance = Infinity;
      let closestIndex = 0;

      allCoords.forEach((coord, index) => {
        const dist = turf.distance(
          turf.point(coord),
          turf.point(coordinates)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      });

      if (minDistance < 0.0001) {
        handleHover({
          coordinates: allCoords[closestIndex],
          distance: elevationProfile[closestIndex]?.distance || 0,
          elevation: elevationProfile[closestIndex]?.elevation || 0,
          index: closestIndex
        });
      }
    });

    map.on('mouseleave', drawingId, () => {
      handleHover(null);
    });

    // Add markers layer
    map.addSource(markersId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

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
    logStateChange('Layers initialized', layerRefs.current);
  } catch (error) {
    console.error('Error initializing layers:', error);
  }
}, [map, drawnCoordinates, elevationProfile]);

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
  console.log('=== startDrawing called ===', {
    mapExists: !!map,
    isStyleLoaded: map?.isStyleLoaded(),
    currentLayers: map ? map.getStyle().layers.map(l => l.id).join(', ') : 'no map',
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
    // Log before cleanup
    console.log('🧹 Starting cleanup. Current layer refs:', {
      drawing: layerRefs.current.drawing,
      markers: layerRefs.current.markers,
      timestamp: new Date().toISOString()
    });

    // Clean up existing layers
    if (layerRefs.current.drawing) {
      try {
        map.removeLayer(`${layerRefs.current.drawing}-dashes`);
        map.removeLayer(layerRefs.current.drawing);
        map.removeLayer(`${layerRefs.current.drawing}-stroke`);
        map.removeSource(layerRefs.current.drawing);
        console.log('✅ Successfully cleaned up drawing layers');
      } catch (e) {
        console.error('❌ Error cleaning drawing layers:', e);
      }
    }
    
    if (layerRefs.current.markers) {
      try {
        map.removeLayer(layerRefs.current.markers);
        map.removeSource(layerRefs.current.markers);
        console.log('✅ Successfully cleaned up marker layers');
      } catch (e) {
        console.error('❌ Error cleaning marker layers:', e);
      }
    }

    // Create new layers
    const drawingId = `drawing-${Date.now()}`;
    const markersId = `markers-${Date.now()}`;
    
    console.log('🎨 Creating new layers:', { drawingId, markersId });

    try {
      // Initialize layers
      setIsDrawing(true);
      setDrawnCoordinates([]);
      setElevationProfile([]);
      setClickPoints([]);
      setSegments([]);
      
      map.getCanvas().style.cursor = 'crosshair';
      initializeLayers();
      
      console.log('✅ Drawing mode initialized successfully', {
        drawingId,
        markersId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in layer initialization:', error);
    }
  } catch (error) {
    console.error('❌ Error in startDrawing:', error);
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