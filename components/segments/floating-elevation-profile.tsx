'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useDrawModeContext } from '../../app/contexts/draw-mode-context';

function calculateGrades(elevationProfile: ElevationPoint[]): number[] {
  const grades: number[] = [];
  
  for (let i = 0; i < elevationProfile.length - 1; i++) {
    const current = elevationProfile[i];
    let nextIndex = i + 1;
    while (
      nextIndex < elevationProfile.length - 1 && 
      (elevationProfile[nextIndex].distance - current.distance) * 1000 < 100
    ) {
      nextIndex++;
    }
    const next = elevationProfile[nextIndex];
    
    const rise = next.elevation - current.elevation;
    const run = (next.distance - current.distance) * 1000;
    const grade = (rise / run) * 100;
    
    grades.push(Math.round(grade * 10) / 10);
  }
  
  return grades;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
}

export function FloatingElevationProfile() {
  const drawMode = useDrawModeContext();
  const renderCount = useRef(0);
  const [hoverPoint, setHoverPoint] = useState<{distance: number; elevation: number} | null>(null);
  
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

  // Add hover interaction effect
  useEffect(() => {
    if (!hoverPoint || !drawMode?.map) return;

    // Remove existing marker
    const existingMarker = document.getElementById('elevation-hover-marker');
    if (existingMarker) existingMarker.remove();

    // Find the corresponding map coordinates
    const index = drawMode.elevationProfile.findIndex(
      point => Math.abs(point.distance - hoverPoint.distance) < 0.01 &&
      Math.abs(point.elevation - hoverPoint.elevation) < 0.1
    );
    
    if (index === -1) return;

    const coordinates = drawMode.line?.geometry.coordinates[index];
    if (!coordinates) return;

    // Create marker
    const marker = document.createElement('div');
    marker.id = 'elevation-hover-marker';
    marker.style.width = '12px';
    marker.style.height = '12px';
    marker.style.backgroundColor = '#009999'; // Darker cyan
    marker.style.border = '1px solid black';
    marker.style.borderRadius = '50%';
    marker.style.position = 'absolute';
    marker.style.transform = 'translate(-50%, -50%)';
    marker.style.pointerEvents = 'none';
    marker.style.zIndex = '1000';
    
    const point = drawMode.map.project(coordinates);
    marker.style.left = `${point.x}px`;
    marker.style.top = `${point.y}px`;
    
    drawMode.map.getCanvasContainer().appendChild(marker);

    return () => {
      marker.remove();
    };
  }, [hoverPoint, drawMode?.map, drawMode?.elevationProfile, drawMode?.line]);

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
    ? drawMode.elevationProfile.map((point, index, array) => {
        const grades = calculateGrades(array);
        return {
          ...point,
          grade: grades[index] || 0
        };
      })
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
        left: '360px',
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
                <span>Max Grade: {Math.max(...calculateGrades(drawMode.elevationProfile)).toFixed(1)}%</span>
                <span>Min Grade: {Math.min(...calculateGrades(drawMode.elevationProfile)).toFixed(1)}%</span>
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
            <AreaChart 
              data={displayData}
              onMouseMove={(props) => {
                if (!props?.activePayload?.[0]) {
                  setHoverPoint(null);
                  return;
                }
                setHoverPoint({
                  distance: props.activePayload[0].payload.distance,
                  elevation: props.activePayload[0].payload.elevation
                });
              }}
              onMouseLeave={() => setHoverPoint(null)}
            >
              <defs>
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[-20, 20]}
                tickFormatter={(value) => `${value}%`}
                stroke="#3b82f6"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'elevation') return [`${Math.round(value)}m`, 'Elevation'];
                  if (name === 'grade') return [`${value}%`, 'Grade'];
                  return [value, name];
                }}
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
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="grade"
                stroke="#3b82f6"
                strokeWidth={1}
                fill="url(#gradeGradient)"
                dot={false}
              />
              {hoverPoint && (
                <ReferenceDot
                  x={hoverPoint.distance}
                  y={hoverPoint.elevation}
                  r={4}
                  fill="white"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}