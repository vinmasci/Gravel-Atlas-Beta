// lib/private-roads-layer.ts
import mapboxgl from 'mapbox-gl';

export const addPrivateRoadsLayer = (map: mapboxgl.Map) => {
  console.log('Adding private roads layer');
  if (!map.getLayer('private-roads')) {
    try {
      const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;

      map.addLayer({
        'id': 'private-roads',
        'type': 'line',
        'source': 'gravel-roads', // Using the same source as gravel roads
        'source-layer': 'gravel_roads',
        'filter': [
          'any',
          ['==', ['get', 'access'], 'private'],
          ['==', ['get', 'access'], 'no']
        ],
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#ff0000',  // Red for private roads
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
      map.on('mouseenter', 'private-roads', (e) => {
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

      map.on('mouseleave', 'private-roads', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups[0]) popups[0].remove();
      });

    } catch (error) {
      console.error('Error adding private roads layer:', error);
    }
  }
};

export const updatePrivateRoadsLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('private-roads')) {
    map.setLayoutProperty(
      'private-roads',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupPrivateRoadsLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('private-roads')) {
    map.off('mouseenter', 'private-roads');
    map.off('mouseleave', 'private-roads');
    map.removeLayer('private-roads');
  }
};