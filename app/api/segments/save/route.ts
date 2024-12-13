import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import clientPromise from '@/lib/mongodb';

// Helper function to create GPX data without using togpx
function createGPX(geojson: any, title: string) {
  const coordinates = geojson.geometry.coordinates;
  const trackpoints = coordinates
    .map((coord: [number, number]) => {
      return `<trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`;
    })
    .join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="Gravel Atlas Beta">
  <metadata>
    <name>${title}</name>
  </metadata>
  <trk>
    <name>${title}</name>
    <desc>color=#c0392b</desc>
    <trkseg>
      ${trackpoints}
    </trkseg>
  </trk>
</gpx>`;
}

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

    // Create GPX using our server-side function
    const gpxData = createGPX(geojson, metadata.title);

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