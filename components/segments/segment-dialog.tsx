// components/segments/segment-dialog.tsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const surfaceConditions = {
  '0': 'Smooth surface, any bike',
  '1': 'Well maintained, gravel bike',
  '2': 'Occasional rough surface',
  '3': 'Frequent loose surface',
  '4': 'Very rough surface',
  '5': 'Extremely rough surface, MTB',
  '6': 'Hike-A-Bike'
} as const;

interface SegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: {
    id: string;
    title: string;
    userName: string;
    length: number;
    averageRating?: number;
    totalVotes?: number;
  } | null;
}

export function SegmentDialog({ open, onOpenChange, segment }: SegmentDialogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState<keyof typeof surfaceConditions | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to vote on segments",
        variant: "destructive",
      });
      window.location.href = '/api/auth/login';
      return;
    }
  
    if (!rating || !segment) return;
  
    setIsVoting(true);
    try {
      const response = await fetch(`/api/segments/${segment._id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ condition: rating }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }
  
      const data = await response.json();
      
      // Update local state with full segment data
      if (onUpdate && data.segment) {
        onUpdate(data.segment);
      }
  
      // Force a refresh of the segments layer
      const map = (window as any).map;
      if (map) {
        await updateSegmentLayer(map, true, onUpdate);
      }
  
      toast({
        title: "Vote Submitted",
        description: "Thank you for your contribution!",
      });
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (!segment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{segment.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-1">
            <h4 className="font-medium">Details</h4>
            <p className="text-sm text-muted-foreground">Added by: {segment.userName}</p>
            <p className="text-sm text-muted-foreground">Length: {Math.round(segment.length)}m</p>
            {segment.averageRating !== undefined && (
              <p className="text-sm text-muted-foreground">
                Average Rating: {Number(segment.averageRating).toFixed(1)}/6
                {segment.totalVotes && ` (${segment.totalVotes} votes)`}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-muted-foreground">Rate Surface Condition</Label>
            <RadioGroup
              value={rating || undefined}
              onValueChange={(value) => setRating(value as keyof typeof surfaceConditions)}
            >
              {Object.entries(surfaceConditions).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`condition-${value}`} />
                  <Label htmlFor={`condition-${value}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
            
            <Button 
              onClick={handleVote}
              disabled={!rating || isVoting}
              className="w-full"
            >
              {isVoting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}