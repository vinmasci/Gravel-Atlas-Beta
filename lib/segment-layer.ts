// lib/segment-layer.ts
import mapboxgl, { Map } from 'mapbox-gl';

const sourceId = 'segments-source';
const layerId = 'segments-layer';

interface SegmentClickHandler {
  (segment: {
    id: string;
    title: string;
    userName: string;
    length: number;
    averageRating?: number;
    totalVotes?: number;
  }): void;
}

const setupSegmentLayer = (map: Map, onSegmentClick?: SegmentClickHandler) => {
  // Only set up the layer if it doesn't exist
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

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
      
      const properties = e.features[0].properties;

      if (onSegmentClick) {
        onSegmentClick({
          id: properties.id,
          title: properties.title,
          userName: properties.userName,
          length: properties.length,
          averageRating: properties.averageRating,
          totalVotes: properties.totalVotes
        });
      }
    });
  }
};

const cleanupSegmentLayer = (map: Map) => {
  // Remove listeners
  map.off('mouseenter', layerId);
  map.off('mouseleave', layerId);
  map.off('click', layerId);

  // Remove layer and source
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
};

export const updateSegmentLayer = async (
  map: Map, 
  visible: boolean,
  onSegmentClick?: SegmentClickHandler
) => {
  try {
    if (!visible) {
      cleanupSegmentLayer(map);
      return;
    }

    // Set up the layer if it doesn't exist
    setupSegmentLayer(map, onSegmentClick);

    // Get map bounds for query
    const bounds = map.getBounds();
    const boundsString = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;

    // Fetch segments from the API
    const response = await fetch(`/api/segments?bounds=${boundsString}`);
    const data = await response.json();

    // Update source data
    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: data.segments?.map((segment: any) => ({
          type: 'Feature',
          geometry: segment.geojson.geometry,
          properties: {
            id: segment._id,
            title: segment.metadata.title,
            length: segment.metadata.length,
            userName: segment.userName,
            averageRating: segment.stats?.averageRating,
            totalVotes: segment.stats?.totalVotes
          }
        })) || []
      });
    }

  } catch (error) {
    console.error('Error updating segments layer:', error);
  }
};