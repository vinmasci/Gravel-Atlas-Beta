'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "@/app/hooks/use-toast";
import { Undo, RotateCcw, Save } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useMapContext } from '@/app/contexts/map-context';
import { useDrawMode } from '@/app/hooks/use-draw-mode';
import { FloatingElevationProfile } from '../segments/floating-elevation-profile';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DrawSegmentPanel() {
  const { map } = useMapContext();
  const { user } = useUser();
  const { toast } = useToast();
  
  // Local state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [segmentTitle, setSegmentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize draw mode hook
  const drawMode = useDrawMode(map);
  const { 
    isDrawing, 
    drawnCoordinates,
    elevationProfile,
    snapToRoad,
    startDrawing, 
    handleClick, 
    finishDrawing, 
    clearDrawing, 
    undoLastPoint,
    toggleSnapToRoad
  } = drawMode;

  // Set up map click handler once
  useEffect(() => {
    if (!map) return;

    if (isDrawing) {
      map.on('click', handleClick);
      return () => map.off('click', handleClick);
    }
  }, [map, isDrawing, handleClick]);

  // Handler functions
  const handleDrawingToggle = useCallback(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to draw segments",
        variant: "destructive",
      });
      window.location.href = '/api/auth/login';
      return;
    }

    if (isDrawing) {
      if (drawnCoordinates.length > 1) {
        setShowSaveDialog(true);
      } else {
        clearDrawing();
      }
    } else {
      startDrawing();
    }
  }, [user, isDrawing, drawnCoordinates.length, clearDrawing, startDrawing, toast]);

  const handleSnapToggle = useCallback((enabled: boolean) => {
    toggleSnapToRoad(enabled);
    toast({
      title: enabled ? "Snap to Road Enabled" : "Snap to Road Disabled",
      description: enabled 
        ? "Points will now snap to the nearest road" 
        : "Points will be placed exactly where you click",
    });
  }, [toggleSnapToRoad, toast]);

  const handleSave = useCallback(async () => {
    if (!segmentTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your segment",
        variant: "destructive",
      });
      return;
    }
  
    setIsSaving(true);
    try {
      const segment = finishDrawing();
      if (!segment) return;
  
      // Create GPX data
      const coordinates = segment.geometry.coordinates;
      const trackpoints = coordinates
        .map((coord: [number, number]) => {
          return `<trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`;
        })
        .join('\n      ');
  
      const gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Gravel Atlas Beta">
  <metadata>
    <n>${segmentTitle}<n>
  </metadata>
  <trk>
    <n>${segmentTitle}<n>
    <desc>color=#c0392b</desc>
    <trkseg>
      ${trackpoints}
    </trkseg>
  </trk>
</gpx>`;
  
      // Format data according to schema
      const payload = {
        title: segmentTitle,
        gpxData,
        geojson: {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: segment.geometry.coordinates
          },
          properties: {}
        }
      };
  
      const response = await fetch('/api/segments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || 'Failed to save segment');
      }
  
      toast({
        title: "Success",
        description: "Segment saved successfully",
      });
  
      setSegmentTitle('');
      setShowSaveDialog(false);
      clearDrawing();
    } catch (error: any) {
      console.error('Error saving segment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [segmentTitle, finishDrawing, clearDrawing, toast]);

  const handleCancel = useCallback(() => {
    setShowSaveDialog(false);
    setSegmentTitle('');
    clearDrawing();
  }, [clearDrawing]);

  return (
    <div>
      <div className="space-y-4">
        <Button 
          className={`w-full ${isDrawing ? 'bg-green-500 hover:bg-green-600' : ''}`}
          onClick={handleDrawingToggle}
        >
          {isDrawing ? 'Drawing Mode Active' : 'Start Drawing'}
        </Button>

        {isDrawing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-sm font-medium">Snap to Road</span>
                <p className="text-xs text-muted-foreground">
                  Automatically align points to the nearest road
                </p>
              </div>
              <Switch
                checked={snapToRoad}
                onCheckedChange={handleSnapToggle}
              />
            </div>

            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={drawnCoordinates.length === 0}
                onClick={undoLastPoint}
              >
                <Undo className="h-4 w-4 mr-1" />
                Undo
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={drawnCoordinates.length === 0}
                onClick={clearDrawing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={drawnCoordinates.length < 2}
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Segment</DialogTitle>
              <DialogDescription>
                Give your segment a title to save it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Input
                placeholder="Segment title"
                value={segmentTitle}
                onChange={(e) => setSegmentTitle(e.target.value)}
              />
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!segmentTitle.trim() || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Segment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isDrawing && (
  <FloatingElevationProfile 
    data={elevationProfile}
    onClose={clearDrawing}
    isDrawing={isDrawing}
  />
)}
    </div>
  );
}