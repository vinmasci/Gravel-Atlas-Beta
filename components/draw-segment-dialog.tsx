'use client';

import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/app/hooks/use-toast";
import { MapPinOff } from 'lucide-react';
import { MapContext } from '@/app/contexts/map-context';
import { useDrawMode } from '@/app/hooks/use-draw-mode';

interface DrawSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDrawComplete: (data: any) => void;
}

export function DrawSegmentDialog({
  open,
  onOpenChange,
  onDrawComplete
}: DrawSegmentDialogProps) {
  const [title, setTitle] = useState('');
  const [drawnGeojson, setDrawnGeojson] = useState<any>(null);
  const { map } = useContext(MapContext);
  const { toast } = useToast();
  const {
    isDrawing,
    startDrawing,
    handleClick,
    finishDrawing,
    clearDrawing
  } = useDrawMode(map);

  useEffect(() => {
    if (!open) {
      clearDrawing();
      setTitle('');
      setDrawnGeojson(null);
    } else {
      // Start drawing immediately when dialog opens
      startDrawing();
    }
  }, [open, clearDrawing, startDrawing]);

  useEffect(() => {
    if (!map) return;

    const clickHandler = (e: mapboxgl.MapMouseEvent) => {
      handleClick(e);
    };

    const dblClickHandler = (e: mapboxgl.MapMouseEvent) => {
      e.preventDefault();
      const geojson = finishDrawing();
      if (geojson) {
        setDrawnGeojson(geojson);
      }
    };

    if (isDrawing) {
      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);
    }

    return () => {
      map.off('click', clickHandler);
      map.off('dblclick', dblClickHandler);
    };
  }, [map, isDrawing, handleClick, finishDrawing]);

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
      const response = await fetch('/api/segments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          geojson: drawnGeojson,
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
      onDrawComplete(await response.json());
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save segment",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Draw New Segment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isDrawing ? (
            <Alert>
              <MapPinOff className="h-4 w-4" />
              <AlertDescription>
                Click on the map to draw. Double click to finish.
              </AlertDescription>
            </Alert>
          ) : drawnGeojson ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter segment title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    clearDrawing();
                    startDrawing();
                    setDrawnGeojson(null);
                  }}
                >
                  Redraw
                </Button>
                <Button onClick={handleSave}>
                  Save Segment
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                clearDrawing();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}