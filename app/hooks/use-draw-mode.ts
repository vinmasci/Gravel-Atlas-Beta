// app/hooks/use-draw-mode.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Map } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

interface ElevationPoint {
  distance: number;
  elevation: number;
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
    
    distance += segmentDistance;
return {
  distance: distance,
  elevation: point[2],
  surfaceType: resampledSurfaceTypes[index]  // Use the surface type from resampled data
};
  });
}

function smoothElevationData(points: ElevationPoint[], windowSize: number = 2): ElevationPoint[] {  // reduced from 5 to 3
  if (points.length < windowSize) return points;
  
  return points.map((point, i) => {
      // Get surrounding points for averaging
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(points.length, start + windowSize);
      const window = points.slice(start, end);
      
      // Calculate average elevation for window
      const avgElevation = window.reduce((sum, p) => sum + p.elevation, 0) / window.length;
      
      return {
          distance: point.distance,
          elevation: avgElevation
      };
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
  
  // The RoadStats update in handleClick remains the same as you have it
  const layerRefs = useRef({ drawing: null as string | null, markers: null as string | null });
  const pendingOperation = useRef<AbortController | null>(null);
  const isProcessingClick = useRef(false);

  // Debug state changes
  useEffect(() => {
    logStateChange('State updated', {
      instanceId: hookInstanceId.current,
      isDrawing,
      coordinatesCount: drawnCoordinates.length,
      elevationPointCount: elevationProfile.length,
      snapToRoad,
      clickPointsCount: clickPoints.length,
      segmentsCount: segments.length
    });
  }, [isDrawing, drawnCoordinates, elevationProfile, snapToRoad, clickPoints, segments]);

  const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<{coordinates: [number, number][], roadInfo?: any}> => {
    console.log('Snapping to road:', { clickedPoint, previousPoint });

    if (!snapToRoad) return { coordinates: [clickedPoint] };

    try {
        // For single point snapping
        if (!previousPoint) {
            const response = await fetch(
                `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${clickedPoint[0]},${clickedPoint[1]}.json?layers=road&radius=10&limit=5&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            
            const data = await response.json();
            console.log('Single point snap response:', data);

            if (data.features && data.features.length > 0) {
                // Sort features by class priority and distance
                const sortedFeatures = data.features.sort((a: any, b: any) => {
                    // Define priority for road classes (higher number = higher priority)
                    const priority: { [key: string]: number } = {
                        cycleway: 10,    // Dedicated bike paths highest priority
                        path: 8,         // Mixed-use paths
                        tertiary: 7,     // Small roads often good for cycling
                        residential: 6,   // Residential streets
                        secondary: 5,     // Medium roads
                        primary: 4,       // Main roads
                        trunk: 3,         // Major roads
                        motorway: 1,      // Highways lowest priority
                        service: 2,       // Service roads low priority
                        track: 9         // Gravel/dirt tracks high priority for this use case
                    };
                    
                    const aPriority = priority[a.properties.class] || 0;
                    const bPriority = priority[b.properties.class] || 0;

                    // Also consider bicycle-specific properties
                    const aBikePriority = a.properties.bicycle === 'designated' ? 5 : 0;
                    const bBikePriority = b.properties.bicycle === 'designated' ? 5 : 0;
                    
                    // Combine base priority with bike priority
                    const aTotal = aPriority + aBikePriority;
                    const bTotal = bPriority + bBikePriority;
                    
                    // First sort by total priority, then by distance if priority is equal
                    if (aTotal !== bTotal) {
                        return bTotal - aTotal;
                    }
                    return a.properties.tilequery.distance - b.properties.tilequery.distance;
                });

                const feature = sortedFeatures[0];
                const snappedPoint = feature.geometry.coordinates as [number, number];
                return {
                    coordinates: [snappedPoint],
                    roadInfo: feature.properties
                };
            }
            return { coordinates: [clickedPoint] };
        }

        // For line segments, try profiles in priority order
        const profiles = ['cycling', 'driving', 'walking'];  // Changed order to prioritize cycling
        console.log('Trying profiles in order:', profiles);

        // Try each profile sequentially instead of in parallel
        let bestRoute = null;
        let bestRouteInfo = null;

        for (const profile of profiles) {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/${profile}/${previousPoint[0]},${previousPoint[1]};${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&overview=full&alternatives=true&continue_straight=true&exclude=ferry&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                // Calculate straight-line distance for comparison
                const straightLineDistance = turf.distance(
                    turf.point(previousPoint),
                    turf.point(clickedPoint),
                    { units: 'meters' }
                );

                // Score each alternative route
                data.routes.forEach((route: any) => {
                    const distance = route.distance;
                    const deviation = (distance - straightLineDistance) / straightLineDistance;
                    const pointDensity = route.geometry.coordinates.length / distance;

                    // Calculate base score
                    let score = deviation * 0.4 + (1 / pointDensity * 0.3) + (route.duration * 0.3);

                    // Apply profile bonuses
                    if (profile === 'cycling') score *= 0.7;  // 30% bonus for cycling routes
                    if (profile === 'driving') score *= 1.2;  // 20% penalty for driving routes
                    if (profile === 'walking') score *= 1.5;  // 50% penalty for walking routes

                    // Only consider routes that don't deviate too much
                    if (deviation < 0.5 && (!bestRoute || score < bestRoute.score)) {
                        bestRoute = { ...route, score };
                        bestRouteInfo = { profile };
                    }
                });

                // If we found a good cycling route, use it immediately
                if (profile === 'cycling' && bestRoute) {
                    break;
                }
            }
        }

        if (bestRoute) {
          const coordinates = bestRoute.geometry.coordinates;
          
          // Get road info for the middle point of the route
          const midPoint = coordinates[Math.floor(coordinates.length / 2)];
          const tileQueryResponse = await fetch(
              `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${midPoint[0]},${midPoint[1]}.json?layers=road&radius=5&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          
          const tileData = await tileQueryResponse.json();
          const roadInfo = tileData.features?.[0]?.properties || {};
      
          return {
              coordinates: coordinates,
              roadInfo: {
                  ...roadInfo,
                  profile: bestRouteInfo.profile
              }
          };
      }

        // Fall back to straight line if no good routes found
        return { coordinates: [previousPoint, clickedPoint] };

    } catch (error) {
        console.error('Error in snapToNearestRoad:', error);
        return { coordinates: [previousPoint, clickedPoint] };
    }
};

  const initializeLayers = useCallback(() => {
    logStateChange('Initializing layers', { mapExists: !!map });
    if (!map) return;

    // Clean up existing layers
    if (layerRefs.current.drawing) {
      map.removeLayer(layerRefs.current.drawing);
      map.removeLayer(`${layerRefs.current.drawing}-stroke`);
      map.removeSource(layerRefs.current.drawing);
    }
    if (layerRefs.current.markers) {
      logStateChange('Cleaning up existing markers layer');
      map.removeLayer(layerRefs.current.markers);
      map.removeSource(layerRefs.current.markers);
    }

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

    map.addLayer({
      id: drawingId,
      type: 'line',
      source: drawingId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#00ffff',
        'line-width': 3
      }
    });

    console.log('📍 Adding markers source and layer');
    // Add markers
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
        'circle-stroke-width': 2,
        'circle-stroke-color': '#000000'
      }
    });

    // Save references
    layerRefs.current = { drawing: drawingId, markers: markersId };
    console.log('✅ Layers initialized successfully:', {
      drawingId,
      markersId,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ Error in initializeLayers:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    // Don't throw, just log and return
    return;
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
    const currentMap = map;
    const currentDrawingLayer = layerRefs.current.drawing;
    
    if (!currentMap || !currentDrawingLayer) return;

    try {
      // Check if each layer exists before removing
      const layers = [
        `${currentDrawingLayer}-dashes`,
        currentDrawingLayer,
        `${currentDrawingLayer}-stroke`
      ];
      
      layers.forEach(layer => {
        if (currentMap.getLayer(layer)) {
          currentMap.removeLayer(layer);
        }
      });

      if (currentMap.getSource(currentDrawingLayer)) {
        currentMap.removeSource(currentDrawingLayer);
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
// Stable references for state access
const stateRef = useRef({
  isDrawing: false,
  snapToRoad: true,
  drawnCoordinates: [] as [number, number][]
});

// Keep state ref updated
useEffect(() => {
  stateRef.current = {
    isDrawing,
    snapToRoad,
    drawnCoordinates
  };
}, [isDrawing, snapToRoad, drawnCoordinates]);

const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent): Promise<void> => {
  // Create stable reference to current state values
  const currentState = stateRef.current;
  const currentLayerRefs = layerRefs.current;
  
  console.log('🖱️ Click handler called:', {
    hasMap: !!map,
    isDrawing: currentState.isDrawing,
    snapToRoad: currentState.snapToRoad,
    timestamp: new Date().toISOString()
  });

  if (!map || !currentState.isDrawing) {
    console.log('❌ Click handler aborted:', {
      reason: !map ? 'no map' : 'not drawing',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Prevent multiple simultaneous click processing
  if (isProcessingClick.current) {
    console.log('⏳ Already processing a click, skipping');
    return;
  }

  isProcessingClick.current = true;

  try {
    const point = [e.lngLat.lng, e.lngLat.lat] as [number, number];
    console.log('📍 Processing click at:', point);

    const clickPoint = {
      coordinates: point,
      timestamp: Date.now()
    };
    
    setClickPoints(prev => [...prev, clickPoint]);
    
    if (currentState.snapToRoad) {
      console.log('🔄 Snapping to road...');
      const snapped = await snapToNearestRoad(point);
      console.log('✅ Snapped coordinates:', snapped.coordinates);
      setDrawnCoordinates(prev => [...prev, ...snapped.coordinates]);
    } else {
      console.log('📌 Using exact click point');
      setDrawnCoordinates(prev => [...prev, point]);
    }

    // Update map layers
    if (currentLayerRefs.drawing) {
      const source = map.getSource(currentLayerRefs.drawing) as mapboxgl.GeoJSONSource;
      if (source) {
        const currentCoords = currentState.drawnCoordinates;
        source.setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [...currentCoords, point]
          },
          properties: {}
        });
      }
    }

  } catch (error) {
    console.error('❌ Error in click handler:', error);
  } finally {
    isProcessingClick.current = false;
  }
}, []); // No dependencies needed since we use refs

// TO (replace with this code):
const startDrawing = useCallback(() => {
  console.log('TESTING ENTRY POINT');  // Add this line first
  console.log('🔍 START: startDrawing function', {
    mapInstance: !!map,
    styleLoaded: map?.isStyleLoaded(),
    layerRefs: layerRefs.current,
  });

  try {
    if (!map || !map.isStyleLoaded()) {
      console.log('❌ Cannot start - map conditions not met:', {
        hasMap: !!map,
        styleLoaded: map?.isStyleLoaded()
      });
      return;
    }

    console.log('✅ Map conditions met, proceeding with initialization');

    // Skip cleanup if no existing layers
    if (layerRefs.current.drawing || layerRefs.current.markers) {
      console.log('🧹 Starting cleanup');
      
      if (layerRefs.current.drawing) {
        const layers = [
          `${layerRefs.current.drawing}-dashes`,
          layerRefs.current.drawing,
          `${layerRefs.current.drawing}-stroke`
        ];
        
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
      }
    
// TO (replace with this code):
if (layerRefs.current.markers) {
  if (map.getLayer(layerRefs.current.markers)) {
    map.removeLayer(layerRefs.current.markers);
  }
  if (map.getSource(layerRefs.current.markers)) {
    map.removeSource(layerRefs.current.markers);
  }
}
}

console.log('🎯 Just before setIsDrawing(true)');
    
// Initialize new state
setIsDrawing(true);
setDrawnCoordinates([]);
setElevationProfile([]);
setClickPoints([]);
setSegments([]);

// Set cursor
map.getCanvas().style.cursor = 'crosshair';

console.log('🎨 About to call initializeLayers');
// Initialize new layers
initializeLayers();

console.log('✅ Drawing mode setup completed successfully');

console.log('✅ Drawing mode setup completed');

} catch (error) {
console.error('❌ Error in startDrawing:', error);
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
