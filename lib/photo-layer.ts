// lib/photo-layer.ts
import mapboxgl from 'mapbox-gl';
import type { Map } from 'mapbox-gl';
import type { PhotoDisplayData } from '@/app/types/photos';

// Add the preloadImage function here
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

let photoSourceAdded = false;
let photoLayerAdded = false;

export async function fetchPhotos(): Promise<PhotoDisplayData[]> {
  console.log('Fetching photos...');
  const response = await fetch('/api/photos');
  if (!response.ok) {
    console.error('Failed to fetch photos:', response.status, response.statusText);
    throw new Error('Failed to fetch photos');
  }
  const data = await response.json();
  console.log('Fetched photos data:', {
    total: data.length,
    firstPhoto: data[0]
  });
  return data;
}

export function initializePhotoLayer(map: Map) {
  console.log('Initializing photo layer...');
  
  if (!photoSourceAdded) {
    console.log('Adding photos source...');
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
    if (error) {
      console.error('Error loading custom-marker image:', error);
      throw error;
    }
    map.addImage('custom-marker', image!);
  });
  
  map.loadImage('/icons/circle-camera-duotone-solid.png', (error, image) => {
    if (error) {
      console.error('Error loading single-photo image:', error);
      throw error;
    }
    map.addImage('single-photo', image!);
  });

  if (!photoLayerAdded) {
    console.log('Adding map layers...');
    
    // Add custom cluster HTML
    map.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'photos',
        filter: ['has', 'point_count'],
        layout: {
          'icon-image': 'custom-marker',
          'icon-size': 0.009,  // Change from 0.1 to 0.05
          'icon-rotate': 180,  // Add this line
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
          'icon-size': 0.009,  // Change from 0.1 to 0.05
          'icon-rotate': 180,  // Add this line
          'icon-allow-overlap': true
        }
    });

    // Add click handlers
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });
      const clusterId = features[0].properties.cluster_id;
      console.log('Cluster clicked:', { clusterId });
      
      (map.getSource('photos') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err) {
            console.error('Error getting cluster zoom:', err);
            return;
          }

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
        
        // Parse uploadedBy
        let uploadedBy;
        try {
          uploadedBy = JSON.parse(properties.uploadedBy);
        } catch (error) {
          console.error('Error parsing uploadedBy:', error);
          uploadedBy = { name: 'Unknown user', picture: '' };
        }
    
        const { title, description, url, dateTaken } = properties;
        
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
    
        // Format date - check both timestamp and string formats
        const formatDate = (dateValue: any) => {
          try {
            console.log('Date value:', dateValue, typeof dateValue);
            const date = new Date(typeof dateValue === 'string' ? parseInt(dateValue) : dateValue);
            if (isNaN(date.getTime())) {
              console.log('Invalid date from:', dateValue);
              return 'Invalid Date';
            }
            return date.toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (error) {
            console.error('Date parsing error:', error);
            return 'Invalid Date';
          }
        };

        const popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px',
            className: 'photo-detail-popup'
          })
          .setLngLat(coordinates)
          .setHTML(`
            <!-- Add FontAwesome kit inside popup -->
            <script src="https://kit.fontawesome.com/b02e210188.js" crossorigin="anonymous"></script>
            <link rel="stylesheet" href="https://kit.fontawesome.com/b02e210188.css" crossorigin="anonymous">
            
            <div class="max-w-sm p-2 bg-black/80 text-white">
              <img src="${url}" alt="${title}" class="w-full h-48 object-cover rounded-lg mb-3" />
              <div class="space-y-2">
                ${description ? `<p class="text-sm opacity-90">${description}</p>` : ''}
                <div class="flex flex-col gap-2">
                  <div class="flex items-center gap-2">
                    ${uploadedBy.picture ? `
                      <img 
                        src="${uploadedBy.picture}" 
                        alt="${uploadedBy.name}"
                        class="w-8 h-8 rounded-full border border-white/20"
                      />
                    ` : ''}
                    <div>
                      <div class="font-medium text-sm">${uploadedBy.name}</div>
                      <div class="text-xs opacity-75">${formatDate(dateTaken)}</div>
                    </div>
                  </div>
                  
                  <div class="flex gap-3 text-sm">
                    ${uploadedBy.website ? `
                      <a href="${uploadedBy.website}" target="_blank" rel="noopener noreferrer" class="text-white/70 hover:text-white transition-colors">
                        <i class="fa-solid fa-globe"></i>
                      </a>
                    ` : ''}
                    
                    ${uploadedBy.socialLinks?.instagram ? `
                      <a href="${uploadedBy.socialLinks.instagram}" target="_blank" rel="noopener noreferrer" class="text-white/70 hover:text-[#E1306C] transition-colors">
                        <i class="fa-brands fa-instagram"></i>
                      </a>
                    ` : ''}
          
                    ${uploadedBy.socialLinks?.strava ? `
                      <a href="${uploadedBy.socialLinks.strava}" target="_blank" rel="noopener noreferrer" class="text-white/70 hover:text-[#FC4C02] transition-colors">
                        <i class="fa-brands fa-strava"></i>
                      </a>
                    ` : ''}
          
                    ${uploadedBy.socialLinks?.facebook ? `
                      <a href="${uploadedBy.socialLinks.facebook}" target="_blank" rel="noopener noreferrer" class="text-white/70 hover:text-[#4267B2] transition-colors">
                        <i class="fa-brands fa-facebook"></i>
                      </a>
                    ` : ''}
                  </div>
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

      // Show loading state first
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'cluster-preview-popup'
      })
      .setLngLat(coordinates)
      .setHTML(`
        <div class="flex gap-1 p-2 bg-white rounded-lg shadow-lg">
          ${Array(Math.min(3, previewFeatures.length)).fill(0).map(() => `
            <div class="w-24 h-24 animate-pulse bg-gray-200 rounded-sm"></div>
          `).join('')}
        </div>
      `)
      .addTo(map);

      // Preload all images in parallel
      await Promise.all(previewFeatures.slice(0, 3).map(feature => 
        preloadImage(feature.properties.url)
      ));

      // Update popup with loaded images
      popup.setHTML(`
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
      `);
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
map.on('mouseenter', 'unclustered-point', async (e) => {
  map.getCanvas().style.cursor = 'pointer';
  
  const coordinates = (e.features![0].geometry as any).coordinates.slice();
  const properties = e.features![0].properties;
  
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  // Show loading popup immediately
  singlePhotoPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'photo-marker-popup',
    maxWidth: '120px',
    offset: [0, -10]
  })
  .setLngLat(coordinates)
  .setHTML(`
    <div class="photo-preview">
      <div class="loading-placeholder animate-pulse bg-gray-200 w-full h-full"></div>
    </div>
  `)
  .addTo(map);

  try {
    // Preload the image
    await preloadImage(properties.url);
    
    // Only update popup if it still exists (mouse hasn't left)
    if (singlePhotoPopup) {
      singlePhotoPopup.setHTML(`
        <div class="photo-preview">
          <img 
            src="${properties.url}" 
            alt="${properties.title}"
            class="object-cover"
          />
        </div>
      `);
    }
  } catch (error) {
    console.error('Error loading image:', error);
    // Show error state if needed
    if (singlePhotoPopup) {
      singlePhotoPopup.setHTML(`
        <div class="photo-preview">
          <div class="error-state">Failed to load image</div>
        </div>
      `);
    }
  }
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
    console.log('Updating photo layer, visible:', visible);
    
    if (!map.getSource('photos')) {
      initializePhotoLayer(map);
    }

    const visibility = visible ? 'visible' : 'none';
    if (map.getLayer('clusters')) {
      map.setLayoutProperty('clusters', 'visibility', visibility);
      map.setLayoutProperty('unclustered-point', 'visibility', visibility);
    }

    if (visible) {
      console.log('Fetching photos for layer update...');
      const photos = await fetchPhotos();
      console.log('Creating GeoJSON from photos:', {
        total: photos.length,
        firstPhoto: photos[0]
      });
      
      const geojson = {
        type: 'FeatureCollection',
        features: photos
          .filter(photo => photo.location)
          .map(photo => {
            const feature = {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [photo.location!.lng, photo.location!.lat]
                },
                properties: {
                    id: photo.id,
                    title: photo.originalName || 'Untitled',
                    description: photo.caption || '',
                    url: photo.url,
                    uploadedBy: JSON.stringify({
                      id: photo.uploadedBy.id,
                      name: photo.uploadedBy.name,
                      picture: photo.uploadedBy.picture
                    }),
                    dateTaken: photo.dateTaken  // This should now be a timestamp string
                  }
              };
            console.log('Created feature:', {
              id: feature.properties.id,
              uploadedBy: feature.properties.uploadedBy
            });
            
            return feature;
          })
      };

      console.log('Setting data source with features:', geojson.features.length);
      (map.getSource('photos') as mapboxgl.GeoJSONSource).setData(geojson as any);
    }
  } catch (error) {
    console.error('Error updating photo layer:', error);
  }
}