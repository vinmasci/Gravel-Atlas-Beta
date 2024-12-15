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
      const firstSymbolId = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;

      map.addLayer({
        'id': 'bike-infrastructure',
        'type': 'line',
        'source': 'bike-infrastructure',
        'source-layer': 'bike_infrastructure',  // matches the layer name from tippecanoe
        'layout': {
          'visibility': 'visible',
          'line-join': 'round',
          'line-cap': 'round'
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
            8, 1,    // Thinnest at zoom 8
            12, 2,   // Medium thickness at zoom 12
            14, 2.5, // Slightly thicker at zoom 14
            16, 3,   // Base thickness at zoom 16
            18, 4,   // Will scale up even though using zoom 16 tiles
            20, 5    // Maximum thickness at zoom 20
          ],
          'line-opacity': 0.8
        }
      }, firstSymbolId);

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
        beforeLayer: firstSymbolId,
        allLayers: map.getStyle().layers.map(l => l.id)
      });
    } catch (error) {
      console.error('Error adding bike infrastructure layer:', error);
    }
  }
};

export const updateBikeInfraLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('bike-infrastructure')) {
    map.setLayoutProperty(
      'bike-infrastructure',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupBikeInfraLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('bike-infrastructure')) {
    map.off('mouseenter', 'bike-infrastructure');
    map.off('mouseleave', 'bike-infrastructure');
    map.removeLayer('bike-infrastructure');
  }
  if (map.getSource('bike-infrastructure')) {
    map.removeSource('bike-infrastructure');
  }
};