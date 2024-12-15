// lib/bike-infrastructure-layer.ts
import mapboxgl from 'mapbox-gl';

export const addBikeInfraSource = (map: mapboxgl.Map) => {
  console.log('Adding bike infrastructure source');
  if (!map.getSource('bike-infrastructure')) {
    try {
      map.addSource('bike-infrastructure', {
        type: 'vector',
        tiles: [
          'https://api.maptiler.com/tiles/27bf78ef-a023-45f5-b997-a0c14cf84716/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
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
      // First add the background stroke layer
      map.addLayer({
        'id': 'bike-infrastructure-stroke',
        'type': 'line',
        'source': 'bike-infrastructure',
        'source-layer': 'bike_infrastructure',
        'filter': [                           // Replace the existing filter here
          'any',
          ['==', ['get', 'highway'], 'cycleway'],
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
          'line-sort-key': 2  // Makes sure this layer stays above terrain
        },
        'paint': {
          'line-color': '#000000',  // Black stroke
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 2,    // Thicker at base zoom
            12, 3,
            14, 3.5,
            16, 4,
            18, 5,
            20, 6
          ],
          'line-opacity': 0.5
        }
      });

      // Then add the main colored line layer on top
      map.addLayer({
        'id': 'bike-infrastructure',
        'type': 'line',
        'source': 'bike-infrastructure',
        'source-layer': 'bike_infrastructure',
        'filter': [                           // Replace the existing filter here
          'any',
          ['==', ['get', 'highway'], 'cycleway'],
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
          'line-sort-key': 3  // Makes sure this layer stays above the stroke
        },
        'paint': {
          'line-color': [
            'match',
            ['get', 'highway'],
            'cycleway', '#3B82F6',  // blue-500 for dedicated cycleways
            'path', '#10B981',      // emerald-500 for shared paths
            'track', '#6366F1',     // indigo-500 for tracks
            'footway', '#8B5CF6',   // violet-500 for footways
            '#3B82F6'               // default blue
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1,
            12, 2,
            14, 2.5,
            16, 3,
            18, 4,
            20, 5
          ],
          'line-opacity': 1
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

      console.log('Bike infrastructure layers added successfully');
    } catch (error) {
      console.error('Error adding bike infrastructure layers:', error);
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