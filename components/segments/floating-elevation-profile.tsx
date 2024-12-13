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
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface FloatingElevationChartProps {
  data: ElevationPoint[];
  onClose?: () => void;
}

export function FloatingElevationChart({ data, onClose }: FloatingElevationChartProps) {
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
    <Card className="fixed left-1/2 bottom-32 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 w-[800px] h-[300px] z-50">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm space-x-4">
          <span className="font-medium">Elevation Gain: {Math.round(elevationGain)}m</span>
          <span>Min: {Math.round(minElevation)}m</span>
          <span>Max: {Math.round(maxElevation)}m</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis 
              dataKey="distance" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value.toFixed(1)}km`}
              stroke="currentColor"
              fontSize={12}
            />
            <YAxis 
              domain={[minElevation - 10, maxElevation + 10]}
              tickFormatter={(value) => `${Math.round(value)}m`}
              stroke="currentColor"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number) => [`${Math.round(value)}m`, 'Elevation']}
              labelFormatter={(value: number) => `${value.toFixed(1)} km`}
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                border: 'none',
                borderRadius: '4px',
                color: 'white'
              }}
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
    </Card>
  );
}