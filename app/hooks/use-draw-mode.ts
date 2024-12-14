// app/hooks/use-draw-mode.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Map } from 'mapbox-gl';
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

// Debugging function
const logStateChange = (action: string, data: any) => {
  console.log(`DrawMode - ${action}:`, {
    timestamp: new Date().toISOString(),
    ...data
  });
};

async function getElevation(coordinates: [number, number][]): Promise<[number, number, number][]> {
    logStateChange('getElevation called', { coordinates });
    
    // If we have less than 2 coordinates, pad with a duplicate point
    if (coordinates.length < 2) {
        const point = coordinates[0];
        coordinates = point ? [point, point] : [[0,0], [0,0]];
        logStateChange('Padded coordinates', { paddedCoordinates: coordinates });
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
        return data.coordinates;
    } catch (error) {
        console.error('Error fetching elevation:', error);
        // Return original coordinates with 0 elevation if there's an error
        const fallbackData = coordinates.map(([lng, lat]) => [lng, lat, 0]);
        logStateChange('Using fallback elevation data', { fallbackData });
        return fallbackData;
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

  const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<[number, number][]> => {
    logStateChange('Snapping to road', {
      clickedPoint,
      previousPoint,
      snapEnabled: snapToRoad
    });

    if (!snapToRoad) return [clickedPoint];

    try {
        if (!previousPoint) {
            logStateChange('Snapping single point');
            const response = await fetch(
                `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${clickedPoint[0]},${clickedPoint[1]}.json?layers=road&radius=10&limit=1&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );
            
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const snappedPoint = data.features[0].geometry.coordinates as [number, number];
                logStateChange('Single point snapped', { original: clickedPoint, snapped: snappedPoint });
                return [snappedPoint];
            }
            return [clickedPoint];
        }

        logStateChange('Snapping line segment');
        const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${previousPoint[0]},${previousPoint[1]};${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
            const snappedPoints = data.routes[0].geometry.coordinates as [number, number][];
            logStateChange('Line segment snapped', {
                originalPoints: [previousPoint, clickedPoint],
                snappedPointCount: snappedPoints.length
            });
            return snappedPoints;
        }
        
        return [clickedPoint];
    } catch (error) {
        console.error('Error snapping to road:', error);
        return [clickedPoint];
    }
  };

  const initializeLayers = useCallback(() => {
    logStateChange('Initializing layers', { mapExists: !!map });
    if (!map) return;

    // Clean up existing layers
    if (layerRefs.current.drawing) {
      logStateChange('Cleaning up existing drawing layer');
      map.removeLayer(layerRefs.current.drawing);
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
      id: drawingId,
      type: 'line',
      source: drawingId,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ff0000', 'line-width': 3 }
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
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ff0000'
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
      const newPoints = await snapToNearestRoad(clickedPoint, previousPoint);
      logStateChange('Points snapped', { originalPoint: clickedPoint, snappedPoints: newPoints });
  
      // Get elevation for ALL snapped points
      const elevationData = await getElevation(newPoints);
      logStateChange('Elevation data received', { elevationData });
  
      // Create new segment
      const newSegment: Segment = {
        clickPoint: newClickPoint,
        roadPoints: newPoints
      };
  
      // Calculate new elevation profile with proper distances
      let totalDistance = elevationProfile.length > 0 
        ? elevationProfile[elevationProfile.length - 1].distance 
        : 0;
  
      const newElevationPoints = elevationData.map((point, i) => {
        // Calculate distance from previous point
        if (i > 0 || drawnCoordinates.length > 0) {
          const prevPoint = i > 0 
            ? newPoints[i - 1] 
            : drawnCoordinates[drawnCoordinates.length - 1];
          
          const distance = turf.distance(
            turf.point(prevPoint),
            turf.point([point[0], point[1]]),
            { units: 'kilometers' }
          );
          totalDistance += distance;
        }
  
        return {
          distance: totalDistance,
          elevation: point[2]
        };
      });
  
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
  
      // Update coordinates
      const allCoordinates = [...segments, newSegment].flatMap(segment => segment.roadPoints);
      setDrawnCoordinates(allCoordinates);
      logStateChange('Coordinates updated', { 
        totalCoordinates: allCoordinates.length 
      });
      
      // Update map sources
      const lineSource = map.getSource(layerRefs.current.drawing) as mapboxgl.GeoJSONSource;
      const markerSource = map.getSource(layerRefs.current.markers) as mapboxgl.GeoJSONSource;
  
      if (lineSource && markerSource) {
        lineSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: allCoordinates
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
          const newProfile = [...prev, ...newElevationPoints];
          logStateChange('Elevation profile updated', {
            previousCount: prev.length,
            newCount: newProfile.length
          });
          return newProfile;
        });
      }
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
      properties: {
        elevationProfile: elevationProfile
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: drawnCoordinates
      }
    };

    logStateChange('Drawing finished', {
      coordinatesCount: drawnCoordinates.length,
      elevationPointCount: elevationProfile.length
    });

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
      map.removeLayer(layerRefs.current.drawing);
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
    }
  };
};