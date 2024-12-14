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
              maxzoom: 16
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
          map.addLayer({
              'id': 'gravel-roads',
              'type': 'line',
              'source': 'gravel-roads',
              'source-layer': 'roads',  // Changed from 'gravel_roads' to 'roads'
              'layout': {
                  'visibility': 'none',
                  'line-join': 'round',
                  'line-cap': 'round'
              },
              'paint': {
                  'line-color': '#d35400',
                  'line-width': [
                      'interpolate',
                      ['linear'],
                      ['zoom'],
                      8, 1,
                      16, 3
                  ],
                  'line-opacity': 0.8
              }
          });
          console.log('Gravel roads layer added successfully');
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