// components/segments/elevation-profile.tsx
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface ElevationProfileProps {
  data: ElevationPoint[];
  className?: string;
}

export function ElevationProfile({ data, className }: ElevationProfileProps) {
  if (data.length < 2) return null;

  const elevations = data.map(p => p.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationGain = data.reduce((gain, point, i) => {
    if (i === 0) return 0;
    const climb = point.elevation - data[i-1].elevation;
    return gain + (climb > 0 ? climb : 0);
  }, 0);

  return (
    <div className={`bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 ${className}`}>
      <div className="text-sm space-y-1 mb-2">
        <div>Elevation Gain: {Math.round(elevationGain)}m</div>
        <div>Min: {Math.round(minElevation)}m</div>
        <div>Max: {Math.round(maxElevation)}m</div>
      </div>
      <div className="h-[150px] w-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="distance" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value.toFixed(1)}km`}
            />
            <YAxis 
              domain={[minElevation - 10, maxElevation + 10]}
              tickFormatter={(value) => `${Math.round(value)}m`}
            />
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}m`, 'Elevation']}
              labelFormatter={(value: number) => `${value.toFixed(1)} km`}
            />
            <Line
              type="monotone"
              dataKey="elevation"
              stroke="#6366f1"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}