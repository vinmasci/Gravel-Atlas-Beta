// lib/segment-layer.ts
import type { Map } from 'mapbox-gl';

export const updateSegmentLayer = async (map: Map, visible: boolean) => {
  try {
    const sourceId = 'segments-source';
    const layerId = 'segments-layer';

    // Remove existing layer and source if they exist
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    if (!visible) return;

    // Fetch segments from the API
    const response = await fetch('/api/segments');
    const data = await response.json();

    if (!data.segments) {
      console.error('No segments data received');
      return;
    }

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: data.segments.map((segment: any) => ({
          type: 'Feature',
          geometry: segment.geojson.geometry,
          properties: {
            id: segment._id,
            title: segment.metadata.title,
            length: segment.metadata.length,
            userName: segment.userName,
            averageRating: segment.stats.averageRating
          }
        }))
      }
    });

    // Add layer
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // Add hover effect
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });

    // Add click handler for segment details
    map.on('click', layerId, (e) => {
      if (!e.features?.[0]) return;
      
      const coordinates = e.lngLat;
      const properties = e.features[0].properties;

      const popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${properties.title}</h3>
            <p>Added by: ${properties.userName}</p>
            <p>Length: ${properties.length}m</p>
            ${properties.averageRating ? 
              `<p>Rating: ${properties.averageRating}/5</p>` : 
              '<p>No ratings yet</p>'
            }
          </div>
        `)
        .addTo(map);
    });

  } catch (error) {
    console.error('Error updating segments layer:', error);
  }
};