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

// Add this new interface right after them:
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

const getSurfaceTypeFromMapbox = (map: mapboxgl.Map, point: [number, number]): 'paved' | 'unpaved' | 'unknown' => {
  // Query the gravel roads layer first
  const gravelFeatures = map.queryRenderedFeatures(
    map.project(point as mapboxgl.LngLatLike),
    { layers: ['gravel_roads'] }  // Your gravel roads layer ID
  );

  if (gravelFeatures.length > 0) {
    return 'unpaved';
  }

  // Query standard road layers
  const roadFeatures = map.queryRenderedFeatures(
    map.project(point as mapboxgl.LngLatLike),
    { layers: ['road'] }  // Mapbox default road layer
  );

  if (roadFeatures.length > 0 && roadFeatures[0].properties?.surface) {
    return mapSurfaceType(roadFeatures[0].properties.surface);
  }

  return 'unknown';
};

function resampleLineEvery100m(map: mapboxgl.Map, coordinates: [number, number][]): ResampledPoint[] {
  if (coordinates.length < 2) return coordinates.map(coord => ({
    coordinates: coord,
    surfaceType: getSurfaceTypeFromMapbox(map, coord)
  }));
  
  // Create a line from the coordinates
  const line = turf.lineString(coordinates);
  
  // Get total length in kilometers
  const length = turf.length(line, {units: 'kilometers'});
  
  // Calculate how many points we need for 100m intervals
  const pointsCount = Math.floor(length * 10) + 1; // *10 because 1km = 10 points at 100m intervals
  
  if (pointsCount <= 1) return [{
    coordinates: coordinates[0],
    surfaceType: getSurfaceTypeFromMapbox(map, coordinates[0])
  }];

  // Create points at regular intervals
  const resampled: ResampledPoint[] = [];
  for (let i = 0; i < pointsCount; i++) {
    const point = turf.along(line, i * 0.1, {units: 'kilometers'}); // 0.1 km = 100m
    const coord = point.geometry.coordinates as [number, number];
    resampled.push({
      coordinates: coord,
      surfaceType: getSurfaceTypeFromMapbox(map, coord)
    });
  }
  
  // Always include the last point if it's not already included
  const lastOriginal = coordinates[coordinates.length - 1];
  const lastResampled = resampled[resampled.length - 1].coordinates;
  
  if (lastOriginal[0] !== lastResampled[0] || lastOriginal[1] !== lastResampled[1]) {
    resampled.push({
      coordinates: lastOriginal,
      surfaceType: getSurfaceTypeFromMapbox(map, lastOriginal)
    });
  }

  return resampled;
}

// Add this new function here
function calculatePointDistances(points: [number, number, number][]) {
  let distance = 0;
  return points.map((point, index, array) => {
    if (index === 0) return { distance: 0, elevation: point[2] };
    
    // Calculate distance from previous point
    const prevPoint = array[index - 1];
    const segmentDistance = turf.distance(
      turf.point([prevPoint[0], prevPoint[1]]),
      turf.point([point[0], point[1]]),
      { units: 'kilometers' }
    );
    
    distance += segmentDistance;
    return {
      distance: distance,
      elevation: point[2]
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
  // Paved surfaces
  const pavedSurfaces = [
    'paved', 'asphalt', 'concrete', 'paving_stones', 'sett',
    'cobblestone', 'metal', 'wood', 'concrete:plates'
  ];
  
  // Unpaved surfaces
  const unpavedSurfaces = [
    'unpaved', 'compacted', 'fine_gravel', 'gravel', 'dirt',
    'earth', 'ground', 'grass', 'mud', 'sand', 'woodchips'
  ];

  if (!surface) return 'unknown';
  if (pavedSurfaces.includes(surface.toLowerCase())) return 'paved';
  if (unpavedSurfaces.includes(surface.toLowerCase())) return 'unpaved';
  return 'unknown';
}

function calculateGrades(points: ElevationPoint[], minDistance: number = 0.05): number[] {  // reduced from 0.1 to 0.05
  // Calculate grades over minimum distance (50m = 0.05km)
  const grades: number[] = [];
  
  for (let i = 0; i < points.length; i++) {
      // Find next point that's at least minDistance away
      let j = i + 1;
      while (j < points.length && (points[j].distance - points[i].distance) < minDistance) {
          j++;
      }
      
      if (j < points.length) {
          const distance = points[j].distance - points[i].distance;
          const elevationChange = points[j].elevation - points[i].elevation;
          // Calculate grade as percentage
          const grade = (elevationChange / (distance * 1000)) * 100;
          grades.push(grade);
      } else {
          // For last points where we can't get full distance, use previous grade
          grades.push(grades.length > 0 ? grades[grades.length - 1] : 0);
      }
  }
  
  return grades;
}

async function getElevation(coordinates: [number, number][]): Promise<[number, number, number][]> {
    logStateChange('getElevation called', { coordinates });
    
    if (coordinates.length === 0) {
        return [];
    }

    try {
        const response = await fetch('/api/get-elevation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ coordinates }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        logStateChange('Elevation data received', { data });
        
        // Log the actual elevation values for debugging
        console.log('Elevation values:', {
            coordinates: data.coordinates,
            elevations: data.coordinates.map(([,,e]: [number, number, number]) => e)
        });
        
        return data.coordinates;
    } catch (error) {
        console.error('Error fetching elevation:', error);
        // Return original coordinates with 0 elevation if there's an error
        return coordinates.map(([lng, lat]) => [lng, lat, 0] as [number, number, number]);
    }
}

export const useDrawMode = (map: Map | null) => {
  const hookInstanceId = useRef(`draw-mode-${Date.now()}`);
  logStateChange('Hook initialized', { 
    instanceId: hookInstanceId.current,
    mapExists: !!map 
  });

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

// 3. White dash pattern for unpaved sections
map.addLayer({
  id: `${drawingId}-dashes`,
  type: 'line',
  source: drawingId,
  layout: {
    'line-cap': 'butt',  // Changed to butt for crisper dashes
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
    'line-dasharray': [2, 4]  // Adjusted for better visibility
  }
});

// Clean up layers in the clearDrawing function
if (layerRefs.current.drawing) {
  map.removeLayer(`${layerRefs.current.drawing}-dashes`);  // Remove dashes layer
  map.removeLayer(layerRefs.current.drawing);             // Remove main layer
  map.removeLayer(`${layerRefs.current.drawing}-stroke`); // Remove stroke layer
  map.removeSource(layerRefs.current.drawing);
}
// Add map hover handlers
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

  if (minDistance < 0.0001) { // About 10 meters at the equator
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
  }, [map]);

  const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    logStateChange('Click event received', {
      isDrawing,
      mapExists: !!map,
      layerExists: !!layerRefs.current.drawing,
      isProcessing: isProcessingClick.current,
      coordinates: [e.lngLat.lng, e.lngLat.lat]
    });
  
    if (!isDrawing || !map || !layerRefs.current.drawing || isProcessingClick.current) {
      logStateChange('Click event ignored', {
        reason: !isDrawing ? 'not drawing' : !map ? 'no map' : !layerRefs.current.drawing ? 'no layer' : 'processing'
      });
      return;
    }
  
    if (pendingOperation.current) {
      logStateChange('Aborting pending operation');
      pendingOperation.current.abort();
    }
  
    isProcessingClick.current = true;
    const controller = new AbortController();
    pendingOperation.current = controller;
  
    try {
      const clickedPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const previousPoint = drawnCoordinates.length > 0 
        ? drawnCoordinates[drawnCoordinates.length - 1] 
        : undefined;
  
      // Create click point
      const newClickPoint = { 
        coordinates: clickedPoint,
        timestamp: Date.now()
      };
  
// Get snapped points and road info
const { coordinates: newPoints, roadInfo } = await snapToNearestRoad(clickedPoint, previousPoint);
console.log('Road Info received:', roadInfo);
logStateChange('Points snapped', { originalPoint: clickedPoint, snappedPoints: newPoints });

// Calculate segment length and update road stats
let segmentLength = 0;
if (newPoints.length >= 2) {
  try {
    const lineString = turf.lineString(newPoints);
    segmentLength = turf.length(lineString, { units: 'kilometers' });
  } catch (error) {
    console.error('Error calculating segment length:', error);
  }
}

// Determine surface type from road info
const surfaceType = roadInfo?.surface ? mapSurfaceType(roadInfo.surface) : 'unknown';

setRoadStats(prev => {
  const newSurfaces = { ...prev.surfaces };
  
  // Update surface lengths
  if (segmentLength > 0) {
    newSurfaces[surfaceType] = (newSurfaces[surfaceType] || 0) + segmentLength;
  }

  const totalLength = Object.values(newSurfaces).reduce((sum, len) => sum + len, 0);
  
  // Calculate percentages
  const pavedLength = newSurfaces['paved'] || 0;
  const unpavedLength = newSurfaces['unpaved'] || 0;
  const unknownLength = newSurfaces['unknown'] || 0;

  return {
    ...prev,
    surfaces: newSurfaces,
    totalLength: totalLength,
    surfacePercentages: {
      paved: totalLength > 0 ? (pavedLength / totalLength) * 100 : 0,
      unpaved: totalLength > 0 ? (unpavedLength / totalLength) * 100 : 0,
      unknown: totalLength > 0 ? (unknownLength / totalLength) * 100 : 0
    }
  };
});

// Resample points to 100m intervals with surface types
const resampledData = resampleLineEvery100m(map, newPoints);
const resampledPoints = resampledData.map(point => point.coordinates);
const resampledSurfaceTypes = resampledData.map(point => point.surfaceType);

logStateChange('Points resampled', { 
    originalCount: newPoints.length, 
    resampledCount: resampledPoints.length 
});

const elevationData = await getElevation(resampledPoints);
      logStateChange('Elevation data received', { elevationData });
      
// Create new segment
const newSegment: Segment = {
  clickPoint: newClickPoint,
  roadPoints: newPoints,
  roadInfo: roadInfo || {}  // Add this line
};
      
      // Process elevation data
      let newElevationPoints;
      let grades: number[] = [];
      
// AFTER - Remove duplicate smoothing and distance calculations
if (resampledPoints.length >= 2) {
  // Convert elevation data to [lon, lat, elev] format
  const pointsWithElevation = elevationData.map(point => [
    point[0],
    point[1],
    point[2]
  ] as [number, number, number]);

  // Calculate elevation points with actual distances
  newElevationPoints = calculatePointDistances(pointsWithElevation);

  // Smooth elevation data (only once)
  newElevationPoints = smoothElevationData(newElevationPoints, 2);
  
  // Calculate grades
  grades = calculateGrades(newElevationPoints);
        grades = calculateGrades(newElevationPoints);
      } else {
        // Handle single point case
        newElevationPoints = [{
          distance: 0,
          elevation: elevationData[0][2]
        }];
      }
      
if (resampledPoints.length >= 2) {
  // Convert elevation data to [lon, lat, elev] format
  const pointsWithElevation = elevationData.map(point => [
    point[0],
    point[1],
    point[2]
  ] as [number, number, number]);

  // Calculate elevation points with actual distances
  newElevationPoints = calculatePointDistances(pointsWithElevation);

  // Smooth elevation data
  newElevationPoints = smoothElevationData(newElevationPoints);
  
  // Calculate grades with minimum distance
  grades = calculateGrades(newElevationPoints);

        // Smooth elevation data
        newElevationPoints = smoothElevationData(newElevationPoints);
        
        // Calculate grades with minimum distance
        grades = calculateGrades(newElevationPoints);
        
        // Filter out unrealistic grades (anything over 25% or under -25%)
        const filteredGrades = grades.filter(g => Math.abs(g) <= 25);
        
        // Update max/min grades
        const maxGrade = filteredGrades.length > 0 ? 
          Math.max(...filteredGrades) : 0;
        const minGrade = filteredGrades.length > 0 ? 
          Math.min(...filteredGrades) : 0;
        
        logStateChange('Grade calculations', { 
          maxGrade, 
          minGrade, 
          pointCount: newElevationPoints.length 
        });

} else {
  // Handle single point case
  newElevationPoints = elevationData.map((point) => ({
    distance: 0,
    elevation: point[2]
  }));
}
  
// Calculate total distance from the last elevation point
const totalDistance = newElevationPoints[newElevationPoints.length - 1]?.distance || 0;

logStateChange('New elevation points calculated', {
  newPoints: newElevationPoints,
  totalDistance,
  pointCount: newElevationPoints.length
});
  
      // Update state with new segment
      setSegments(prev => {
        const newSegments = [...prev, newSegment];
        logStateChange('Segments updated', { 
          previousCount: prev.length,
          newCount: newSegments.length 
        });
        return newSegments;
      });
  
      setClickPoints(prev => {
        const newClickPoints = [...prev, newClickPoint];
        logStateChange('Click points updated', {
          previousCount: prev.length,
          newCount: newClickPoints.length
        });
        return newClickPoints;
      });
  
// Update drawn coordinates
let allCoordinates: [number, number][];
if (drawnCoordinates.length === 0) {
    // First point
    allCoordinates = [newPoints[0]];
} else {
    // Get all coordinates except the last one from the previous set
    const previousCoordinates = drawnCoordinates.slice(0, -1);
    
    // Add all points from the new segment
    allCoordinates = [...previousCoordinates, ...newPoints];
}
setDrawnCoordinates(allCoordinates);

// Update map sources
const lineSource = map.getSource(layerRefs.current.drawing) as mapboxgl.GeoJSONSource;
const markerSource = map.getSource(layerRefs.current.markers) as mapboxgl.GeoJSONSource;

if (lineSource && markerSource) {
  // Get existing segments from state
  const currentSegments = segments;
  
  // Map all segments to features
  const features = currentSegments.map(segment => ({
    type: 'Feature',
    properties: {
      surfaceType: segment.roadInfo?.surface ? mapSurfaceType(segment.roadInfo.surface) : 'unknown'
    },
    geometry: {
      type: 'LineString',
      coordinates: segment.roadPoints
    }
  }));

  // Add the new segment as a separate feature
  features.push({
    type: 'Feature',
    properties: {
      surfaceType: surfaceType
    },
    geometry: {
      type: 'LineString',
      coordinates: newPoints
    }
  });

  // Update the source with all features
  lineSource.setData({
    type: 'FeatureCollection',
    features: features
  });
  
  // Add the current drawing segment if it exists
  if (newPoints.length > 0) {
    features.push({
      type: 'Feature',
      properties: {
        surfaceType: surfaceType
      },
      geometry: {
        type: 'LineString',
        coordinates: newPoints
      }
    });
  }
  
  lineSource.setData({
    type: 'FeatureCollection',
    features: features
  });
  
        markerSource.setData({
          type: 'FeatureCollection',
          features: [...clickPoints, newClickPoint].map(point => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: point.coordinates
            },
            properties: {
              timestamp: point.timestamp
            }
          }))
        });
  
        setElevationProfile(prev => {
          // Get the last distance from previous profile
          const lastDistance = prev.length > 0 ? prev[prev.length - 1].distance : 0;
          
          // Adjust new points to continue from last distance
          const adjustedNewPoints = newElevationPoints.map((point, index) => {
            // Query surface type at this point's coordinates
            const surfaceInfo = map.queryRenderedFeatures(
              map.project([resampledPoints[index][0], resampledPoints[index][1]]),
              { layers: ['road', 'gravel_roads'] }  // Include your road layers
            )[0];
        
            const surfaceType = surfaceInfo?.properties?.surface ? 
              mapSurfaceType(surfaceInfo.properties.surface) : 
              'unknown';
        
            return {
              distance: lastDistance + point.distance,
              elevation: point.elevation,
              surfaceType: surfaceType
            };
          });
        
          const newProfile = [...prev, ...adjustedNewPoints];
          
          return newProfile;
        });
      } // Make sure this closing brace is here
      
          } catch (error) {
            if (error.name !== 'AbortError') {
              console.error('Error processing click:', error);
              logStateChange('Click processing error', { error });
            }
          } finally {
            isProcessingClick.current = false;
            pendingOperation.current = null;
            logStateChange('Click processing complete');
          }
        }, [map, isDrawing, drawnCoordinates, elevationProfile, snapToRoad, clickPoints, segments]);

  const startDrawing = useCallback(() => {
    logStateChange('Starting drawing mode', { mapExists: !!map });
    if (!map) return;
    
    setIsDrawing(true);
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setClickPoints([]);
    setSegments([]);
    
    map.getCanvas().style.cursor = 'crosshair';
    initializeLayers();
    logStateChange('Drawing mode started');
  }, [map, initializeLayers]);

  const undoLastPoint = useCallback(() => {
    logStateChange('Undoing last point', {
      mapExists: !!map,
      layerExists: !!layerRefs.current.drawing,
      segmentsCount: segments.length
    });
  
    if (!map || !layerRefs.current.drawing || segments.length === 0) return;
  
    // Remove the last segment
    const updatedSegments = segments.slice(0, -1);
    const newClickPoints = clickPoints.slice(0, -1);
    
    const lineSource = map.getSource(layerRefs.current.drawing) as mapboxgl.GeoJSONSource;
    const markerSource = map.getSource(layerRefs.current.markers) as mapboxgl.GeoJSONSource;
  
    if (lineSource && markerSource) {
      // Create features from remaining segments
      const features = updatedSegments.map(segment => ({
        type: 'Feature',
        properties: {
          surfaceType: segment.roadInfo?.surface ? mapSurfaceType(segment.roadInfo.surface) : 'unknown'
        },
        geometry: {
          type: 'LineString',
          coordinates: segment.roadPoints
        }
      }));
  
      lineSource.setData({
        type: 'FeatureCollection',
        features: features
      });
  
      markerSource.setData({
        type: 'FeatureCollection',
        features: newClickPoints.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: point.coordinates
          },
          properties: {
            timestamp: point.timestamp
          }
        }))
      });
  
      setSegments(updatedSegments);
      setClickPoints(newClickPoints);
      setDrawnCoordinates(updatedSegments.flatMap(segment => segment.roadPoints));
      setElevationProfile(prev => {
        const newProfile = prev.slice(0, -1);
        logStateChange('Elevation profile updated after undo', {
          previousCount: prev.length,
          newCount: newProfile.length
        });
        return newProfile;
      });
    }
  }, [map, segments, clickPoints]);

// AFTER - in use-draw-mode.ts
const finishDrawing = useCallback(() => {
  logStateChange('Finishing drawing', {
    mapExists: !!map,
    isDrawing,
    coordinatesCount: drawnCoordinates.length
  });

  if (!map || !isDrawing || drawnCoordinates.length < 2) {
    logStateChange('Cannot finish drawing', {
      reason: !map ? 'no map' : !isDrawing ? 'not drawing' : 'insufficient coordinates'
    });
    return null;
  }

  setIsDrawing(false);
  map.getCanvas().style.cursor = '';

  const result = {
    type: 'Feature' as const,
    properties: {
      // Add surface types based on road stats percentages
      surfaceTypes: roadStats.surfacePercentages.unpaved > 50 ? ['unpaved'] :
                   roadStats.surfacePercentages.paved > 50 ? ['paved'] :
                   ['unknown']
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: drawnCoordinates
    }
  };

  return result;
}, [map, isDrawing, drawnCoordinates, roadStats]); // Add roadStats to dependencies

  const clearDrawing = useCallback(() => {
    logStateChange('Clearing drawing', {
      mapExists: !!map,
      layersExist: {
        drawing: !!layerRefs.current.drawing,
        markers: !!layerRefs.current.markers
      }
    });
  
    if (!map) return;
    
    if (pendingOperation.current) {
      logStateChange('Aborting pending operation');
      pendingOperation.current.abort();
    }
  
    if (layerRefs.current.drawing) {
      map.removeLayer(`${layerRefs.current.drawing}-stroke`); // Remove stroke layer
      map.removeLayer(layerRefs.current.drawing);            // Remove main line layer
      map.removeSource(layerRefs.current.drawing);
    }
  
    if (layerRefs.current.markers) {
      map.removeLayer(layerRefs.current.markers);
      map.removeSource(layerRefs.current.markers);
    }
  
    layerRefs.current = { drawing: null, markers: null };
    
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setClickPoints([]);
    setSegments([]);
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
  
    logStateChange('Drawing cleared', {
      isDrawing: false,
      coordinatesCount: 0,
      elevationPointCount: 0
    });
  }, [map]);

  // Effect to debug state changes
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

  // Add this new function right after that useEffect and before the return:
  const handleHover = useCallback((point: HoverPoint | null) => {
    setHoveredPoint(point);
    
    if (!map || !point) {
      const existingMarker = document.getElementById('hover-point-marker');
      if (existingMarker) existingMarker.remove();
      return;
    }

    // Create or update hover marker
    let marker = document.getElementById('hover-point-marker');
    if (!marker) {
      marker = document.createElement('div');
      marker.id = 'hover-point-marker';
      marker.style.width = '12px';
      marker.style.height = '12px';
      marker.style.backgroundColor = '#009999'; // Darker cyan
      marker.style.border = '2px solid black';
      marker.style.borderRadius = '50%';
      marker.style.position = 'absolute';
      marker.style.transform = 'translate(-50%, -50%)';
      marker.style.pointerEvents = 'none';
      marker.style.zIndex = '1000';
      map.getCanvasContainer().appendChild(marker);
    }

    const projectedPoint = map.project(point.coordinates);
    marker.style.left = `${projectedPoint.x}px`;
    marker.style.top = `${projectedPoint.y}px`;
  }, [map]);

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
    roadStats,  // Add this line
    line: drawnCoordinates.length > 0 ? {
      geometry: {
        type: 'LineString',
        coordinates: drawnCoordinates
      }
    } : null
  };
};