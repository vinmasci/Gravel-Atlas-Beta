// app/constants/map-styles.ts
'use client';

import { MapStyle, MapStyleConfig } from '../types/map';

export const MAP_STYLES: Record<MapStyle, MapStyleConfig> = {
  mapbox: {
    id: 'mapbox',
    title: 'Mapbox Outdoors',
    style: 'mapbox://styles/mapbox/outdoors-v12',
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