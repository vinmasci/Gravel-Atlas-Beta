// lib/mapillary.ts

import mapboxgl from 'mapbox-gl';

export const MAPILLARY_ACCESS_TOKEN = 'MLY|8906616826026117|b54ee1593f4e7ea3e975d357ed39ae31';

export const addMapillaryLayers = (map: mapboxgl.Map) => {
  // Add source
  map.addSource('mapillary', {
    type: 'vector',
    tiles: [`https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}?access_token=${MAPILLARY_ACCESS_TOKEN.replace(/\|/g, '%7C')}`],
    minzoom: 6,
    maxzoom: 14
  });

  // Add sequence layer
  map.addLayer({
    'id': 'mapillary-sequences',
    'type': 'line',
    'source': 'mapillary',
    'source-layer': 'sequence',
    'layout': {
      'line-cap': 'round',
      'line-join': 'round',
      'visibility': 'none'  // Start hidden
    },
    'paint': {
      'line-opacity': 0.6,
      'line-color': '#05CB63',
      'line-width': 2
    }
  });

  // Add images layer
  map.addLayer({
    'id': 'mapillary-images',
    'type': 'circle',
    'source': 'mapillary',
    'source-layer': 'image',
    'layout': {
      'visibility': 'none'  // Start hidden
    },
    'paint': {
      'circle-radius': 4,
      'circle-color': '#05CB63',
      'circle-opacity': 0.8
    }
  });

  // Create popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    maxWidth: '320px'
  });

  // Add hover interaction
  map.on('mouseenter', 'mapillary-images', async (e) => {
    if (!e.features?.length) return;
    
    map.getCanvas().style.cursor = 'pointer';
    const coordinates = e.lngLat;
    
    // Show loading state
    popup
      .setLngLat(coordinates)
      .setHTML('<div class="bg-white p-2 rounded-md">Loading preview...</div>')
      .addTo(map);

    try {
      const bbox = {
        west: coordinates.lng - 0.0001,
        east: coordinates.lng + 0.0001,
        south: coordinates.lat - 0.0001,
        north: coordinates.lat + 0.0001
      };

      const searchUrl = new URL('https://graph.mapillary.com/images');
      searchUrl.searchParams.append('access_token', MAPILLARY_ACCESS_TOKEN);
      searchUrl.searchParams.append('fields', 'id,thumb_1024_url,captured_at');
      searchUrl.searchParams.append('bbox', `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`);
      searchUrl.searchParams.append('limit', '1');

      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.data?.[0]?.thumb_1024_url) {
        throw new Error('No images found at this location');
      }

      const image = data.data[0];
      const date = new Date(image.captured_at).toLocaleDateString();
      
      popup.setHTML(`
        <div class="bg-white p-2 rounded-md shadow-md">
          <img 
            src="${image.thumb_1024_url}" 
            alt="Street view preview" 
            class="w-[300px] rounded-md block"
            onerror="this.parentElement.innerHTML='<div class=\'p-2 text-red-500\'>Image failed to load</div>'"
          />
          <div class="text-sm text-gray-600 mt-1">
            Captured: ${date}
          </div>
          <div class="text-sm mt-1">
            <a href="https://www.mapillary.com/app/?image_key=${image.id}" 
               target="_blank" 
               class="text-green-500 hover:text-green-600 no-underline">
              View in Mapillary
            </a>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Mapillary preview error:', error);
      popup.setHTML(`
        <div class="bg-white p-2 rounded-md">
          <div class="text-red-500">Failed to load preview</div>
          <div class="text-sm text-gray-600 mt-1">
            ${error.message}
          </div>
        </div>
      `);
    }
  });

  map.on('mouseleave', 'mapillary-images', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
};