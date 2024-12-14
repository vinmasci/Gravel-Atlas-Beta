// components/segments/segment-sheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const surfaceConditions = {
  '0': 'Smooth surface, any bike',
  '1': 'Well maintained, gravel bike',
  '2': 'Occasionaly rough surface',
  '3': 'Frequently loose surface',
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

export const segmentLineColors = {
  '0': '#10B981', // emerald-500
  '1': '#84CC16', // lime-500
  '2': '#EAB308', // yellow-500
  '3': '#F97316', // orange-500
  '4': '#EF4444', // red-500
  '5': '#991B1B', // red-800
  '6': '#4C0519'  // dark red/black
} as const;

interface Comment {
  id: string;
  userId: string;
  userImage?: string;
  userName: string;
  content: string;
  createdAt: string;
}

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface SegmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: {
    id: string;
    title: string;
    userName: string;
    userImage?: string;
    bioName?: string;
    website?: string;
    length: number;
    averageRating?: number;
    totalVotes?: number;
    metadata?: {
      elevationProfile?: ElevationPoint[];
      elevationGain?: number;
      elevationLoss?: number;
    };
  } | null;
}

export function SegmentSheet({ open, onOpenChange, segment }: SegmentSheetProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState<keyof typeof surfaceConditions | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [userData, setUserData] = useState<{ bioName?: string; image?: string; website?: string } | null>(null);

  useEffect(() => {
    if (segment?.id && user) {
      loadComments(segment.id);
    }
    if (segment?.userName) {
      fetchUserData(segment.userName);
    }
  }, [segment?.id, segment?.userName, user]);

  const fetchUserData = async (userName: string) => {
    try {
      const response = await fetch(`/api/user/${userName}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const loadComments = async (segmentId: string) => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/segments/${segmentId}/comments`);
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

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

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/segments/${segment?.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const data = await response.json();
      setComments(prev => [...prev, data.comment]);
      setNewComment('');
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!segment) return null;

  const elevationProfile = segment.metadata?.elevationProfile || [];
  const elevations = elevationProfile.map(point => point.elevation);
  const minElevation = Math.min(...elevations, 0);
  const maxElevation = Math.max(...elevations, 100);
  const elevationGain = segment.metadata?.elevationGain;
  const elevationLoss = segment.metadata?.elevationLoss;

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
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <img 
              src={userData?.image || segment.userImage}
              alt={userData?.bioName || segment.userName}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.bioName || segment.userName}`;
              }}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">{userData?.bioName || segment.userName}</p>
              {(userData?.website || segment.website) && (
                <a 
                  href={userData?.website || segment.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {new URL(userData?.website || segment.website || '').hostname}
                </a>
              )}
            </div>
          </div>

          {/* Segment Stats */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Distance: {Math.round(segment.length)}m</p>
            {segment.averageRating !== undefined && (
              <p className="text-sm text-muted-foreground">
                Average Rating: {Number(segment.averageRating).toFixed(1)}/6
                {segment.totalVotes && ` (${segment.totalVotes} votes)`}
              </p>
            )}
          </div>

          {/* Elevation Profile */}
          {elevationProfile.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Elevation Gain: {elevationGain}m</span>
                <span>Loss: {elevationLoss}m</span>
              </div>
              <div className="h-[200px] border rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={elevationProfile}>
                    <defs>
                      <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="distance" 
                      type="number"
                      tickFormatter={(value) => `${value.toFixed(1)}km`}
                      stroke="#666"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={[minElevation - 10, maxElevation + 10]}
                      tickFormatter={(value) => `${Math.round(value)}m`}
                      stroke="#666"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: number) => `${Math.round(value)}m`}
                      labelFormatter={(value: number) => `${value.toFixed(1)} km`}
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="elevation"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#elevationGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Rating Section in Accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="rating">
              <AccordionTrigger>Rate Surface Condition</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
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
                    className="w-full"
                  >
                    {isVoting ? 'Submitting...' : 'Submit Rating'}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Comments Section */}
          {user && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Comments</h2>
              
              <div className="space-y-4 max-h-[200px] overflow-y-auto">
                {isLoadingComments ? (
                  <p className="text-sm text-muted-foreground">Loading comments...</p>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <img 
                          src={comment.userImage} 
                          alt={comment.userName}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${comment.userName}`;
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.userName}</p>
                          <p className="text-sm">{comment.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>