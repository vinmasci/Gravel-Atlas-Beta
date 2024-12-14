'use client';

import React, { useEffect, useRef } from 'react';
import {
  AreaChart,  // Change this
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

  useEffect(() => {
    const element = document.querySelector('[data-elevation-profile]');
    console.log('Elevation Profile Debug:', {
      isComponentMounted: true,
      elementExists: !!element,
      position: element?.getBoundingClientRect(),
      drawModeExists: !!drawMode,
      isDrawing: drawMode?.isDrawing,
      hasElevationData: drawMode?.elevationProfile?.length > 0,
      timestamp: new Date().toISOString()
    });
  }, [drawMode?.isDrawing, drawMode?.elevationProfile]);

  renderCount.current += 1;

  console.log('FloatingElevationProfile data:', {
    profileLength: drawMode?.elevationProfile?.length,
    firstFewPoints: drawMode?.elevationProfile?.slice(0, 3),
    elevation: drawMode?.elevationProfile?.map(p => p.elevation).slice(0, 3),
    distances: drawMode?.elevationProfile?.map(p => p.distance).slice(0, 3),
    timestamp: new Date().toISOString()
  });

  if (!drawMode?.isDrawing) {
    return null;
  }

  // Get actual elevation range for dynamic Y-axis domain
  const elevations = drawMode.elevationProfile.map(point => point.elevation);
  const minElevation = Math.min(...elevations, 0);
  const maxElevation = Math.max(...elevations, 100);
  const elevationPadding = (maxElevation - minElevation) * 0.1; // 10% padding

  // Empty state data for the chart
  const emptyData = [{ distance: 0, elevation: 0 }, { distance: 1, elevation: 0 }];
  const displayData = drawMode.elevationProfile.length >= 2 
    ? drawMode.elevationProfile 
    : emptyData;

  // Calculate the maximum distance for X-axis domain
  const maxDistance = Math.max(
    ...drawMode.elevationProfile.map(point => point.distance),
    1
  );

  return (
    <div 
      data-elevation-profile
      className="fixed mx-auto inset-x-0 bottom-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-4xl"
      style={{
        height: '200px',
        zIndex: 9999,
        left: '360px', // Account for sidebar
        right: '16px',
      }}
    >
      <div className="p-4 h-full">
        <div className="flex justify-between items-start mb-2">
          <div className="text-sm space-x-4">
            <span className="font-medium">Elevation Profile</span>
            {drawMode.elevationProfile.length >= 2 && (
              <>
                <span>Distance: {maxDistance.toFixed(1)}km</span>
                <span>Min: {Math.round(minElevation)}m</span>
                <span>Max: {Math.round(maxElevation)}m</span>
              </>
            )}
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
  <AreaChart data={displayData}>
    <defs>
      <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/> {/* Increased from 0.3 */}
      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2}/> {/* Increased from 0.1 */}
      </linearGradient>
    </defs>
    <CartesianGrid 
      strokeDasharray="3 3" 
      vertical={false} 
      stroke="rgba(255,255,255,0.1)" 
    />
    <XAxis 
      dataKey="distance" 
      type="number"
      domain={[0, Math.max(maxDistance, 1)]}
      tickFormatter={(value) => `${value.toFixed(1)}km`}
      stroke="#666"
      fontSize={12}
    />
    <YAxis 
      domain={[
        minElevation - elevationPadding,
        maxElevation + elevationPadding
      ]}
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
      stroke="#ef4444"
      strokeWidth={2}
      fill="url(#elevationGradient)"
      dot={false}
    />
  </AreaChart>
</ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}