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

function resampleLineEvery100m(coordinates: [number, number][]): [number, number][] {
  if (coordinates.length < 2) return coordinates;
  
  // Create a line from the coordinates
  const line = turf.lineString(coordinates);
  
  // Get total length in kilometers
  const length = turf.length(line, {units: 'kilometers'});
  
  // Calculate how many points we need for 100m intervals
  const pointsCount = Math.floor(length * 10) + 1; // *10 because 1km = 10 points at 100m intervals
  
  if (pointsCount <= 1) return coordinates;

  // Create points at regular intervals
  const resampled = [];
  for (let i = 0; i < pointsCount; i++) {
      const point = turf.along(line, i * 0.1, {units: 'kilometers'}); // 0.1 km = 100m
      resampled.push(point.geometry.coordinates as [number, number]);
  }
  
  // Always include the last point if it's not already included
  const lastOriginal = coordinates[coordinates.length - 1];
  const lastResampled = resampled[resampled.length - 1];
  
  if (lastOriginal[0] !== lastResampled[0] || lastOriginal[1] !== lastResampled[1]) {
      resampled.push(lastOriginal);
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

function smoothElevationData(points: ElevationPoint[], windowSize: number = 3): ElevationPoint[] {  // reduced from 5 to 3
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
    logStateChange('Snapping to road', {
      clickedPoint,
      previousPoint,
      snapEnabled: snapToRoad
    });

    if (!snapToRoad) return { coordinates: [clickedPoint] };

    try {
        if (!previousPoint) {
            logStateChange('Snapping single point');
            const response = await fetch(
                `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${clickedPoint[0]},${clickedPoint[1]}.json?layers=road&radius=10&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const snappedPoint = feature.geometry.coordinates as [number, number];
                return {
                    coordinates: [snappedPoint],
                    roadInfo: feature.properties
                };
            }
            return { coordinates: [clickedPoint] };
        }

        logStateChange('Snapping line segment');
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${previousPoint[0]},${previousPoint[1]};${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
            const snappedPoints = data.routes[0].geometry.coordinates as [number, number][];
            
            // Get road info for the middle point of the snapped segment
            const midPoint = snappedPoints[Math.floor(snappedPoints.length / 2)];
            const tileQueryResponse = await fetch(
                `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${midPoint[0]},${midPoint[1]}.json?layers=road&radius=10&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            
            const tileData = await tileQueryResponse.json();
            const roadInfo = tileData.features?.[0]?.properties || {};

            return {
                coordinates: snappedPoints,
                roadInfo
            };
        }
        
        return { coordinates: [clickedPoint] };
    } catch (error) {
        console.error('Error snapping to road:', error);
        return { coordinates: [clickedPoint] };
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
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: [] }
  }
});

map.addLayer({
  id: `${drawingId}-stroke`,  // stroke layer (goes first/underneath)
  type: 'line',
  source: drawingId,
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 
    'line-color': '#000000',  // black stroke
    'line-width': 5,  // slightly wider than main line
    'line-opacity': 1
  }
});

map.addLayer({
  id: drawingId,  // main cyan line (goes on top of stroke)
  type: 'line',
  source: drawingId,
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 
    'line-color': '#00ffff',  // cyan main line
    'line-width': 3,
    'line-opacity': 1
  }
});

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
  
      // Get snapped points first
// NEW CODE
      // Get snapped points and road info
      const { coordinates: newPoints, roadInfo } = await snapToNearestRoad(clickedPoint, previousPoint);
      logStateChange('Points snapped', { originalPoint: clickedPoint, snappedPoints: newPoints });

      // If we have road info, show the popup
      if (roadInfo && map) {
          const popup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false,
              className: 'road-info-popup'
          });

          const popupContent = document.createElement('div');
          popupContent.className = 'px-2 py-1 space-y-1';
          
          const content = `
              <div class="text-sm space-y-1">
                  ${roadInfo.name ? `<div><strong>Name:</strong> ${roadInfo.name}</div>` : ''}
                  ${roadInfo.class ? `<div><strong>Type:</strong> ${roadInfo.class}</div>` : ''}
                  ${roadInfo.surface ? `<div><strong>Surface:</strong> ${roadInfo.surface}</div>` : ''}
                  ${roadInfo.access ? `<div><strong>Access:</strong> ${roadInfo.access}</div>` : ''}
              </div>
          `;
          
          popupContent.innerHTML = content;

          // Show popup at the clicked point
          popup.setLngLat(clickedPoint)
               .setDOMContent(popupContent)
               .addTo(map);

          // Remove popup after 3 seconds
          setTimeout(() => {
              popup.remove();
          }, 3000);
      }

      // Resample points to 100m intervals
      const resampledPoints = resampleLineEvery100m(newPoints);
      logStateChange('Points resampled', { 
          originalCount: newPoints.length, 
          resampledCount: resampledPoints.length 
      });

      const elevationData = await getElevation(resampledPoints);
      logStateChange('Elevation data received', { elevationData });
      
      // Create new segment
      const newSegment: Segment = {
        clickPoint: newClickPoint,
        roadPoints: newPoints
      };
      
      // Process elevation data
      let newElevationPoints;
      let grades: number[] = [];
      
      if (resampledPoints.length >= 2) {
        // Convert elevation data to points with elevation
        const pointsWithElevation = elevationData.map(point => ({
          coordinates: [point[0], point[1]] as [number, number],
          elevation: point[2]
        }));
      
        // Calculate distances and create elevation points
        let distance = 0;
        newElevationPoints = pointsWithElevation.map((point, index, array) => {
          if (index === 0) return { distance: 0, elevation: point.elevation };
          
          const prevPoint = array[index - 1];
          const segmentDistance = turf.distance(
            turf.point(prevPoint.coordinates),
            turf.point(point.coordinates),
            { units: 'kilometers' }
          );
          
          distance += segmentDistance;
          return {
            distance,
            elevation: point.elevation
          };
        });
      
        // Smooth the elevation data
        newElevationPoints = smoothElevationData(newElevationPoints);
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
  
// Update drawn coordinates with elevation data
const allCoordinates = [...drawnCoordinates, ...elevationData];
setDrawnCoordinates(allCoordinates);

// Update map sources
const lineSource = map.getSource(layerRefs.current.drawing) as mapboxgl.GeoJSONSource;
const markerSource = map.getSource(layerRefs.current.markers) as mapboxgl.GeoJSONSource;

if (lineSource && markerSource) {
  lineSource.setData({
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: allCoordinates // This will now include elevation data
    }
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
          
          // Add debugging
          console.log('Updating elevation profile:', {
            prevLength: prev.length,
            newPointsLength: newElevationPoints.length,
            lastDistance,
            firstNewPoint: newElevationPoints[0],
            lastPrevPoint: prev[prev.length - 1]
          });
          
          // Adjust new points to continue from last distance
          const adjustedNewPoints = newElevationPoints.map(point => ({
            distance: lastDistance + point.distance,
            elevation: point.elevation
          }));
        
          const newProfile = [...prev, ...adjustedNewPoints];
          
          logStateChange('Elevation profile updated', {
            previousCount: prev.length,
            newCount: newProfile.length,
            lastDistance,
            firstNewDistance: adjustedNewPoints[0]?.distance,
            elevationRange: newProfile.map(p => p.elevation)
          });
          
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
    const newSegments = segments.slice(0, -1);
    const newClickPoints = clickPoints.slice(0, -1);
    
    // Reconstruct coordinates
    const newCoordinates = newSegments.flatMap(segment => segment.roadPoints);
    
    const lineSource = map.getSource(layerRefs.current.drawing) as mapboxgl.GeoJSONSource;
    const markerSource = map.getSource(layerRefs.current.markers) as mapboxgl.GeoJSONSource;

    if (lineSource && markerSource) {
      lineSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: newCoordinates
        }
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

      setSegments(newSegments);
      setClickPoints(newClickPoints);
      setDrawnCoordinates(newCoordinates);
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
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: drawnCoordinates // This will now include the elevation data
      }
    };

    return result;
  }, [map, isDrawing, drawnCoordinates, elevationProfile]);

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
    line: drawnCoordinates.length > 0 ? {
      geometry: {
        type: 'LineString',
        coordinates: drawnCoordinates
      }
    } : null
  };
};