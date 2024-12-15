// app/api/segments/[id]/vote/route.ts - Vote on segment
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '../../../../../app/models/DrawnSegment'
import { dbConnect } from '../../../../../lib/mongodb';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { condition } = await req.json();
    
    if (!condition || !['0', '1', '2', '3', '4', '5', '6'].includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid condition rating' },
        { status: 400 }
      );
    }

    const segment = await DrawnSegment.findById(params.id);
    if (!segment) {
      return NextResponse.json(
        { error: 'Segment not found' },
        { status: 404 }
      );
    }

    await segment.addVote(
      session.user.sub,
      session.user.name || 'Anonymous',
      condition
    );

    // Fetch the updated segment to ensure we have the latest data
    const updatedSegment = await DrawnSegment.findById(params.id);

    // Return the full segment data along with stats
    return NextResponse.json({
      success: true,
      segment: updatedSegment,
      stats: {
        totalVotes: updatedSegment.stats.totalVotes,
        averageRating: updatedSegment.stats.averageRating
      }
    });
  } catch (error) {
    console.error('Error voting on segment:', error);
    return NextResponse.json(
      { error: 'Failed to vote on segment' },
      { status: 500 }
    );
  }
}