'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "@/app/hooks/use-toast";
import { Undo, RotateCcw, Save, Grid } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { useMapContext } from '@/app/contexts/map-context';
import { useDrawMode } from '@/app/hooks/use-draw-mode';
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
  const { 
    isDrawing, 
    drawnCoordinates, 
    snapToRoad,
    startDrawing, 
    handleClick, 
    finishDrawing, 
    clearDrawing, 
    undoLastPoint,
    toggleSnapToRoad
  } = useDrawMode(map);
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [segmentTitle, setSegmentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  // Set up map click handler
  useEffect(() => {
    if (!map) return;

    if (isDrawing) {
      map.on('click', handleClick);
    } else {
      map.off('click', handleClick);
    }

    return () => {
      if (map) {
        map.off('click', handleClick);
      }
    };
  }, [map, isDrawing, handleClick]);

  const handleDrawingToggle = () => {
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
  };

  const handleSnapToggle = (enabled: boolean) => {
    toggleSnapToRoad(enabled);
    toast({
      title: enabled ? "Snap to Road Enabled" : "Snap to Road Disabled",
      description: enabled 
        ? "Points will now snap to the nearest road" 
        : "Points will be placed exactly where you click",
    });
  };

  const handleSave = async () => {
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
  
      console.log('Original segment:', segment);
  
      // Format data according to our schema
      const payload = {
        title: segmentTitle,
        geojson: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: segment.geometry.coordinates
          },
          properties: {}
        }
      };
  
      console.log('Sending payload:', payload);
  
      const response = await fetch('/api/segments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const responseData = await response.json();
      console.log('Response:', {
        status: response.status,
        data: responseData
      });
  
      if (!response.ok) {
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
      console.error('Error saving segment:', {
        message: error.message,
        stack: error.stack,
        error
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to save segment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowSaveDialog(false);
    setSegmentTitle('');
    clearDrawing();
  };

  return (
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
  );
}