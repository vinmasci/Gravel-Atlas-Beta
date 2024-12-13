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
  }, [map]);

  const handleClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    if (!isDrawing || !map) return;

    const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    setDrawnCoordinates(prev => [...prev, coords]);

    // Update or create the drawing layer
    if (drawingLayer) {
      const source = map.getSource(drawingLayer) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [...drawnCoordinates, coords]
          }
        });
      }
    } else {
      // Create new layer for drawing
      const newLayerId = `drawing-${Date.now()}`;
      map.addSource(newLayerId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [coords]
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
    }
  }, [isDrawing, map, drawnCoordinates, drawingLayer]);

  const finishDrawing = useCallback(() => {
    if (!map || !isDrawing) return null;

    setIsDrawing(false);
    map.getCanvas().style.cursor = '';

    if (drawnCoordinates.length < 2) {
      clearDrawing();
      return null;
    }

    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: drawnCoordinates
      }
    };

    clearDrawing();
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
    clearDrawing
  };
};