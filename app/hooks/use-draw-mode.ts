// app/hooks/use-draw-mode.ts
import { useState, useCallback, useRef } from 'react';
import type { Map } from 'mapbox-gl';

interface SnapPointResponse {
  code: string;
  waypoints: {
    location: [number, number];
    name: string;
  }[];
  routes: {
    geometry: {
      coordinates: [number, number][];
    };
  }[];
}

export const useDrawMode = (map: Map | null) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<[number, number][]>([]);
  const [drawingLayer, setDrawingLayer] = useState<string | null>(null);
  const [snapToRoad, setSnapToRoad] = useState(true); // Default to true
  const lastSnappedPoint = useRef<[number, number] | null>(null);

  const snapToNearestRoad = async (clickedPoint: [number, number], previousPoint?: [number, number]): Promise<[number, number][]> => {
    if (!snapToRoad) return [clickedPoint];

    try {
      // If this is the first point or snap to road is off, return as is
      if (!previousPoint) {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data: SnapPointResponse = await response.json();
        if (data.code === 'Ok' && data.waypoints.length > 0) {
          return [data.waypoints[0].location];
        }
        return [clickedPoint];
      }

      // If we have a previous point, get the route between them
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${previousPoint[0]},${previousPoint[1]};${clickedPoint[0]},${clickedPoint[1]}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      
      const data: SnapPointResponse = await response.json();
      
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
    
    map.getCanvas().style.cursor = 'crosshair';

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

    setDrawingLayer(newLayerId);
  }, [map]);

  const handleClick = useCallback(async (e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || !map || !drawingLayer) return;

    const clickedPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const previousPoint = drawnCoordinates.length > 0 ? drawnCoordinates[drawnCoordinates.length - 1] : undefined;
    
    let newPoints: [number, number][] = await snapToNearestRoad(clickedPoint, previousPoint);
    
    // If we're adding a route segment (not the first point), remove the first point
    // as it would duplicate the last point of the previous segment
    if (previousPoint && newPoints.length > 1) {
      newPoints = newPoints.slice(1);
    }

    const newCoordinates = [...drawnCoordinates, ...newPoints];
    setDrawnCoordinates(newCoordinates);
    lastSnappedPoint.current = newPoints[newPoints.length - 1];

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
  }, [isDrawing, map, drawingLayer, drawnCoordinates, snapToRoad]);

  const undoLastPoint = useCallback(() => {
    if (!map || !drawingLayer || drawnCoordinates.length === 0) return;

    // If we're using snap to road, we need to remove the entire last segment
    let newCoordinates: [number, number][] = [];
    if (snapToRoad && drawnCoordinates.length > 1) {
      // Find the last segment break point
      let lastBreakIndex = drawnCoordinates.length - 1;
      while (lastBreakIndex > 0 && isSamePoint(drawnCoordinates[lastBreakIndex], drawnCoordinates[lastBreakIndex - 1])) {
        lastBreakIndex--;
      }
      newCoordinates = drawnCoordinates.slice(0, lastBreakIndex);
    } else {
      newCoordinates = drawnCoordinates.slice(0, -1);
    }

    setDrawnCoordinates(newCoordinates);
    lastSnappedPoint.current = newCoordinates[newCoordinates.length - 1] || null;

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
  }, [map, drawingLayer, drawnCoordinates, snapToRoad]);

  const finishDrawing = useCallback(() => {
    if (!map || !isDrawing || drawnCoordinates.length < 2) return null;

    setIsDrawing(false);
    map.getCanvas().style.cursor = '';

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: drawnCoordinates
      }
    };
  }, [map, isDrawing, drawnCoordinates]);

  const clearDrawing = useCallback(() => {
    if (!map || !drawingLayer) return;

    if (map.getLayer(drawingLayer)) {
      map.removeLayer(drawingLayer);
    }
    if (map.getSource(drawingLayer)) {
      map.removeSource(drawingLayer);
    }

    setDrawingLayer(null);
    setDrawnCoordinates([]);
    setIsDrawing(false);
    lastSnappedPoint.current = null;
    map.getCanvas().style.cursor = '';
  }, [map, drawingLayer]);

  const toggleSnapToRoad = useCallback((enabled: boolean) => {
    setSnapToRoad(enabled);
  }, []);

  return {
    isDrawing,
    drawnCoordinates,
    snapToRoad,
    startDrawing,
    handleClick,
    finishDrawing,
    clearDrawing,
    undoLastPoint,
    toggleSnapToRoad
  };
};

// Helper function to compare points
function isSamePoint(p1: [number, number], p2: [number, number]): boolean {
  return p1[0] === p2[0] && p1[1] === p2[1];
}