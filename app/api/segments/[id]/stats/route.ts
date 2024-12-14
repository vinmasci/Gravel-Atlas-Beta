// app/api/segments/[id]/stats/route.ts - Get segment stats
import { NextResponse } from 'next/server';
import { DrawnSegment } from '../../../../models/DrawnSegment';
import { dbConnect } from '../../../../../lib/mongodb';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const segment = await DrawnSegment.findById(params.id);
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }

    // Calculate vote distribution
    const distribution = segment.votes.reduce((acc: Record<string, number>, vote) => {
      acc[vote.condition] = (acc[vote.condition] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      stats: {
        totalVotes: segment.stats.totalVotes,
        averageRating: segment.stats.averageRating,
        distribution,
        metadata: {
          length: segment.metadata.length,
          elevationGain: segment.metadata.elevationGain,
          elevationLoss: segment.metadata.elevationLoss
        }
      }
    });
  } catch (error) {
    console.error('Error fetching segment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment stats' },
      { status: 500 }
    );
  }
}