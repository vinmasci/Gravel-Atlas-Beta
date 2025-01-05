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

// Add this helper function at the top with other constants
const getExpandedBounds = (map: Map) => {
  const bounds = map.getBounds();
  
  // Get the current bounds
  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  
  // Calculate the current width and height
  const width = east - west;
  const height = north - south;
  
  // Expand the bounds by 300% in each direction
  const expandedWest = west - (width * 3);
  const expandedEast = east + (width * 3);
  const expandedSouth = south - (height * 3);
  const expandedNorth = north + (height * 3);
  
  // Clamp longitude values to valid range (-180 to 180)
  const clampedWest = Math.max(-180, expandedWest);
  const clampedEast = Math.min(180, expandedEast);
  
  // Clamp latitude values to valid range (-90 to 90)
  const clampedSouth = Math.max(-90, expandedSouth);
  const clampedNorth = Math.min(90, expandedNorth);
  
  return `${clampedWest},${clampedSouth},${clampedEast},${clampedNorth}`;
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
      ['case',
        ['==', ['get', 'totalVotes'], 0], -1,
        ['floor', ['get', 'averageRating']]
      ],
      -1, '#00FFFF',   // Cyan for unrated (no votes)
      0, '#84CC16',    // lime-500 for 0 rating
      1, '#84CC16',    // lime-500
      2, '#EAB308',    // yellow-500
      3, '#F97316',    // orange-500
      4, '#EF4444',    // red-500
      5, '#991B1B',    // red-800
      6, '#450a0a',    // dark red/black
      '#00FFFF'        // Default to cyan
    ],
    'line-width': 1.5,
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
    'line-width': 2,
    'line-opacity': 1,
    'line-dasharray': [
      'case',
      ['==', ['typeof', ['get', 'surfaceType']], 'string'],  // First check if surfaceType exists
      [
        'match',
        ['get', 'surfaceType'],
        'paved', ['literal', [1]],
        'unpaved', ['literal', [2, 2]],
        'unknown', ['literal', [2, 2]],
        ['literal', [2, 2]]  // Default case
      ],
      ['literal', [2, 2]]  // Default if no surfaceType
    ]
  }
}, layerId);

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

export const updateSegmentColor = (map: Map, segmentId: string, newRating: number) => {
  // Get the source
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  if (!source) return;

  // Get the current data
  const currentData = (source as any)._data;
  if (!currentData?.features) return;

  // Update just the rating in the properties
  const updatedFeatures = currentData.features.map((feature: any) => {
    if (feature.properties.id === segmentId) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          averageRating: newRating
        }
      };
    }
    return feature;
  });

  // Update the source with new data
  source.setData({
    type: 'FeatureCollection',
    features: updatedFeatures
  });
};

export const updateSegmentLayer = async (
  map: Map, 
  visible: boolean,
  onSegmentClick?: SegmentClickHandler,
  updatedSegment?: any
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

    // If we have an updated segment, update just that one
    if (updatedSegment && source) {
      const currentData = (source as any)._data;
      if (currentData?.features) {
        const updatedFeatures = currentData.features.map((feature: any) => {
          if (feature?.properties?.id === updatedSegment._id) {
            return {
              type: 'Feature',
              geometry: feature.geometry, // Keep existing geometry
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
          features: updatedFeatures.filter(f => f && f.geometry)
        });
        return;
      }
    }

    // Fetch all segments if no update or initial load
    const bounds = map.getBounds();
    const boundsString = getExpandedBounds(map);
    const response = await fetch(`/api/segments?bounds=${boundsString}`);
    const data = await response.json();

    if (!data.segments) {
      console.error('No segments data received');
      return;
    }

    const features = data.segments
    .map((segment: any) => {
      if (!segment?.geojson?.geometry) {
        console.warn('Invalid segment data:', segment);
        return null;
      }
  
      // Add this logging to help debug surface types
      console.log('Processing segment surface types:', {
        id: segment._id,
        surfaceTypes: segment.metadata?.surfaceTypes,
        mappedType: segment.metadata?.surfaceTypes?.[0] || 'unknown'
      });
  
      return {
        type: 'Feature',
        geometry: segment.geojson.geometry,
        properties: {
          id: segment._id,
          title: segment.metadata?.title,
          length: segment.metadata?.length,
          userName: segment.userName,
          auth0Id: segment.auth0Id,
          averageRating: segment.stats?.averageRating,
          totalVotes: segment.stats?.totalVotes,
          surfaceType: segment.metadata?.surfaceTypes?.[0] || 'unknown',  // Add this line
          metadata: {
            elevationProfile: segment.metadata?.elevationProfile || [],
            elevationGain: segment.metadata?.elevationGain,
            elevationLoss: segment.metadata?.elevationLoss
          }
        }
      };
    })
      .filter(feature => feature !== null && feature.geometry);

    source.setData({
      type: 'FeatureCollection',
      features: features
    });
  } catch (error) {
    console.error('Error updating segment layer:', error);
  }
};