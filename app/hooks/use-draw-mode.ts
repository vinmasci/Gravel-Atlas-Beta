// app/hooks/use-draw-mode.ts
import { useState, useCallback } from 'react';
import type { Map } from 'mapbox-gl';
import * as turf from '@turf/turf';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface SegmentInfo {
  points: [number, number][];
  isSnapped: boolean;
  clickPoint: [number, number];
  elevation?: number;
}

async function getElevation(coordinates: [number, number][]): Promise<[number, number, number][]> {
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
  const [drawingLayer, setDrawingLayer] = useState<string | null>(null);
  const [markersLayer, setMarkersLayer] = useState<string | null>(null);
  const [snapToRoad, setSnapToRoad] = useState(true);
  const [segments, setSegments] = useState<SegmentInfo[]>([]);

  const updateMarkers = useCallback((segments: SegmentInfo[]) => {
    if (!map || !markersLayer) return;

    const source = map.getSource(markersLayer) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: segments.map((segment) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: segment.clickPoint
          },
          properties: {}
        }))
      });
    }
  }, [map, markersLayer]);

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

  const startDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawing(true);
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setSegments([]);
    
    map.getCanvas().style.cursor = 'crosshair';

    // Clean up existing layers
    if (drawingLayer) {
      if (map.getLayer(drawingLayer)) {
        map.removeLayer(drawingLayer);
      }
      if (map.getSource(drawingLayer)) {
        map.removeSource(drawingLayer);
      }
    }

    if (markersLayer) {
      if (map.getLayer(markersLayer)) {
        map.removeLayer(markersLayer);
      }
      if (map.getSource(markersLayer)) {
        map.removeSource(markersLayer);
      }
    }

    // Create new line layer
    const newLayerId = `drawing-${Date.now()}`;
    map.addSource(newLayerId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    map.addLayer({
      id: newLayerId,
      type: 'line',
      source: newLayerId,
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#ff0000',
        'line-width': 3
      }
    });

    // Create markers layer
    const newMarkersLayerId = `markers-${Date.now()}`;
    map.addSource(newMarkersLayerId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    map.addLayer({
      id: newMarkersLayerId,
      type: 'circle',
      source: newMarkersLayerId,
      paint: {
        'circle-radius': 5,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ff0000'
      }
    });

    setDrawingLayer(newLayerId);
    setMarkersLayer(newMarkersLayerId);
  }, [map, drawingLayer, markersLayer]);

  const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || !map || !drawingLayer) return;

    const clickedPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const previousPoint = drawnCoordinates.length > 0 ? drawnCoordinates[drawnCoordinates.length - 1] : undefined;
    
    let newPoints: [number, number][];
    if (snapToRoad) {
      newPoints = await snapToNearestRoad(clickedPoint, previousPoint);
    } else {
      newPoints = [clickedPoint];
    }

    // Get elevation for all new points at once
    const elevationData = await getElevation(newPoints);
    
    let totalDistance = elevationProfile.length > 0 ? elevationProfile[elevationProfile.length - 1].distance : 0;
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

    // Update elevation profile
    setElevationProfile(prev => [...prev, ...newElevationPoints]);
    
    // Store points, snap state, and elevation
    setSegments(prev => [...prev, {
      points: newPoints,
      isSnapped: snapToRoad && newPoints.length > 1,
      clickPoint: clickedPoint,
      elevation: elevationData[0]?.[2]
    }]);

    const newCoordinates = [...drawnCoordinates, ...newPoints];
    setDrawnCoordinates(newCoordinates);

    // Update line
    const source = map.getSource(drawingLayer) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: newCoordinates
        }
      });
    }

    // Update markers
    updateMarkers([...segments, { 
      points: newPoints, 
      isSnapped: snapToRoad && newPoints.length > 1, 
      clickPoint: clickedPoint,
      elevation: elevationData[0]?.[2]
    }]);
  }, [isDrawing, map, drawingLayer, drawnCoordinates, snapToRoad, segments, updateMarkers, elevationProfile]);

  const undoLastPoint = useCallback(() => {
    if (!map || !drawingLayer || segments.length === 0) return;

    const newSegments = segments.slice(0, -1);
    setSegments(newSegments);

    const newCoordinates = newSegments.flatMap(segment => segment.points);
    setDrawnCoordinates(newCoordinates);

    // Update elevation profile
    setElevationProfile(prev => prev.slice(0, -1));

    // Update line
    const source = map.getSource(drawingLayer) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: newCoordinates
        }
      });
    }

    // Update markers
    updateMarkers(newSegments);
  }, [map, drawingLayer, segments, updateMarkers]);

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
    if (!map || !drawingLayer) return;

    if (map.getLayer(drawingLayer)) {
      map.removeLayer(drawingLayer);
    }
    if (map.getSource(drawingLayer)) {
      map.removeSource(drawingLayer);
    }

    if (markersLayer) {
      if (map.getLayer(markersLayer)) {
        map.removeLayer(markersLayer);
      }
      if (map.getSource(markersLayer)) {
        map.removeSource(markersLayer);
      }
    }

    setDrawingLayer(null);
    setMarkersLayer(null);
    setDrawnCoordinates([]);
    setElevationProfile([]);
    setSegments([]);
    setIsDrawing(false);
    map.getCanvas().style.cursor = '';
  }, [map, drawingLayer, markersLayer]);

  const toggleSnapToRoad = useCallback((enabled: boolean) => {
    setSnapToRoad(enabled);
  }, []);

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
    toggleSnapToRoad
  };
};