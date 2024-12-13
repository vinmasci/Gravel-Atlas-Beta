// app/api/segments/save/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '@/app/models/DrawnSegment';
import { dbConnect } from '@/lib/mongodb';

// Helper function to create GPX data
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

    // Connect to database
    await dbConnect();

    // Log the request body for debugging
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { geojson, title } = body;

    if (!geojson || !title) {
      console.log('Missing fields:', { hasGeojson: !!geojson, hasTitle: !!title });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate geojson structure
    if (!geojson.type || !geojson.geometry || !geojson.geometry.coordinates) {
      console.log('Invalid GeoJSON structure:', geojson);
      return NextResponse.json(
        { error: 'Invalid GeoJSON structure' },
        { status: 400 }
      );
    }

    // Create GPX using our server-side function
    const gpxData = createGPX(geojson, title);

    // Calculate basic metadata
    const coordinates = geojson.geometry.coordinates;
    const length = calculateLength(coordinates);

    // Log the data we're about to save
    console.log('Creating segment with data:', {
      title,
      userId: session.user.sub,
      userName: session.user.name,
      coordinatesCount: coordinates.length,
      length
    });

    const segment = new DrawnSegment({
      gpxData,
      geojson,
      metadata: {
        title,
        length,
        elevationGain: null,
        elevationLoss: null,
        surfaceTypes: []
      },
      auth0Id: session.user.sub,
      userName: session.user.name || 'Anonymous',
      votes: [],
      stats: {
        totalVotes: 0,
        averageRating: null
      }
    });

    // Log any validation errors
    const validationError = segment.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json(
        { error: 'Validation failed', details: validationError },
        { status: 400 }
      );
    }

    // Save and log the result
    const savedSegment = await segment.save();
    console.log('Segment saved successfully:', savedSegment._id);

    return NextResponse.json({
      success: true,
      segment: savedSegment
    });
  } catch (error: any) {
    // Log the full error
    console.error('Error saving segment:', {
      message: error.message,
      stack: error.stack,
      details: error
    });

    return NextResponse.json(
      { 
        error: 'Failed to save segment',
        details: error.message // Include error message in response
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate length in meters
function calculateLength(coordinates: [number, number][]) {
  let length = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    length += getDistanceFromLatLonInM(lat1, lon1, lat2, lon2);
  }
  return Math.round(length);
}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}