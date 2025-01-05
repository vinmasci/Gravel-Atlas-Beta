// app/constants/map-styles.ts
'use client';

import { MapStyle, MapStyleConfig } from '../types/map';

export const MAP_STYLES: Record<MapStyle, MapStyleConfig> = {
  frank: {
    id: 'frank',
    title: 'Main',  // You can change this title to whatever you want
    style: 'mapbox://styles/vinmasci/cm5j8d1ds002d01q08tf019dv',
    type: 'mapbox'
},
  mapbox: {
    id: 'mapbox',
    title: 'Mapbox Streets',
    style: 'mapbox://styles/mapbox/streets-v12',
    type: 'mapbox'
  },
  'osm-cycle': {
    id: 'osm-cycle',
    title: 'OSM Cycle',
    style: {
      version: 8,
      sources: {
        'osm-cycle': {
          type: 'raster',
          tiles: [
            `https://tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=${process.env.NEXT_PUBLIC_THUNDERFOREST_API_KEY}`
          ],
          tileSize: 256,
          scheme: 'xyz',
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [{
        id: 'osm-cycle-layer',
        type: 'raster',
        source: 'osm-cycle',
        minzoom: 0,
        maxzoom: 22
      }],
      sprite: "",
      glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}",
      projection: {
        name: 'mercator'
      }
    },
    type: 'raster'
  },
  'google-standard': {
    id: 'google-standard',
    title: 'Google Maps',
    style: 'roadmap',
    type: 'google'
  },
  'google-hybrid': {
    id: 'google-hybrid',
    title: 'Google Hybrid',
    style: 'hybrid',
    type: 'google'
  },
  'google-satellite': {
    id: 'google-satellite',
    title: 'Google Satellite',
    style: 'satellite',
    type: 'google'
  }
};

export type MapProvider = 'mapbox' | 'google' | 'osm';

export const getProviderFromStyle = (style: MapStyle): MapProvider => {
  if (style.startsWith('google')) return 'google';
  if (style === 'osm-cycle') return 'osm';
  return 'mapbox';
};