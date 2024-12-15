// lib/bike-infrastructure-layer.ts
import mapboxgl from 'mapbox-gl';

export const addBikeInfraSource = (map: mapboxgl.Map) => {
  console.log('Adding bike infrastructure source');
  if (!map.getSource('bike-infrastructure')) {
    try {
      map.addSource('bike-infrastructure', {
        type: 'vector',
        tiles: [
    'https://api.maptiler.com/tiles/1c6b03d1-5f95-40bb-bc48-f9b8de81bf8f/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 8,
        maxzoom: 22
      });
      console.log('Bike infrastructure source added successfully');
    } catch (error) {
      console.error('Error adding bike infrastructure source:', error);
    }
  }
};

export const addBikeInfraLayer = (map: mapboxgl.Map) => {
    console.log('Adding bike infrastructure layer');
    if (!map.getLayer('bike-infrastructure')) {
      try {
        map.addLayer({
          'id': 'bike-infrastructure',
          'type': 'line',
          'source': 'bike-infrastructure',
          'source-layer': 'bike_infrastructure',
          'filter': [
            'any',
            ['==', ['get', 'highway'], 'cycleway'],
            ['==', ['get', 'bicycle'], 'designated'],
            [
              'all',
              ['!=', ['get', 'bicycle'], 'no'],
              [
                'any',
                ['==', ['get', 'bicycle'], 'yes'],
                ['has', 'designation']
              ]
            ]
          ],
          'layout': {
            'visibility': 'visible',
            'line-join': 'round',
            'line-cap': 'round',
            'line-sort-key': 3
          },
          'paint': {
'line-color': [
  'case',
  // Green for footways and paths with bicycle=yes (but not designated)
  [
    'all',
    ['match', ['get', 'highway'], ['footway', 'path'], true, false],
    ['==', ['get', 'bicycle'], 'yes']  // Only yes, not designated
  ],
  '#10B981',  // emerald-500

  // Orange (same as gravel roads) for unpaved cycleways and designated routes
  [
    'all',
    [
      'any',
      ['==', ['get', 'highway'], 'cycleway'],
      ['==', ['get', 'bicycle'], 'designated']
    ],
    [
      'match',
      ['get', 'surface'],
      ['unpaved', 'gravel', 'dirt', 'fine_gravel', 'earth', 'ground', 'grass', 'mud', 'sand', 'wood'],
      true,
      false
    ]
  ],
  '#d35400',  // Same orange as gravel roads

  // Violet for paved cycleways and designated routes
  [
    'any',
    ['==', ['get', 'highway'], 'cycleway'],
    ['==', ['get', 'bicycle'], 'designated']
  ],
  '#8B5CF6',  // violet-500

  // Default fallback color
  '#10B981'  // emerald-500
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
            'line-opacity': [
              'case',
              // More transparent for footways/paths
              [
                'all',
                ['match', ['get', 'highway'], ['footway', 'path'], true, false],
                ['==', ['get', 'bicycle'], 'yes']
              ],
              0.7,
              // Full opacity for cycleways and designated
              1
            ]
          }
        });
  
        // Add hover effect
        map.on('mouseenter', 'bike-infrastructure', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features?.length && e.features[0].properties) {
            const properties = e.features[0].properties;
            
            const content = `
            <div class="p-2 text-black dark:text-white dark:bg-gray-800">
              ${properties.name ? `<div class="mb-1"><strong class="font-medium">Name:</strong> ${properties.name}</div>` : ''}
              ${properties.highway ? `<div class="mb-1"><strong class="font-medium">Type:</strong> ${properties.highway}</div>` : ''}
              ${properties.bicycle ? `<div class="mb-1"><strong class="font-medium">Bicycle:</strong> ${properties.bicycle}</div>` : ''}
              ${properties.designation ? `<div class="mb-1"><strong class="font-medium">Designation:</strong> ${properties.designation}</div>` : ''}
              ${properties.surface ? `<div class="mb-1"><strong class="font-medium">Surface:</strong> ${properties.surface}</div>` : ''}
            </div>
            `;
  
            new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'bike-path-popup'
            })
              .setLngLat(e.lngLat)
              .setHTML(content)
              .addTo(map);
          }
        });
  
        map.on('mouseleave', 'bike-infrastructure', () => {
          map.getCanvas().style.cursor = '';
          const popups = document.getElementsByClassName('mapboxgl-popup');
          if (popups[0]) popups[0].remove();
        });
  
        console.log('Layer order:', {
          allLayers: map.getStyle().layers.map(l => l.id)
        });
      } catch (error) {
        console.error('Error adding bike infrastructure layer:', error);
      }
    }
  };

export const updateBikeInfraLayer = (map: mapboxgl.Map, visible: boolean) => {
  // Update both stroke and main layer visibility
  if (map.getLayer('bike-infrastructure-stroke')) {
    map.setLayoutProperty(
      'bike-infrastructure-stroke',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
  if (map.getLayer('bike-infrastructure')) {
    map.setLayoutProperty(
      'bike-infrastructure',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupBikeInfraLayer = (map: mapboxgl.Map) => {
  // Clean up both layers and associated events
  if (map.getLayer('bike-infrastructure')) {
    map.off('mouseenter', 'bike-infrastructure');
    map.off('mouseleave', 'bike-infrastructure');
    map.removeLayer('bike-infrastructure');
  }
  if (map.getLayer('bike-infrastructure-stroke')) {
    map.removeLayer('bike-infrastructure-stroke');
  }
  if (map.getSource('bike-infrastructure')) {
    map.removeSource('bike-infrastructure');
  }
};