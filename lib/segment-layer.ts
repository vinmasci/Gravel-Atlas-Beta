// lib/segment-layer.ts
import mapboxgl, { Map } from 'mapbox-gl';

const cleanupLayerAndSource = (map: Map, layerId: string, sourceId: string) => {
  // Remove listeners first
  map.off('mouseenter', layerId);
  map.off('mouseleave', layerId);
  map.off('click', layerId);

  // Remove layer if it exists
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  
  // Remove source if it exists
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
};

export const updateSegmentLayer = async (map: Map, visible: boolean) => {
  const sourceId = 'segments-source';
  const layerId = 'segments-layer';

  try {
    // Clean up existing layer and source
    cleanupLayerAndSource(map, layerId, sourceId);

    // If not visible, we're done
    if (!visible) return;

    // Get map bounds for query
    const bounds = map.getBounds();
    const boundsString = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Fetch segments from the API
    const response = await fetch(`/api/segments?bounds=${boundsString}`);
    const data = await response.json();

    if (!data.segments || !data.segments.length) {
      console.log('No segments found in this area');
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
            averageRating: segment.stats?.averageRating
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

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${properties.title}</h3>
            <p>Added by: ${properties.userName}</p>
            <p>Length: ${Math.round(properties.length)}m</p>
            ${properties.averageRating ? 
              `<p>Rating: ${Number(properties.averageRating).toFixed(1)}/5</p>` : 
              '<p>No ratings yet</p>'
            }
          </div>
        `)
        .addTo(map);
    });

  } catch (error) {
    console.error('Error updating segments layer:', error);
    // Clean up on error
    cleanupLayerAndSource(map, layerId, sourceId);
  }
};