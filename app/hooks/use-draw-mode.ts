// app/hooks/use-draw-mode.ts
import { useState, useCallback, useRef } from 'react';
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

async function getElevation(coordinates: [number, number][]): Promise<[number, number, number][]> {
    console.log('getElevation called with:', coordinates);
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
    return data.coordinates;
  } catch (error) {
    console.error('Error fetching elevation:', error);
    // Return original coordinates with 0 elevation if there's an error
    return coordinates.map(([lng, lat]) => [lng, lat, 0]);
  }
}

export const useDrawMode = (map: Map | null) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<[number, number][]>([]);
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([]);
  const [snapToRoad, setSnapToRoad] = useState(true);
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  
  const layerRefs = useRef({ drawing: null as string | null, markers: null as string | null });
  const pendingOperation = useRef<AbortController | null>(null);
  const isProcessingClick = useRef(false);

  const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<[number, number][]> => {
    if (!snapToRoad) return [clickedPoint];

    try {
      if (!previousPoint) {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        if (data.code === 'Ok' && data.waypoints.length > 0) {
          const snappedPoint = data.waypoints[0].location;
          return [snappedPoint];
        }
        return [clickedPoint];
      }

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${previousPoint[0]},${previousPoint[1]};${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates as [number, number][];
      }
      
      return [clickedPoint];
    } catch (error) {
      console.error('Error snapping to road:', error);
      return [clickedPoint];
    }
  };

  const initializeLayers = useCallback(() => {
    if (!map) return;

    // Clean up existing layers
    if (layerRefs.current.drawing) {
      map.removeLayer(layerRefs.current.drawing);
      map.removeSource(layerRefs.current.drawing);
    }
    if (layerRefs.current.markers) {
      map.removeLayer(layerRefs.current.markers);
      map.removeSource(layerRefs.current.markers);
    }

    // Create new layers with unique IDs
    const drawingId = `drawing-${Date.now()}`;
    const markersId = `markers-${Date.now()}`;

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
  }, [map]);

  const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || !map || !layerRefs.current.drawing || isProcessingClick.current) return;
    
    console.log('Handle click event:', {
        isDrawingActive: isDrawing,
        existingPoints: drawnCoordinates.length,
        newPoint: [e.lngLat.lng, e.lngLat.lat],
        currentElevationProfile: elevationProfile
      });

    if (pendingOperation.current) {
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

      // Add click point immediately
      const newClickPoint = { 
        coordinates: clickedPoint,
        timestamp: Date.now()
      };

      // Get snapped points and elevation
      const newPoints = await snapToNearestRoad(clickedPoint, previousPoint);

      console.log('About to fetch elevation for:', {
        clickedPoint,
        previousPoint,
        newPoints
    });

      const elevationData = await getElevation([clickedPoint]);

      // Create new segment
      const newSegment: Segment = {
        clickPoint: newClickPoint,
        roadPoints: newPoints
      };

      // Calculate new elevation profile
      let totalDistance = elevationProfile.length > 0 
        ? elevationProfile[elevationProfile.length - 1].distance 
        : 0;

      const newElevationPoints = elevationData.map((point, i) => {
        if (i > 0 || drawnCoordinates.length > 0) {
          const prevPoint = i > 0 ? newPoints[i - 1] : drawnCoordinates[drawnCoordinates.length - 1];
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
      
      console.log('Elevation response:', {
        elevationData,
        newElevationPoints,
        currentProfile: elevationProfile
    });

      // Update state with new segment
      setSegments(prev => [...prev, newSegment]);
      setClickPoints(prev => [...prev, newClickPoint]);

      // Update coordinates by concatenating all road points from all segments
      const allCoordinates = [...segments, newSegment].flatMap(segment => segment.roadPoints);
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

        setElevationProfile(prev => [...prev, ...newElevationPoints]);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error processing click:', error);
      }
    } finally {
      isProcessingClick.current = false;
      pendingOperation.current = null;
    }
  }, [map, isDrawing, drawnCoordinates, elevationProfile, snapToRoad, clickPoints, segments]);

  const startDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawing(true);
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setClickPoints([]);
    setSegments([]);
    
    map.getCanvas().style.cursor = 'crosshair';
    initializeLayers();
  }, [map, initializeLayers]);

  const undoLastPoint = useCallback(() => {
    if (!map || !layerRefs.current.drawing || segments.length === 0) return;

    // Remove the last segment
    const newSegments = segments.slice(0, -1);
    const newClickPoints = clickPoints.slice(0, -1);
    
    // Reconstruct coordinates from remaining segments
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
      setElevationProfile(prev => prev.slice(0, -1));
    }
  }, [map, segments, clickPoints]);

  const finishDrawing = useCallback(() => {
    if (!map || !isDrawing || drawnCoordinates.length < 2) return null;

    setIsDrawing(false);
    map.getCanvas().style.cursor = '';

    return {
      type: 'Feature' as const,
      properties: {
        elevationProfile: elevationProfile
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: drawnCoordinates
      }
    };
  }, [map, isDrawing, drawnCoordinates, elevationProfile]);

  const clearDrawing = useCallback(() => {
    if (!map) return;
    
    if (pendingOperation.current) {
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
    toggleSnapToRoad: setSnapToRoad
  };
};