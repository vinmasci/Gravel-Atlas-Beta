// app/types/map.ts
'use client';

export type MapStyle = 'mapbox' | 'osm-cycle' | 'google-standard' | 'google-hybrid' | 'google-streetview';

export interface MapStyleConfig {
  id: MapStyle;
  title: string;
  style: string | any;
  type: 'mapbox' | 'google' | 'raster';
}