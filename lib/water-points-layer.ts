// lib/water-points-layer.ts
import mapboxgl from 'mapbox-gl';

export const addWaterPointsSource = (map: mapboxgl.Map) => {
    if (!map.getSource('water-points')) {
      try {
        map.addSource('water-points', {
          type: 'vector',
          tiles: [
            'https://api.maptiler.com/tiles/c206d0fc-f093-499d-898c-5e0b038a4398/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
          ],
          minzoom: 0,  // Set to lowest possible zoom
          maxzoom: 22  // Set to highest possible zoom
        });
      } catch (error) {
        console.error('Error adding water points source:', error);
      }
    }
  };

export const addWaterPointsLayer = (map: mapboxgl.Map) => {
  console.log('Adding water points layer');
  if (!map.getLayer('water-points')) {
    try {
      map.addLayer({
        'id': 'water-points',
        'type': 'symbol',
        'source': 'water-points',
        'source-layer': 'pois',  // We'll need to confirm this source-layer name
        'minzoom': 0,      // Add this to force layer visibility at all zooms
        'maxzoom': 24,     // Add this to force layer visibility at all zooms
        'filter': [
          'all',
          ['==', 'amenity', 'drinking_water']
        ],
'layout': {
  'visibility': 'visible',
  'icon-image': 'water-icon',
  'icon-size': 0.007,
  'icon-rotate': 180,
  'icon-allow-overlap': true,
  'icon-ignore-placement': true,  // Add this to force icons to show
  'text-allow-overlap': true,     // Add this to force labels to show
  'text-ignore-placement': true,  // Add this to force labels to show
  'text-field': ['get', 'name'],
  'text-size': 12,
  'text-offset': [0, 1.5],
  'text-anchor': 'top',
  'text-optional': true
},
        'paint': {
          'text-color': '#001e57',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Add hover effect
      map.on('mouseenter', 'water-points', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        
        if (e.features?.length && e.features[0].properties) {
          const properties = e.features[0].properties;
          
          const content = `
          <div class="p-2 text-black dark:text-white dark:bg-gray-800">
            <div class="mb-1"><strong class="font-medium">Drinking Water</strong></div>
            ${properties.name ? `<div class="mb-1">${properties.name}</div>` : ''}
          </div>
        `;

          new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'water-popup'
          })
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map);
        }
      });

      map.on('mouseleave', 'water-points', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('water-popup');
        if (popups[0]) popups[0].remove();
      });

        // Add this click handler right here
  map.on('click', 'water-points', (e) => {
    if (e.features && e.features[0] && e.features[0].geometry) {
      // Try getting coordinates from the feature's geometry
      const coords = (e.features[0].geometry as any).coordinates;
      if (coords) {
        map.easeTo({
          center: coords,
          zoom: 18,
          duration: 1000
        });
      } else {
        // Fallback to click location
        map.easeTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: 18,
          duration: 1000
        });
      }
    }
  });

    } catch (error) {
      console.error('Error adding water points layer:', error);
    }
  }
};

export const updateWaterPointsLayer = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('water-points')) {
    map.setLayoutProperty(
      'water-points',
      'visibility',
      visible ? 'visible' : 'none'
    );
  }
};

export const cleanupWaterPointsLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('water-points')) {
    map.off('mouseenter', 'water-points');
    map.off('mouseleave', 'water-points');
    map.removeLayer('water-points');
  }
  if (map.getSource('water-points')) {
    map.removeSource('water-points');
  }
};