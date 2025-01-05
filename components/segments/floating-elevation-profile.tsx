'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  let currentIndex = 0;

  while (currentIndex < elevationProfile.length - 1) {
    const startPoint = elevationProfile[currentIndex];
    let endIndex = currentIndex + 1;

    // Find the point that's closest to 100m away
    while (
      endIndex < elevationProfile.length - 1 && 
      (elevationProfile[endIndex].distance - startPoint.distance) < 0.1 // 0.1km = 100m
    ) {
      endIndex++;
    }

    const endPoint = elevationProfile[endIndex];
    const rise = endPoint.elevation - startPoint.elevation;
    const run = (endPoint.distance - startPoint.distance) * 1000; // Convert to meters

    // Prevent division by zero and handle invalid values
    const grade = run === 0 ? 0 : (rise / run) * 100;
    const validGrade = isFinite(grade) ? Math.round(grade * 10) / 10 : 0;
    
    // Apply this grade to all points in the 100m segment
    for (let i = currentIndex; i <= endIndex; i++) {
      grades.push(validGrade);
    }
    
    currentIndex = endIndex;
  }

  // If we have remaining points, use the last calculated grade
  while (grades.length < elevationProfile.length) {
    grades.push(grades[grades.length - 1] || 0);
  }
  
  return grades;
}

function getGradeColor(grade: number): string {
  const absGrade = Math.abs(grade);
  if (absGrade < 2) return '#84CC16';    // lime-500
  if (absGrade < 4) return '#84CC16';    // lime-500
  if (absGrade < 6) return '#EAB308';    // yellow-500
  if (absGrade < 8) return '#F97316';    // orange-500
  if (absGrade < 10) return '#EF4444';   // red-500
  if (absGrade < 14) return '#991B1B';   // red-800
  return '#450a0a';                      // red-950
}

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface DisplayDataPoint extends ElevationPoint {
  grade: number;
  gradeColor: string;
}

export function FloatingElevationProfile() {
  const drawMode = useDrawModeContext();
  console.log('DrawMode in FloatingElevationProfile:', {
    roadStats: drawMode.roadStats,
    isDrawing: drawMode.isDrawing
  });
  const [hoverPoint, setHoverPoint] = useState<ElevationPoint | null>(null);

  // Calculate display data and related values using useMemo
  const {
    displayData,
    minElevation,
    maxElevation,
    elevationPadding,
    maxDistance,
    gradeSegments,
    maxGrade,
    minGrade
  } = useMemo(() => {
    if (!drawMode?.isDrawing || !drawMode.elevationProfile) {
      return {
        displayData: [{ distance: 0, elevation: 0, grade: 0, gradeColor: '#84CC16' }],
        minElevation: 0,
        maxElevation: 100,
        elevationPadding: 10,
        maxDistance: 1,
        gradeSegments: [],
        maxGrade: 0,
        minGrade: 0
      };
    }

    const elevations = drawMode.elevationProfile.map(point => point.elevation);
    const minElev = Math.min(...elevations, 0);
    const maxElev = Math.max(...elevations, 100);
    const padding = (maxElev - minElev) * 0.1;
    const maxDist = Math.max(
      ...drawMode.elevationProfile.map(point => point.distance),
      1
    );

    if (drawMode.elevationProfile.length < 2) {
      return {
        displayData: [{ distance: 0, elevation: 0, grade: 0, gradeColor: '#84CC16' }],
        minElevation: minElev,
        maxElevation: maxElev,
        elevationPadding: padding,
        maxDistance: maxDist,
        gradeSegments: [],
        maxGrade: 0,
        minGrade: 0
      };
    }

    const grades = calculateGrades(drawMode.elevationProfile);
    const data = drawMode.elevationProfile.map((point, index) => ({
      ...point,
      grade: grades[index] || 0,
      gradeColor: getGradeColor(grades[index] || 0)
    }));

    // Create segments for coloring based on grade with overlap at transition points
    const segments = [];
    let currentColor = data[0].gradeColor;
    let currentSegment = [data[0]];

    for (let i = 1; i < data.length; i++) {
      if (data[i].gradeColor === currentColor) {
        currentSegment.push(data[i]);
      } else {
        // Add the transition point to both segments to ensure no gaps
        currentSegment.push(data[i]);
        segments.push({ points: currentSegment, color: currentColor });
        currentColor = data[i].gradeColor;
        currentSegment = [data[i - 1], data[i]]; // Include previous point for continuity
      }
    }
    segments.push({ points: currentSegment, color: currentColor });

    const maxGrade = Math.max(...grades);
    const minGrade = Math.min(...grades);

    return {
      displayData: data,
      minElevation: minElev,
      maxElevation: maxElev,
      elevationPadding: padding,
      maxDistance: maxDist,
      gradeSegments: segments,
      maxGrade,
      minGrade
    };
  }, [drawMode?.isDrawing, drawMode?.elevationProfile]);

  // Map hover effect
  useEffect(() => {
    if (!hoverPoint || !drawMode?.map) return;

    const existingMarker = document.getElementById('elevation-hover-marker');
    if (existingMarker) existingMarker.remove();

    const index = drawMode.elevationProfile.findIndex(
      point => Math.abs(point.distance - hoverPoint.distance) < 0.01 &&
      Math.abs(point.elevation - hoverPoint.elevation) < 0.1
    );
    
    if (index === -1) return;

    const coordinates = drawMode.line?.geometry.coordinates[index];
    if (!coordinates) return;

    const marker = document.createElement('div');
    marker.id = 'elevation-hover-marker';
    marker.style.width = '12px';
    marker.style.height = '12px';
    marker.style.backgroundColor = '#009999';
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

  if (!drawMode?.isDrawing) {
    return null;
  }

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
                <span>Max Grade: {maxGrade.toFixed(1)}%</span>
                <span>Min Grade: {minGrade.toFixed(1)}%</span>
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
              onClick={() => drawMode.clearDrawing()}
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
                hide={true}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2 text-xs" style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: '400'
                      }}>
                        <p className="mb-1">{label.toFixed(1)} km</p>
                        <p style={{ color: '#ef4444' }}>Elevation: {Math.round(payload[0].value)}m</p>
                        <p style={{ color: '#3b82f6' }}>Grade: {payload[0].payload.grade.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
{/* Render colored grade segments */}
{gradeSegments.map((segment, index) => (
                <Area
                  key={index}
                  type="monotone"
                  data={segment.points}
                  dataKey="elevation"
                  stroke={segment.color}
                  strokeWidth={0.9}
                  fill={segment.color}
                  fillOpacity={0.4}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                >
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={segment.color} stopOpacity={0.4}/>
                      <stop offset="100%" stopColor={segment.color} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </Area>
              ))}

              {/* Render top stroke line */}
              <Area
                type="monotone"
                data={displayData}
                dataKey="elevation"
                stroke="rgba(255,255,255,0.0001)"
                strokeWidth={0.00000001}
                fill="none"
                dot={false}
                isAnimationActive={false}
                connectNulls
              />

              {hoverPoint && (
                <ReferenceDot
                  x={hoverPoint.distance}
                  y={hoverPoint.elevation}
                  r={4}
                  fill="charcoal"
                  stroke="white"
                  strokeWidth={1}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Road stats section */}
        {drawMode.roadStats && drawMode.roadStats.totalLength > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t pt-4">
            <div>
              <h3 className="font-medium mb-2">Highway Types</h3>
              <div className="space-y-1">
                {Object.entries(drawMode.roadStats.highways)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, length]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <span>{((length / drawMode.roadStats.totalLength) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Surface Types</h3>
              <div className="space-y-1">
                {Object.entries(drawMode.roadStats.surfaces)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, length]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <span>{((length / drawMode.roadStats.totalLength) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}