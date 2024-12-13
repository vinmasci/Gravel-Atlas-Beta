// components/segments/segment-sheet.tsx
'use client';

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const surfaceConditions = {
  '0': 'Smooth surface, any bike',
  '1': 'Well maintained, gravel bike',
  '2': 'Occasional rough surface',
  '3': 'Frequent loose surface',
  '4': 'Very rough surface',
  '5': 'Extremely rough surface, MTB',
  '6': 'Hike-A-Bike'
} as const;

export const conditionColors = {
  '0': 'text-emerald-500', // Pure Green
  '1': 'text-lime-500',    // Green-Yellow
  '2': 'text-yellow-500',  // Yellow
  '3': 'text-orange-500',  // Yellow-Red
  '4': 'text-red-500',     // Red
  '5': 'text-red-800',     // Dark Red
  '6': 'text-purple-900'   // Maroon
} as const;

// For map lines (without text- prefix)
export const segmentLineColors = {
  '0': '#10B981', // emerald-500
  '1': '#84CC16', // lime-500
  '2': '#EAB308', // yellow-500
  '3': '#F97316', // orange-500
  '4': '#EF4444', // red-500
  '5': '#991B1B', // red-800
  '6': '#581C87'  // purple-900
} as const;

interface SegmentSheetProps {
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

export function SegmentSheet({ open, onOpenChange, segment }: SegmentSheetProps) {
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
      const response = await fetch(`/api/segments/${segment.id}/vote`, {
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
      
      toast({
        title: "Vote Submitted",
        description: "Thank you for your contribution!",
      });

      // Update the segment's rating in the UI
      if (segment && data.stats) {
        segment.averageRating = data.stats.averageRating;
        segment.totalVotes = data.stats.totalVotes;
      }
    } catch (error) {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right"
        className={cn(
          "w-full sm:w-[400px] p-6",
          "sm:h-full",
          "h-[80vh] rounded-t-[10px] sm:rounded-none",
          "bottom-0 sm:bottom-auto"
        )}
      >
        <SheetHeader>
          <SheetTitle>{segment.title}</SheetTitle>
        </SheetHeader>
        
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
            <Label className="text-base font-semibold">Rate Surface Condition</Label>
            <RadioGroup
              value={rating || undefined}
              onValueChange={(value) => setRating(value as keyof typeof surfaceConditions)}
              className="space-y-3"
            >
              {Object.entries(surfaceConditions).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-3">
                  <i 
                    className={cn(
                      `fa-solid fa-circle-${value}`,
                      "text-lg",
                      conditionColors[value as keyof typeof conditionColors]
                    )}
                  />
                  <RadioGroupItem value={value} id={`condition-${value}`} />
                  <Label 
                    htmlFor={`condition-${value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            <Button 
              onClick={handleVote}
              disabled={!rating || isVoting}
              className="w-full mt-4"
            >
              {isVoting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}