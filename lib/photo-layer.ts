// lib/photo-layer.ts
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import type { PhotoDisplayData } from '@/app/types/photos';

let photoSourceAdded = false;
let photoLayerAdded = false;

export async function fetchPhotos(): Promise<PhotoDisplayData[]> {
  const response = await fetch('/api/photos');
  if (!response.ok) {
    throw new Error('Failed to fetch photos');
  }
  return response.json();
}

export function initializePhotoLayer(map: Map) {
  if (!photoSourceAdded) {
    map.addSource('photos', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
    photoSourceAdded = true;
  }

  map.loadImage('/icons/circle-camera-duotone-solid.png', (error, image) => {
    if (error) throw error;
    map.addImage('custom-marker', image!);
  });
  
  map.loadImage('/icons/circle-camera-duotone-solid.png', (error, image) => {
    if (error) throw error;
    map.addImage('single-photo', image!);
  });

  if (!photoLayerAdded) {
    // Add custom cluster HTML
    map.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'photos',
        filter: ['has', 'point_count'],
        layout: {
          'icon-image': 'custom-marker',
          'icon-size': 0.1,
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 0.8,
          'text-offset': [0, 0.1],
          'icon-allow-overlap': true,
          'text-allow-overlap': true
        }
    });

    // Individual photo points
    map.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'photos',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'single-photo',
          'icon-size': 0.1,
          'icon-allow-overlap': true
        }
    });

    // Add click handlers
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      (map.getSource('photos') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) return;

          map.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom
          });
        }
      );
    });

    map.on('click', 'unclustered-point', (e) => {
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const properties = e.features![0].properties;
      const { title, description, url, uploadedBy, dateTaken } = properties;

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const formattedDate = dateTaken ? new Date(dateTaken).toLocaleDateString() : 'Unknown date';

      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px'
      })
        .setLngLat(coordinates)
        .setHTML(`
          <div class="max-w-sm p-2">
            <img src="${url}" alt="${title}" class="w-full h-48 object-cover rounded-lg mb-3" />
            <h3 class="text-lg font-semibold mb-1">${title}</h3>
            ${description ? `<p class="text-sm text-gray-600 mb-2">${description}</p>` : ''}
            <div class="flex items-center gap-2 mb-2">
              <img 
                src="${properties.uploadedBy.picture || '/default-avatar.png'}" 
                alt="${properties.uploadedBy.name}"
                class="w-8 h-8 rounded-full"
              />
              <div>
                <div class="font-medium">${properties.uploadedBy.name}</div>
                <div class="text-sm text-gray-500">${formattedDate}</div>
              </div>
            </div>
          </div>
        `)
        .addTo(map);
    });

    // Add hover effects for clusters
    let hoverTimeout: NodeJS.Timeout;
    map.on('mouseenter', 'clusters', async (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      if (hoverTimeout) clearTimeout(hoverTimeout);
      
      hoverTimeout = setTimeout(async () => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        
        try {
          const source = map.getSource('photos') as mapboxgl.GeoJSONSource;
          const leaves = await new Promise((resolve, reject) => {
            source.getClusterLeaves(
              clusterId,
              4,
              0,
              (err, features) => {
                if (err) reject(err);
                else resolve(features);
              }
            );
          });

          const coordinates = (features[0].geometry as any).coordinates.slice();
          const totalCount = features[0].properties.point_count;
          const previewFeatures = leaves as any[];

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'cluster-preview-popup'
          })
            .setLngLat(coordinates)
            .setHTML(`
              <div class="flex gap-1 p-2 bg-white rounded-lg shadow-lg">
                ${previewFeatures.slice(0, 3).map((feature, i) => `
                  <div class="relative">
                    <img 
                      src="${feature.properties.url}" 
                      alt="${feature.properties.title}"
                      class="w-24 h-24 object-cover rounded-sm"
                    />
                    ${i === 2 && totalCount > 3 ? `
                      <div class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-sm">
                        <span class="text-white font-semibold">+${totalCount - 3}</span>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `)
            .addTo(map);
        } catch (error) {
          console.error('Error showing cluster preview:', error);
        }
      }, 300);
    });

    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
      if (hoverTimeout) clearTimeout(hoverTimeout);
      const popup = document.getElementsByClassName('cluster-preview-popup')[0];
      if (popup) popup.remove();
    });

    // Add hover effects for single photos
    let singlePhotoPopup: mapboxgl.Popup | null = null;
    map.on('mouseenter', 'unclustered-point', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const properties = e.features![0].properties;
      
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      singlePhotoPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'photo-marker-popup',
        maxWidth: '300px',
        offset: [0, -10]
      })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="photo-preview">
          <img 
            src="${properties.url}" 
            alt="${properties.title}"
            class="w-32 h-32 object-cover"
          />
        </div>
      `)
      .addTo(map);
    });
    
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
      if (singlePhotoPopup) {
        singlePhotoPopup.remove();
        singlePhotoPopup = null;
      }
    });

    photoLayerAdded = true;
  }
}

export async function updatePhotoLayer(map: Map, visible: boolean) {
  try {
    if (!map.getSource('photos')) {
      initializePhotoLayer(map);
    }

    const visibility = visible ? 'visible' : 'none';
    if (map.getLayer('clusters')) {
      map.setLayoutProperty('clusters', 'visibility', visibility);
      map.setLayoutProperty('unclustered-point', 'visibility', visibility);
    }

    if (visible) {
      const photos = await fetchPhotos();
      const geojson = {
        type: 'FeatureCollection',
        features: photos
          .filter(photo => photo.location)
          .map(photo => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [photo.location!.lng, photo.location!.lat]
            },
            properties: {
              id: photo.id,
              title: photo.title,
              description: photo.description,
              url: photo.url,
              uploadedBy: photo.uploadedBy,
              dateTaken: photo.dateTaken
            }
          }))
      };

      (map.getSource('photos') as mapboxgl.GeoJSONSource).setData(geojson as any);
    }
  } catch (error) {
    console.error('Error updating photo layer:', error);
  }
}