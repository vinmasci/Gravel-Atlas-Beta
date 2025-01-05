import * as turf from '@turf/turf';

export const initializeDrawControls = (map: mapboxgl.Map) => {
  let drawingPath: any[] = [];
  let currentLine: mapboxgl.Marker[] = [];
  let isDrawing = false;

  const clearDrawing = () => {
    currentLine.forEach(marker => marker.remove());
    currentLine = [];
    drawingPath = [];
  };

  const addPoint = (e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    drawingPath.push([lng, lat]);

    // Add marker at clicked point
    const marker = new mapboxgl.Marker({
      color: '#FF0000',
      scale: 0.5,
      clickTolerance: 0,  // Add this line to disable popup
      draggable: false    // Add this line to disable popup
    })
      .setLngLat([lng, lat])
      .addTo(map);

    currentLine.push(marker);

    // If we have at least 2 points, draw the line
    if (drawingPath.length >= 2) {
      updateLine();
    }
  };

  const updateLine = () => {
    // Remove existing line layer if it exists
    if (map.getLayer('drawing-line')) {
      map.removeLayer('drawing-line');
    }
    if (map.getSource('drawing-line')) {
      map.removeSource('drawing-line');
    }

    // Add the line to the map
    map.addSource('drawing-line', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: drawingPath
        }
      }
    });

    map.addLayer({
      id: 'drawing-line',
      type: 'line',
      source: 'drawing-line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FF0000',
        'line-width': 3
      }
    });
  };

  const finishDrawing = () => {
    isDrawing = false;
    const line = turf.lineString(drawingPath);
    return line;
  };

  return {
    startDrawing: () => {
      isDrawing = true;
      map.getCanvas().style.cursor = 'crosshair';
    },
    handleClick: (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing) return;
      addPoint(e);
    },
    handleDblClick: (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const line = finishDrawing();
      map.getCanvas().style.cursor = '';
      return line;
    },
    clearDrawing,
    isDrawing: () => isDrawing
  };
};