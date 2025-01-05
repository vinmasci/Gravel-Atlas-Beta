'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "../../app/hooks/use-toast";
import { Undo, RotateCcw, Save } from 'lucide-react';
import { Switch } from "../../components/ui/switch";
import { useMapContext } from '../../app/contexts/map-context';
import { useDrawMode } from '@/app/hooks/use-draw-mode';
import { FloatingElevationProfile } from '../segments/floating-elevation-profile';
import { useDrawModeContext } from '../../app/contexts/draw-mode-context';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";

// Add helper functions for elevation calculations
function calculateElevationGain(profile: { distance: number; elevation: number; }[]) {
  let gain = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].elevation - profile[i-1].elevation;
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

function calculateElevationLoss(profile: { distance: number; elevation: number; }[]) {
  let loss = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].elevation - profile[i-1].elevation;
    if (diff < 0) loss += Math.abs(diff);
  }
  return Math.round(loss);
}

export function DrawSegmentPanel() {
  const { map } = useMapContext();
  const { user } = useUser();
  const { toast } = useToast();
  
  // Local state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [segmentTitle, setSegmentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Debug mount
  useEffect(() => {
    console.log('DrawSegmentPanel mounted:', {
      timestamp: new Date().toISOString(),
      mapExists: !!map,
      userExists: !!user
    });
    return () => {
      console.log('DrawSegmentPanel unmounted:', {
        timestamp: new Date().toISOString()
      });
    };
  }, [map, user]);

  // Initialize draw mode hook
  const drawMode = useDrawModeContext();
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

  // Debug state changes
  useEffect(() => {
    console.log('DrawSegmentPanel state updated:', {
      timestamp: new Date().toISOString(),
      isDrawing,
      coordinatesCount: drawnCoordinates.length,
      elevationPointCount: elevationProfile.length,
      snapToRoad,
      showingSaveDialog: showSaveDialog,
      isSaving
    });
  }, [isDrawing, drawnCoordinates, elevationProfile, snapToRoad, showSaveDialog, isSaving]);

  // Set up map click handler once
  useEffect(() => {
    if (!map) return;

    console.log('Setting up map click handler:', {
      timestamp: new Date().toISOString(),
      isDrawing,
      mapExists: !!map
    });

    if (isDrawing) {
      map.on('click', handleClick);
      return () => {
        console.log('Removing map click handler');
        map.off('click', handleClick);
      };
    }
  }, [map, isDrawing, handleClick]);

  // Handler functions
  const handleDrawingToggle = useCallback(() => {
    console.log('Drawing toggle clicked:', {
      timestamp: new Date().toISOString(),
      currentState: {
        isDrawing,
        coordinates: drawnCoordinates.length,
        userExists: !!user
      }
    });

    if (!user) {
      console.log('No user, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please sign in to draw segments",
        variant: "destructive",
      });
      window.location.href = '/api/auth/login';
      return;
    }

    if (isDrawing) {
      console.log('Ending drawing mode:', {
        coordinatesDrawn: drawnCoordinates.length
      });
      
      if (drawnCoordinates.length > 1) {
        console.log('Opening save dialog');
        setShowSaveDialog(true);
      } else {
        console.log('Clearing drawing - insufficient points');
        clearDrawing();
      }
    } else {
      console.log('Starting drawing mode');
      startDrawing();
    }

    console.log('Drawing toggle complete:', {
      timestamp: new Date().toISOString(),
      newDrawingState: !isDrawing,
      coordinates: drawnCoordinates.length
    });
  }, [user, isDrawing, drawnCoordinates.length, clearDrawing, startDrawing, toast]);

  const handleSnapToggle = useCallback((enabled: boolean) => {
    console.log('Snap toggle clicked:', {
      timestamp: new Date().toISOString(),
      newState: enabled,
      currentCoordinates: drawnCoordinates.length
    });

    toggleSnapToRoad(enabled);
    toast({
      title: enabled ? "Snap to Road Enabled" : "Snap to Road Disabled",
      description: enabled 
        ? "Points will now snap to the nearest road" 
        : "Points will be placed exactly where you click",
    });
  }, [toggleSnapToRoad, toast, drawnCoordinates.length]);

  const handleSave = useCallback(async () => {
    console.log('Save attempt:', {
      timestamp: new Date().toISOString(),
      title: segmentTitle,
      coordinates: drawnCoordinates.length,
      elevationPoints: elevationProfile.length
    });

    if (!segmentTitle.trim()) {
      console.log('Save cancelled - no title');
      toast({
        title: "Title Required",
        description: "Please enter a title for your segment",
        variant: "destructive",
      });
      return;
    }
  
    setIsSaving(true);
    try {
      console.log('Finishing drawing for save');
      const segment = finishDrawing();
      if (!segment) {
        console.log('No segment data available');
        return;
      }
      
      // Get elevation profile from segment properties
      const segmentElevationProfile = segment.properties.elevationProfile;
  
      // Create GPX data
      console.log('Creating GPX data');
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
  
// Calculate elevation data
const elevationGain = calculateElevationGain(elevationProfile);
const elevationLoss = calculateElevationLoss(elevationProfile);

// Format data according to schema
// NEW CODE
console.log('Creating save payload with elevation data:', {
  profileLength: segment.elevationProfile?.length,
  samplePoints: segment.elevationProfile?.slice(0, 2)
});

// Calculate segment length
const lastPoint = elevationProfile[elevationProfile.length - 1];
const segmentLength = lastPoint ? Math.round(lastPoint.distance * 1000) : 0;  // Convert km to meters

const payload = {
  title: segmentTitle,
  gpxData,
  geojson: segment,  // Use the complete segment object
  metadata: {
    title: segmentTitle,
    length: segmentLength,
    elevationGain,
    elevationLoss,
    elevationProfile,
    surfaceTypes: segment.properties.surfaceTypes || ['unknown']
  }
};
  
      console.log('Sending save request');
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
  
      console.log('Save successful');
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
  }, [segmentTitle, finishDrawing, clearDrawing, toast, drawnCoordinates, elevationProfile]);

  const handleCancel = useCallback(() => {
    console.log('Save cancelled by user');
    setShowSaveDialog(false);
    setSegmentTitle('');
    clearDrawing();
  }, [clearDrawing]);

  console.log('DrawSegmentPanel render:', {
    timestamp: new Date().toISOString(),
    isDrawing,
    coordinatesCount: drawnCoordinates.length,
    showSaveDialog,  // <-- Fixed variable name
    isSaving
  });

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
    </div>
  );
}