// lib/bike-infrastructure-layer.ts
import mapboxgl, { Map } from 'mapbox-gl';

const sourceId = 'bike-infrastructure-source';
const layerId = 'bike-infrastructure-layer';

export const setupBikeLayer = (map: Map) => {
  if (!map.getSource(sourceId)) {
    // Add the vector tile source
    map.addSource(sourceId, {
      type: 'vector',
      url: 'YOUR_MAPTILER_URL_HERE', // Replace with your MapTiler URL
    });

    // Add the bike infrastructure layer
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      'source-layer': 'bike_infrastructure', // This should match your tippecanoe layer name
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
        'visibility': 'visible'
      },
      paint: {
        'line-color': [
          'match',
          ['get', 'highway'],
          'cycleway', '#3B82F6', // blue-500 for dedicated cycleways
          'path', '#10B981',     // emerald-500 for shared paths
          'track', '#6366F1',    // indigo-500 for tracks
          '#3B82F6'              // default blue
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 1,
          16, 4
        ],
        'line-opacity': 0.8
      }
    });

    // Add hover effect
    map.on('mouseenter', layerId, (e) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <p class="font-medium">${feature.properties.name || 'Unnamed path'}</p>
              <p class="text-sm text-gray-600">${feature.properties.designation || feature.properties.highway}</p>
            </div>
          `)
          .addTo(map);
      }
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });
  }
};

export const cleanupBikeLayer = (map: Map) => {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
  map.off('mouseenter', layerId);
  map.off('mouseleave', layerId);
};

export const updateBikeLayer = (map: Map, visible: boolean) => {
  if (!visible) {
    cleanupBikeLayer(map);
    return;
  }
  setupBikeLayer(map);
};