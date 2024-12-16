import mapboxgl from 'mapbox-gl';

export const addPavedRoadsSource = (map: mapboxgl.Map) => {
  console.log('Adding paved roads source');
  if (!map.getSource('paved-roads')) {
    try {
      map.addSource('paved-roads', {
        type: 'vector',
        tiles: [
          'https://api.maptiler.com/tiles/24ef3773-9c7b-4cc0-b056-16b14afb5fe4/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 5,
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
        'source': 'composite',
        'source-layer': 'road',
        'filter': [
          'all',
          // Only get explicitly paved roads
          ['match', ['get', 'surface'], 
            ['paved', 'asphalt', 'concrete', 'sealed'], true,
            false
          ],
          // Match road classifications we want
          ['match', ['get', 'class'],
            ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'street', 'street_limited'], true,
            false
          ],
          // Exclude tunnels and bridges
          ['!=', ['get', 'structure'], 'tunnel'],
          ['!=', ['get', 'structure'], 'bridge']
        ],
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          // Color based on speed limit - using grayscale
          'line-color': [
            'case',
            ['has', 'maxspeed'],
            [
              'interpolate',
              ['linear'],
              ['to-number', ['get', 'maxspeed']],
              40, '#9CA3AF',  // Light gray (Gray-400)
              60, '#6B7280',  // Medium gray (Gray-500)
              80, '#4B5563',  // Dark gray (Gray-600)
              100, '#374151', // Charcoal (Gray-700)
              110, '#1F2937'  // Nearly black (Gray-800)
            ],
            '#6B7280'  // Default medium gray for roads without speed data
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2,
            8, 2.5,
            12, 4,
            14, 5,
            16, 6,
            18, 7,
            20, 8
          ],
          'line-opacity': 0.8
        }
      }, firstSymbolId);

      // Add hover effect
      map.on('mouseenter', 'paved-roads', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features?.length && e.features[0].properties) {
          const properties = e.features[0].properties;
          
          // Function to format speed limit display
          const formatSpeedLimit = (speedLimit: string | undefined) => {
            if (!speedLimit) return 'Not specified';
            // Check if it's a number or has units already
            const numericSpeed = parseInt(speedLimit);
            if (isNaN(numericSpeed)) return speedLimit;
            return `${numericSpeed} km/h`;
          };

          const content = `
            <div class="p-2 text-black dark:text-white dark:bg-gray-800">
              ${properties.name ? `<div class="mb-1"><strong class="font-medium">Road:</strong> ${properties.name}</div>` : ''}
              ${`<div class="mb-1"><strong class="font-medium">Speed Limit:</strong> ${formatSpeedLimit(properties.maxspeed)}</div>`}
              ${properties.surface ? `<div class="mb-1"><strong class="font-medium">Surface:</strong> ${properties.surface}</div>` : ''}
              ${properties.access ? `<div class="mb-1"><strong class="font-medium">Access:</strong> ${properties.access}</div>` : ''}
              ${properties.class ? `<div class="mb-1"><strong class="font-medium">Type:</strong> ${properties.class.replace(/_/g, ' ').charAt(0).toUpperCase() + properties.class.slice(1)}</div>` : ''}
            </div>
          `;

          new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'road-popup',
            offset: 15
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

      console.log('Paved roads layer added successfully');
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
  if (map.getSource('paved-roads')) {
    map.removeSource('paved-roads');
  }
};