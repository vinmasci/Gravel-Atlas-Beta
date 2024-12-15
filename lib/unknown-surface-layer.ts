// lib/unknown-surface-layer.ts
import mapboxgl from 'mapbox-gl';

export const addUnknownSurfaceSource = (map: mapboxgl.Map) => {
  console.log('Adding unknown surface roads source');
  if (!map.getSource('unknown-surface')) {
    try {
      map.addSource('unknown-surface', {
        type: 'vector',
        tiles: [
          'https://api.maptiler.com/tiles/24ef3773-9c7b-4cc0-b056-16b14afb5fe4/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 8,
        maxzoom: 22
      });
      console.log('Unknown surface roads source added successfully');
    } catch (error) {
      console.error('Error adding unknown surface roads source:', error);
    }
  }
};

export const addUnknownSurfaceLayer = (map: mapboxgl.Map) => {
  console.log('Adding unknown surface roads layer');
  if (!map.getLayer('unknown-surface')) {
    try {
      const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;

      map.addLayer({
        'id': 'unknown-surface',
        'type': 'line',
        'source': 'unknown-surface',
        'source-layer': 'roads',
        'filter': [
          'any',
          ['==', 'surface', 'unknown'],
          ['!has', 'surface']
        ],
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#f39c12',
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
      map.on('mouseenter', 'unknown-surface', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features?.length && e.features[0].properties) {
          const properties = e.features[0].properties;
          
          const content = `
          <div class="p-2 text-black dark:text-white dark:bg-gray-800">
            ${properties.name ? `<div class="mb-1"><strong class="font-medium">Name:</strong> ${properties.name}</div>` : ''}
            ${properties.surface ? `<div class="mb-1"><strong class="font-medium">Surface:</strong> ${properties.surface}</div>` : '<div class="mb-1"><strong class="font-medium">Surface:</strong> Unknown</div>'}
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

      map.on('mouseleave', 'unknown-surface', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups[0]) popups[0].remove();
      });

    } catch (error) {
      console.error('Error adding unknown surface roads layer:', error);
    }
  }
};

export const updateUnknownSurfaceLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('unknown-surface')) {
    map.setLayoutProperty(
      'unknown-surface',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupUnknownSurfaceLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('unknown-surface')) {
    map.off('mouseenter', 'unknown-surface');
    map.off('mouseleave', 'unknown-surface');
    map.removeLayer('unknown-surface');
  }
  if (map.getSource('unknown-surface')) {
    map.removeSource('unknown-surface');
  }
};