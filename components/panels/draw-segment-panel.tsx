'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "@/app/hooks/use-toast";
import { Undo, RotateCcw, Save, Grid } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export function DrawSegmentPanel() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [snapToRoad, setSnapToRoad] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

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
    setIsDrawingMode(!isDrawingMode);
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
              disabled={!isDrawingMode}
              onClick={() => console.log('Undo')}
            >
              <Undo className="h-4 w-4 mr-1" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isDrawingMode}
              onClick={() => console.log('Reset')}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isDrawingMode}
              onClick={() => console.log('Save')}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}