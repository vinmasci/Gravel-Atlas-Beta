'use client';

import React from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDrawModeContext } from '@/app/contexts/draw-mode-context';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

export function FloatingElevationProfile() {
  const drawMode = useDrawModeContext();
  
  if (!drawMode.isDrawing || drawMode.elevationProfile.length < 2) return null;

  const elevations = drawMode.elevationProfile.map(p => p.elevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationGain = drawMode.elevationProfile.reduce((gain, point, i) => {
    if (i === 0) return 0;
    const climb = point.elevation - drawMode.elevationProfile[i-1].elevation;
    return gain + (climb > 0 ? climb : 0);
  }, 0);
  const elevationLoss = drawMode.elevationProfile.reduce((loss, point, i) => {
    if (i === 0) return 0;
    const drop = point.elevation - drawMode.elevationProfile[i-1].elevation;
    return loss + (drop < 0 ? Math.abs(drop) : 0);
  }, 0);

  const totalDistance = drawMode.elevationProfile[drawMode.elevationProfile.length - 1].distance;

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 bg-background/95 backdrop-blur-sm border-t border-border"
      style={{
        height: '200px',
        zIndex: 50,
      }}
    >
      <div className="p-4 h-full">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm space-x-4">
            <span className="font-medium">Gain: {Math.round(elevationGain)}m</span>
            <span className="font-medium">Loss: {Math.round(elevationLoss)}m</span>
            <span>Dist: {totalDistance.toFixed(1)}km</span>
          </div>
          {drawMode.clearDrawing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={drawMode.clearDrawing}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={drawMode.elevationProfile}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="rgba(255,255,255,0.1)" 
              />
              <XAxis 
                dataKey="distance" 
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => `${value.toFixed(1)}km`}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                domain={[minElevation - 10, maxElevation + 10]}
                tickFormatter={(value) => `${Math.round(value)}m`}
                stroke="#666"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [`${Math.round(value)}m`, 'Elevation']}
                labelFormatter={(value: number) => `${value.toFixed(1)} km`}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone"
                dataKey="elevation"
                fill="#ef4444"
                fillOpacity={0.2}
                strokeWidth={0}
              />
              <Line
                type="monotone"
                dataKey="elevation"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}