// components/segments/segment-sheet.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useToast } from '@/components/ui/use-toast';
import * as turf from '@turf/turf'; 
import { useContext } from 'react';
import { MapContext } from '@/app/contexts/map-context';
import { updateSegmentLayer } from '@/lib/segment-layer';
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
  '0': 'text-emerald-500',    // Changed to match #10B981
  '1': 'text-lime-500',       // Changed to match #84CC16
  '2': 'text-yellow-500',     // Changed to match #EAB308
  '3': 'text-orange-500',     // Changed to match #F97316
  '4': 'text-red-500',        // Changed to match #EF4444
  '5': 'text-red-800',        // Changed to match #991B1B
'6': 'text-red-950'         // Darkest red for hike-a-bike
} as const;

export const segmentLineColors = {
  '0': '#10B981', // emerald-500
  '1': '#84CC16', // lime-500
  '2': '#EAB308', // yellow-500
  '3': '#F97316', // orange-500
  '4': '#EF4444', // red-500
  '5': '#991B1B', // red-800
  '6': '#450a0a' // dark red/black
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
  surfaceType?: 'paved' | 'unpaved' | 'unknown';
}

interface SegmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: {
    _id: string;  // Changed to match MongoDB's _id
    title: string;
    auth0Id: string;
    userName: string;
    length: number;
    averageRating?: number;
    totalVotes?: number;
    geojson?: {
      geometry: {
        coordinates: [number, number, number][];
      };
    };
    metadata?: {
      elevationGain?: number;
      elevationLoss?: number;
    };
  } | null;
  onUpdate?: (updatedSegment: any) => void;  
}

export function SegmentSheet({ open, onOpenChange, segment, onUpdate }: SegmentSheetProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState<keyof typeof surfaceConditions | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { map } = useContext(MapContext);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    picture: string;
    website?: string;
    socialLinks?: {
      instagram?: string;
      strava?: string;
      facebook?: string;
    };
  } | null>(null);

  useEffect(() => {
    const fetchLatestSegmentData = async () => {
      if (!segment?._id) return;
      
      try {
        const response = await fetch(`/api/segments/${segment._id}`);
        const data = await response.json();
        
        if (onUpdate) {
          onUpdate(data);
        }
      } catch (error) {
        console.error('Error fetching segment data:', error);
      }
    };
  
    if (open) {
      fetchLatestSegmentData();
    }
  }, [open, segment?._id]);

  useEffect(() => {
    if (segment?.id && user) {
      loadComments(segment.id);
    }
    if (segment?.auth0Id) {
      fetch(`/api/user/${segment.auth0Id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setUserData(data);
          }
        })
        .catch(error => console.error('Error fetching user data:', error));
    }
  }, [segment?.id, segment?.auth0Id, user]);

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

// In segment-sheet.tsx, find the handleVote function and update it:
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
    
    // Update local state
    if (onUpdate) {
      onUpdate({
        ...segment,
        stats: data.stats,
      });
    }

    // Use the map from context to update the layer
    if (map) {
      updateSegmentLayer(map, true);
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

// In segment-sheet.tsx, update the handleSubmitComment function:
const handleSubmitComment = async () => {
  if (!user || !newComment.trim() || !segment?._id) return;

  try {
    const response = await fetch(`/api/segments/${segment._id}/comments`, {
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
    console.error('Error posting comment:', error);
    toast({
      title: "Error",
      description: "Failed to post comment. Please try again.",
      variant: "destructive",
    });
  }
};

  if (!segment) return null;

  // Convert 3D coordinates to elevation profile with safety checks
// Convert 3D coordinates to elevation profile with safety checks
const coordinates = segment.geojson?.geometry?.coordinates || [];
const elevationProfile = coordinates.length > 0 ? coordinates.map((coord, index, array) => {
  let cumulativeDistance = 0;
  
  // Calculate cumulative distance up to this point
  for (let i = 1; i <= index; i++) {
    const prevPoint = array[i - 1];
    const currentPoint = array[i];
    cumulativeDistance += turf.distance(
      turf.point([prevPoint[0], prevPoint[1]]),
      turf.point([currentPoint[0], currentPoint[1]]),
      { units: 'kilometers' }
    );
  }
  
  return {
    distance: cumulativeDistance,
    elevation: coord[2] // The elevation is the third number in each coordinate
  };
}) : [];

  const elevations = coordinates.map(coord => coord[2] || 0);
  const minElevation = elevations.length > 0 ? Math.min(...elevations, 0) : 0;
  const maxElevation = elevations.length > 0 ? Math.max(...elevations, 100) : 100;
  const elevationGain = segment.metadata?.elevationGain;
  const elevationLoss = segment.metadata?.elevationLoss;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
<SheetContent 
  side="right"
  className={cn(
    "w-full sm:w-[600px] p-6",
    "sm:h-[calc(100vh-64px)] overflow-y-auto",
    "h-[80vh] rounded-t-[10px] sm:rounded-none",
    "bottom-0 sm:top-16",
    "bg-background/40" // This makes it more transparent
  )}
>
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">{segment.metadata?.title || "NaNm"}</SheetTitle>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
              <img 
                src={userData?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${segment.userName}`}
                alt={userData?.name || segment.userName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{userData?.bioName || segment.userName}</p>
              <div className="flex items-center space-x-2 text-sm">
                {userData?.website && (
                  <a 
                    href={userData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <i className="fa-solid fa-globe w-4 h-4"></i>
                  </a>
                )}
                {userData?.socialLinks?.instagram && (
                  <a 
                    href={userData.socialLinks.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                  >
                    <i className="fa-brands fa-instagram w-4 h-4"></i>
                  </a>
                )}
                {userData?.socialLinks?.strava && (
                  <a 
                    href={userData.socialLinks.strava} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[#FC4C02] transition-colors"
                  >
                    <i className="fa-brands fa-strava w-4 h-4"></i>
                  </a>
                )}
              </div>
            </div>
          </div>

{/* Segment Stats */}
<div className="space-y-1">
<p className="text-sm text-muted-foreground">Distance: {segment.metadata?.length ? `${Math.round(segment.metadata.length).toLocaleString()}m` : 'NaNm'}</p>
  {segment.stats?.averageRating !== undefined && (
    <div className="flex items-center space-x-2">
  <p className="text-sm text-muted-foreground">
    Average Rating: {segment.stats?.totalVotes ? 
      `${Number(segment.stats.averageRating).toFixed(1)}/6 (${segment.stats.totalVotes} votes)` : 
      'Unrated'
    }
  </p>
  <i 
    className={cn(
      `fa-solid ${segment.stats?.totalVotes ? `fa-circle-${Math.round(Number(segment.stats.averageRating))}` : 'fa-circle-question'}`,
      "text-lg",
      segment.stats?.totalVotes ? 
        conditionColors[Math.round(Number(segment.stats.averageRating)).toString() as keyof typeof conditionColors] :
        'text-cyan-500'  // Cyan only for segments with no votes
    )}
  />
</div>
  )}
</div>

{/* Elevation Profile */}
{elevationProfile.length > 0 && (
  <div className="space-y-2">
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>Elevation Gain: {elevationGain}m</span>
      <span>Loss: {elevationLoss}m</span>
    </div>
    <div className="h-[200px] w-full border rounded-lg p-1 relative">
  <div className="absolute inset-x-[-20px] mx-1 h-full">
    <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={elevationProfile.map((point, index, array) => {
  // Calculate gradient for each point using a larger window
  let gradient = 0;
  if (index > 0) {
    // Look back up to 3 points or to the start
    const lookBack = Math.max(0, index - 3);
    const prevPoint = array[lookBack];
    
    // Calculate distance and elevation change
    const rise = point.elevation - prevPoint.elevation;
    const run = (point.distance - prevPoint.distance) * 1000; // Convert km to m
    
    // Only calculate gradient if we have a meaningful distance
    if (run > 10) { // Minimum 10m distance to avoid spikes
      gradient = (rise / run) * 100;
      // Limit extreme gradients
      gradient = Math.max(Math.min(gradient, 30), -30);
    }
  }
  return {
    ...point,
    gradient
  };
})}>
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
            domain={[0, elevationProfile[elevationProfile.length - 1]?.distance || 0]}
            tickFormatter={(value) => `${value.toFixed(1)}km`}
            stroke="#666"
            fontSize={12}
            ticks={[
              0,
              ...Array.from(
                { length: 4 },
                (_, i) => ((elevationProfile[elevationProfile.length - 1]?.distance || 0) * (i + 1)) / 5
              )
            ]}
          />
          <YAxis 
            domain={[minElevation - 10, maxElevation + 10]}
            tickFormatter={(value) => `${Math.round(value)}m`}
            stroke="#666"
            fontSize={12}
          />
<YAxis 
  yAxisId="right"
  orientation="right"
  domain={[-30, 30]}  // Changed from [-15, 15] to accommodate steeper sections
  tickFormatter={(value) => `${value}%`}
  stroke="#3b82f6"
  fontSize={12}
/>
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'elevation') return [`${Math.round(value)}m`, 'Elevation'];
              if (name === 'gradient') return [`${value.toFixed(1)}%`, 'Gradient'];
              return [value, name];
            }}
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
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="gradient"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="none"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
                      <div key={`condition-${value}`} className="flex items-center space-x-3">
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
                    <div key={`comment-${comment.id}`} className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <img 
                          src={comment.userImage} 
                          alt={comment.userName}
                          className="w-6 h-6 rounded-full"
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
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className="w-full"
                >
                  Post Comment
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}