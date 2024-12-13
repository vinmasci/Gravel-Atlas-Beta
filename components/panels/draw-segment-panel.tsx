'use client';

import React, { useState, useContext, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "@/app/hooks/use-toast";
import { Undo, RotateCcw, Save, Grid } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { MapContext } from '@/app/contexts/map-context';
import { useDrawMode } from '@/app/hooks/use-draw-mode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

export function DrawSegmentPanel() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [snapToRoad, setSnapToRoad] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const { user } = useUser();
  const { toast } = useToast();
  const { map } = useContext(MapContext);
  const {
    isDrawing,
    drawnCoordinates,
    startDrawing,
    handleClick,
    finishDrawing,
    clearDrawing,
    undoLastPoint
  } = useDrawMode(map);

  useEffect(() => {
    if (!map) return;

    if (isDrawingMode) {
      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        handleClick(e);
      };

      map.on('click', clickHandler);
      return () => {
        map.off('click', clickHandler);
      };
    }
  }, [map, isDrawingMode, handleClick]);

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
    
    if (!isDrawingMode) {
      startDrawing();
    } else {
      clearDrawing();
    }
    setIsDrawingMode(!isDrawingMode);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your segment",
        variant: "destructive",
      });
      return;
    }

    try {
      const geojson = finishDrawing();
      if (!geojson) {
        toast({
          title: "Error",
          description: "No segment drawn",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/segments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geojson,
          metadata: {
            title
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save segment');
      }

      toast({
        title: "Success",
        description: "Segment saved successfully",
      });
      setIsSaveDialogOpen(false);
      setIsDrawingMode(false);
      clearDrawing();
      setTitle('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save segment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        className={`w-full ${isDrawingMode ? 'bg-green-500 hover:bg-green-600' : ''}`}
        onClick={handleDrawingToggle}
      >
        {isDrawingMode ? 'Drawing Mode Active' : 'Start Drawing'}
      </Button>

      {isDrawingMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Snap to Road</span>
            <Switch
              checked={snapToRoad}
              onCheckedChange={setSnapToRoad}
            />
          </div>

          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={!drawnCoordinates.length}
              onClick={undoLastPoint}
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!drawnCoordinates.length}
              onClick={clearDrawing}
            >
              <RotatCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={drawnCoordinates.length < 2}
              onClick={() => setIsSaveDialogOpen(true)}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Segment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter segment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}