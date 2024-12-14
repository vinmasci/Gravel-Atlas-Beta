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

    // Add the main line layer
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'match',
          ['floor', ['coalesce', ['get', 'averageRating'], -1]],
          -1, '#00FFFF',   // Cyan for unrated segments
          0, '#10B981',    // emerald-500
          1, '#84CC16',    // lime-500
          2, '#EAB308',    // yellow-500
          3, '#F97316',    // orange-500
          4, '#EF4444',    // red-500
          5, '#991B1B',    // red-800
          6, '#4C0519',    // Even darker red for hike-a-bike
          '#00FFFF'        // Default to cyan
        ],
        'line-width': 3,
        'line-opacity': 0.8
      }
    });

    // Add a black stroke layer that sits underneath
    map.addLayer({
      id: `${layerId}-stroke`,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#000000',
        'line-width': 5,
        'line-opacity': 0.3
      }
    }, layerId); // This ensures the stroke is rendered beneath the main line

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

  // Remove layers and source
  if (map.getLayer(`${layerId}-stroke`)) {
    map.removeLayer(`${layerId}-stroke`);
  }
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