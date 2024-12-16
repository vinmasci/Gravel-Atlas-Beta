// lib/paved-roads-layer.ts
import mapboxgl from 'mapbox-gl';

export const addPavedRoadsSource = (map: mapboxgl.Map) => {
  console.log('Adding paved roads source');
  if (!map.getSource('paved-roads')) {
    try {
      map.addSource('paved-roads', {
        type: 'vector',
        tiles: [
          'https://api.maptiler.com/tiles/2378fd50-8c13-4408-babf-e7b2d62c857c/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 8,
        maxzoom: 22
      });
      console.log('Paved roads source added successfully');
    } catch (error) {
      console.error('Error adding paved roads source:', error);
    }
  }
};

export const addPavedRoadsLayer = (map: mapboxgl.Map) => {
  console.log('Adding paved roads layer');
  if (!map.getLayer('paved-roads')) {
    try {
      const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;

      map.addLayer({
        'id': 'paved-roads',
        'type': 'line',
        'source': 'paved-roads',
        'source-layer': 'gravel_roads',
        'filter': [
          'any',
          ['==', ['get', 'surface'], 'paved'],
          ['==', ['get', 'surface'], 'asphalt'],
          ['==', ['get', 'surface'], 'concrete']
        ],
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#2563eb',  // Blue color for paved roads
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.5,    // Thinner at low zoom
            12, 1,     // Still thin at medium zoom
            14, 1.5,   // Slightly thicker
            16, 2,     // Medium thickness
            18, 2.5,   // Slightly thicker at high zoom
            20, 3      // Maximum thickness
          ],
          'line-opacity': 0.8
        }
      }, firstSymbolId);

      // Add hover effect
      map.on('mouseenter', 'paved-roads', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features?.length && e.features[0].properties) {
          const properties = e.features[0].properties;
          
          const content = `
          <div class="p-2 text-black dark:text-white dark:bg-gray-800">
            ${properties.name ? `<div class="mb-1"><strong class="font-medium">Name:</strong> ${properties.name}</div>` : ''}
            ${properties.surface ? `<div class="mb-1"><strong class="font-medium">Surface:</strong> ${properties.surface}</div>` : ''}
            ${properties.access ? `<div class="mb-1"><strong class="font-medium">Access:</strong> ${properties.access}</div>` : ''}
            ${properties.maxspeed ? `<div class="mb-1"><strong class="font-medium">Speed Limit:</strong> ${properties.maxspeed}</div>` : ''}
          </div>
        `;

          new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'road-popup'
          })
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map);
        }
      });

      map.on('mouseleave', 'paved-roads', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups[0]) popups[0].remove();
      });

    } catch (error) {
      console.error('Error adding paved roads layer:', error);
    }
  }
};

export const updatePavedRoadsLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('paved-roads')) {
    map.setLayoutProperty(
      'paved-roads',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupPavedRoadsLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('paved-roads')) {
    map.off('mouseenter', 'paved-roads');
    map.off('mouseleave', 'paved-roads');
    map.removeLayer('paved-roads');
  }
};