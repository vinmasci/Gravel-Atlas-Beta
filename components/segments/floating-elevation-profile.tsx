'use client';

import React, { useEffect, useRef } from 'react';
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
  const renderCount = useRef(0);
  
  useEffect(() => {
    console.log('FloatingElevationProfile mounted:', {
      timestamp: new Date().toISOString(),
      drawModeAvailable: !!drawMode,
    });

    return () => {
      console.log('FloatingElevationProfile unmounted:', {
        timestamp: new Date().toISOString(),
      });
    };
  }, []);

  // Log every render
  renderCount.current += 1;
  console.log('FloatingElevationProfile render #' + renderCount.current, {
    timestamp: new Date().toISOString(),
    drawModeExists: !!drawMode,
    isDrawing: drawMode?.isDrawing,
    elevationProfileLength: drawMode?.elevationProfile?.length,
    fullDrawModeContext: drawMode
  });

  // Component visibility check
  useEffect(() => {
    console.log('DrawMode state changed:', {
      timestamp: new Date().toISOString(),
      isDrawing: drawMode?.isDrawing,
      elevationProfileLength: drawMode?.elevationProfile?.length
    });
  }, [drawMode?.isDrawing, drawMode?.elevationProfile]);

  // Debug render visibility
  if (!drawMode?.isDrawing) {
    console.log('Not rendering - drawing mode inactive', {
      timestamp: new Date().toISOString(),
      drawMode
    });
    return null;
  }

  // Empty state data for the chart
  const emptyData = [{ distance: 0, elevation: 0 }, { distance: 1, elevation: 0 }];
  const displayData = drawMode.elevationProfile.length >= 2 
    ? drawMode.elevationProfile 
    : emptyData;

  console.log('Preparing to render elevation profile:', {
    timestamp: new Date().toISOString(),
    displayData,
    isUsingEmptyData: drawMode.elevationProfile.length < 2,
    containerStyles: {
      position: 'fixed',
      zIndex: 50,
      left: '360px',
      right: '4px',
      bottom: '4px'
    }
  });

  return (
    <div 
      className="fixed left-[360px] right-4 bottom-4 bg-red-500/50 backdrop-blur-sm border border-border rounded-lg shadow-lg"
      style={{
        height: '200px',
        zIndex: 9999,
      }}
    >
      <div className="p-4 h-full">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm space-x-4">
            <span className="font-medium">DEBUG: Elevation Profile</span>
            <span>Render #{renderCount.current}</span>
            <span>Drawing: {drawMode.isDrawing ? 'YES' : 'NO'}</span>
            <span>Points: {drawMode.elevationProfile.length}</span>
            {drawMode.elevationProfile.length < 2 && (
              <span className="text-muted-foreground">Click points on the map to see elevation data</span>
            )}
          </div>
          {drawMode.clearDrawing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                console.log('Clear drawing clicked');
                drawMode.clearDrawing();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={displayData}
              onMouseMove={(e) => {
                console.log('Chart mouse move:', e);
              }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="rgba(255,255,255,0.1)" 
              />
              <XAxis 
                dataKey="distance" 
                type="number"
                domain={[0, 1]}
                tickFormatter={(value) => `${value.toFixed(1)}km`}
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
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