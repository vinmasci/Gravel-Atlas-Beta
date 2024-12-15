import mapboxgl from 'mapbox-gl';

export const addGravelRoadsSource = (map: mapboxgl.Map) => {
  console.log('Adding gravel roads source');
  if (!map.getSource('gravel-roads')) {
    try {
      map.addSource('gravel-roads', {
        type: 'vector',
        tiles: [
          'https://api.maptiler.com/tiles/2378fd50-8c13-4408-babf-e7b2d62c857c/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 8,
        maxzoom: 22
      });
      console.log('Gravel roads source added successfully');
    } catch (error) {
      console.error('Error adding gravel roads source:', error);
    }
  }
};

export const addGravelRoadsLayer = (map: mapboxgl.Map) => {
  console.log('Adding gravel roads layer');
  if (!map.getLayer('gravel-roads')) {
    try {
      const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;

      map.addLayer({
        'id': 'gravel-roads',
        'type': 'line',
        'source': 'gravel-roads',
        'source-layer': 'gravel_roads',
        'filter': [
          'all',
          ['!=', ['get', 'access'], 'private'],
          ['!=', ['get', 'access'], 'no']
        ],
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': [
            'case',
            ['any',
              ['==', ['get', 'access'], 'no'],
              ['==', ['get', 'access'], 'private']
            ],
            '#ff0000',  // Red for 'no' access or 'private'
            '#d35400'   // Original orange for all other roads
          ],
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
      map.on('mouseenter', 'gravel-roads', (e) => {
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

      map.on('mouseleave', 'gravel-roads', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups[0]) popups[0].remove();
      });

      console.log('Layer order:', {
        beforeLayer: firstSymbolId,
        allLayers: map.getStyle().layers.map(l => l.id)
      });
    } catch (error) {
      console.error('Error adding gravel roads layer:', error);
    }
  }
};

export const updateGravelRoadsLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('gravel-roads')) {
    map.setLayoutProperty(
      'gravel-roads',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupGravelRoadsLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('gravel-roads')) {
    map.off('mouseenter', 'gravel-roads');
    map.off('mouseleave', 'gravel-roads');
    map.removeLayer('gravel-roads');
  }
  if (map.getSource('gravel-roads')) {
    map.removeSource('gravel-roads');
  }
};