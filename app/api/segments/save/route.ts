import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '@/models/DrawnSegment';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gpxData, geojson, metadata } = await req.json();

    if (!gpxData || !geojson || !metadata?.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const segment = await DrawnSegment.create({
      gpxData,
      geojson,
      metadata,
      auth0Id: session.user.sub,
      votes: []
    });

    return NextResponse.json(segment);
  } catch (error) {
    console.error('Error saving segment:', error);
    return NextResponse.json(
      { error: 'Failed to save segment' },
      { status: 500 }
    );
  }
}