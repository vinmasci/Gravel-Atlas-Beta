export const addGravelRoadsSource = (map: mapboxgl.Map) => {
    if (!map.getSource('gravel-roads')) {
      map.addSource('gravel-roads', {
        type: 'vector',
        tiles: [
                    'https://api.maptiler.com/tiles/2378fd50-8c13-4408-babf-e7b2d62c857c/{z}/{x}/{y}.pbf?key=DFSAZFJXzvprKbxHrHXv'
        ],
        minzoom: 8,
        maxzoom: 16
      });
    }
  };
  
  export const addGravelRoadsLayer = (map: mapboxgl.Map) => {
    if (!map.getLayer('gravel-roads')) {
      map.addLayer({
        'id': 'gravel-roads',
        'type': 'line',
        'source': 'gravel-roads',
        'source-layer': 'gravel_roads',
        'layout': {
          'visibility': 'none',
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#d35400',  // Orange color for gravel roads
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