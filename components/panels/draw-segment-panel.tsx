'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DrawSegmentDialog } from '@/components/draw-segment-dialog';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from "@/app/hooks/use-toast";

export function DrawSegmentPanel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  const handleStartDrawing = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to draw segments",
        variant: "destructive",
      });
      window.location.href = '/api/auth/login';
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <Button 
        className="w-full" 
        onClick={handleStartDrawing}
      >
        Start Drawing
      </Button>

      <DrawSegmentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onDrawComplete={(data) => {
          console.log('Draw complete:', data);
          setIsDialogOpen(false);
        }}
      />
    </div>
  );
}