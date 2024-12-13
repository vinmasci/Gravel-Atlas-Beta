// app/hooks/use-draw-mode.ts
import { useState, useCallback } from 'react';
import type { Map } from 'mapbox-gl';

export const useDrawMode = (map: Map | null) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<[number, number][]>([]);
  const [drawingLayer, setDrawingLayer] = useState<string | null>(null);

  const startDrawing = useCallback(() => {
    if (!map) return;
    
    setIsDrawing(true);
    setDrawnCoordinates([]);
    
    // Change cursor to crosshair
    map.getCanvas().style.cursor = 'crosshair';

    // Create new layer for drawing
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

  const handleClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || !map || !drawingLayer) return;

    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const newCoordinates = [...drawnCoordinates, coords];
    setDrawnCoordinates(newCoordinates);

    // Update the drawing layer
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
  }, [isDrawing, map, drawingLayer, drawnCoordinates]);

  const undoLastPoint = useCallback(() => {
    if (!map || !drawingLayer || drawnCoordinates.length === 0) return;

    const newCoordinates = [...drawnCoordinates];
    newCoordinates.pop();
    setDrawnCoordinates(newCoordinates);

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
  }, [map, drawingLayer, drawnCoordinates]);

  const finishDrawing = useCallback(() => {
    if (!map || !isDrawing || drawnCoordinates.length < 2) return null;

    setIsDrawing(false);
    map.getCanvas().style.cursor = '';

    const geojson = {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: drawnCoordinates
      }
    };

    return geojson;
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
    map.getCanvas().style.cursor = '';
  }, [map, drawingLayer]);

  return {
    isDrawing,
    drawnCoordinates,
    startDrawing,
    handleClick,
    finishDrawing,
    clearDrawing,
    undoLastPoint
  };
};