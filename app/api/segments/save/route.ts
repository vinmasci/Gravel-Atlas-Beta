import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import clientPromise from '@/lib/mongodb';
import togpx from 'togpx';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { geojson, metadata } = await req.json();

    if (!geojson || !metadata?.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert GeoJSON to GPX
    const gpxData = togpx({
      type: 'FeatureCollection',
      features: [
        {
          ...geojson,
          properties: {
            ...geojson.properties,
            color: '#c0392b',
            id: `segment-${Date.now()}`,
          },
        },
      ],
    });

    const client = await clientPromise;
    const db = client.db('roadApp');
    const segmentsCollection = db.collection('segmentsV2');
    
    const segment = await segmentsCollection.insertOne({
      gpxData,
      geojson: {
        type: 'FeatureCollection',
        features: [geojson]
      },
      metadata: {
        title: metadata.title
      },
      auth0Id: session.user.sub,
      votes: [],
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      segment: {
        _id: segment.insertedId,
        gpxData,
        geojson,
        metadata,
        auth0Id: session.user.sub,
        votes: [],
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving segment:', error);
    return NextResponse.json(
      { error: 'Failed to save segment' },
      { status: 500 }
    );
  }
}