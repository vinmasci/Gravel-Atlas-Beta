// lib/segment-layer.ts
import mapboxgl, { Map } from 'mapbox-gl';

const sourceId = 'segments-source';
const layerId = 'segments-layer';

// Add this helper function here
const getRatingIconClass = (rating: number | undefined): string => {
  if (rating === undefined || rating === null) return 'text-cyan-500';
  const ratingFloor = Math.floor(rating);
  switch (ratingFloor) {
    case 0: return 'text-emerald-500';
    case 1: return 'text-lime-500';
    case 2: return 'text-yellow-500';
    case 3: return 'text-orange-500';
    case 4: return 'text-red-500';
    case 5: return 'text-red-800';
    case 6: return 'text-red-950';
    default: return 'text-cyan-500';
  }
};

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
  // Remove existing popup if it exists
  const existingPopup = document.querySelector('.segment-hover-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'segment-hover-popup',
    maxWidth: 'none'
  });

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
          6, '#450a0a',    // Even darker red for hike-a-bike (red-950)
          '#00FFFF'        // Default to cyan
        ],
        'line-width': 3,
        'line-opacity': 1
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
        'line-opacity': 1
      }
    }, layerId); // This ensures the stroke is rendered beneath the main line

// Add hover effect
map.on('mouseenter', layerId, (e) => {
  map.getCanvas().style.cursor = 'pointer';
  
  if (e.features && e.features.length > 0) {
    const feature = e.features[0];
    const coordinates = e.lngLat;
    const title = feature.properties.title;
    const rating = feature.properties.averageRating;
    
    // Create HTML content for popup
    const popupContent = document.createElement('div');
    popupContent.className = 'flex items-center gap-2 px-2 py-1 bg-background/95 backdrop-blur-sm border shadow-md rounded-md';
    popupContent.innerHTML = `
      <span class="text-sm font-medium">${title}</span>
      <i class="fa-solid ${rating !== undefined ? `fa-circle-${Math.floor(rating)}` : 'fa-circle-question'} ${getRatingIconClass(rating)}"></i>
    `;

    popup.setLngLat(coordinates).setDOMContent(popupContent).addTo(map);
  }
});

map.on('mousemove', layerId, (e) => {
  if (e.features && e.features.length > 0) {
    popup.setLngLat(e.lngLat);
  }
});

map.on('mouseleave', layerId, () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

    // Add click handler for segment details
    map.on('click', layerId, async (e) => {
      if (!e.features?.[0]) return;
      
      const properties = e.features[0].properties;
      
      try {
        // Fetch full segment data
        const response = await fetch(`/api/segments/${properties.id}`);
        if (!response.ok) throw new Error('Failed to fetch segment');
        const segmentData = await response.json();

        if (onSegmentClick) {
          onSegmentClick(segmentData);
        }
      } catch (error) {
        console.error('Error fetching segment:', error);
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

// In lib/segment-layer.ts, modify the updateSegmentLayer function:

export const updateSegmentLayer = async (
  map: Map, 
  visible: boolean,
  onSegmentClick?: SegmentClickHandler,
  updatedSegment?: any // Add this parameter
) => {
  try {
    if (!visible) {
      cleanupSegmentLayer(map);
      return;
    }

    // Set up the layer if it doesn't exist
    setupSegmentLayer(map, onSegmentClick);

    const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
    if (!source) return;

    // If we have an updated segment, just update that one feature
    if (updatedSegment) {
      const currentData = (source as any)._data;
      if (currentData && currentData.features) {
        const updatedFeatures = currentData.features.map((feature: any) => {
          if (feature.properties.id === updatedSegment._id) {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                averageRating: updatedSegment.stats?.averageRating,
                totalVotes: updatedSegment.stats?.totalVotes
              }
            };
          }
          return feature;
        });

        source.setData({
          type: 'FeatureCollection',
          features: updatedFeatures
        });
        return;
      }
    }

    // Otherwise, fetch and update all segments
    const bounds = map.getBounds();
    const boundsString = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
    const response = await fetch(`/api/segments?bounds=${boundsString}`);
    const data = await response.json();

    // Update source data
    source.setData({
      type: 'FeatureCollection',
      features: data.segments?.map((segment: any) => {
        // ... rest of your existing mapping code ...
      }).flat() || []
    });
  } catch (error) {
    console.error('Error updating segment layer:', error);
  }
};