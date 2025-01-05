// app/api/segments/save/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '../../../../app/models/DrawnSegment'
import { dbConnect } from '../../../../lib/mongodb';

export async function POST(req: Request) {
  console.log('🚀 Starting segment save process');
  
  try {
    // 1. Auth Check
    console.log('1️⃣ Checking authentication...');
    const session = await getSession();
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('✅ User authenticated:', { 
      userId: session.user.sub,
      userName: session.user.name 
    });

    // 2. Database Connection
    console.log('2️⃣ Connecting to database...');
    try {
      await dbConnect();
      console.log('✅ Database connected successfully');
    } catch (dbError: any) {
      console.error('❌ Database connection failed:', {
        error: dbError.message,
        stack: dbError.stack,
        code: dbError.code
      });
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError.message },
        { status: 500 }
      );
    }

    // 3. Parse Request Body
    console.log('3️⃣ Parsing request body...');
    let body;
    try {
      body = await req.json();
      console.log('✅ Request body parsed:', {
        hasTitle: !!body.title,
        hasGeojson: !!body.geojson,
        hasGpxData: !!body.gpxData,
        hasMetadata: !!body.metadata,
        coordinatesLength: body.geojson?.geometry?.coordinates?.length,
        hasElevationProfile: !!body.metadata?.elevationProfile,
        elevationGain: body.metadata?.elevationGain,
        elevationLoss: body.metadata?.elevationLoss
      });
    } catch (parseError: any) {
      console.error('❌ Request body parse error:', {
        error: parseError.message,
        body: await req.text()
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError.message },
        { status: 400 }
      );
    }

    // 4. Validate Required Fields
    console.log('4️⃣ Validating required fields...');
    const { geojson, title, gpxData } = body;
    
    if (!geojson || !title || !gpxData) {
      console.log('❌ Missing required fields:', {
        hasGeojson: !!geojson,
        hasTitle: !!title,
        hasGpxData: !!gpxData
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 5. Validate GeoJSON Structure
    console.log('5️⃣ Validating GeoJSON structure...');
    if (!geojson.type || !geojson.geometry || !geojson.geometry.coordinates) {
      console.error('❌ Invalid GeoJSON structure:', {
        type: geojson.type,
        hasGeometry: !!geojson.geometry,
        hasCoordinates: !!geojson.geometry?.coordinates
      });
      return NextResponse.json(
        { error: 'Invalid GeoJSON structure' },
        { status: 400 }
      );
    }

    // 6. Validate Coordinates
    console.log('6️⃣ Validating coordinates...');
    const coordinates = geojson.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      console.error('❌ Invalid coordinates:', {
        isArray: Array.isArray(coordinates),
        length: coordinates?.length,
        sample: coordinates?.slice(0, 2)
      });
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // 7. Calculate Metadata
    console.log('7️⃣ Calculating metadata...');
    const length = calculateLength(coordinates);
    console.log('✅ Metadata calculated:', { length });

    // 8. Create Segment Document
    console.log('8️⃣ Creating segment document...');
    let segment;
    try {
      segment = new DrawnSegment({
        gpxData,
        geojson,
        metadata: {
          title,
          length,
          elevationGain: body.metadata?.elevationGain || null,
          elevationLoss: body.metadata?.elevationLoss || null,
          elevationProfile: body.metadata?.elevationProfile || [], 
          surfaceTypes: body.metadata?.surfaceTypes || ['unknown']  // Use the metadata from request
        },
        auth0Id: session.user.sub,
        userName: session.user.name || 'Anonymous',
        votes: [],
        stats: {
          totalVotes: 0,
          averageRating: null
        }
      });
      console.log('✅ Segment document created');
    } catch (modelError: any) {
      console.error('❌ Error creating segment model:', {
        error: modelError.message,
        stack: modelError.stack
      });
      return NextResponse.json(
        { error: 'Failed to create segment model', details: modelError.message },
        { status: 500 }
      );
    }

    // 9. Validate Model
    console.log('9️⃣ Validating model...');
    const validationError = segment.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return NextResponse.json(
        { error: 'Validation failed', details: validationError },
        { status: 400 }
      );
    }
    console.log('✅ Model validation passed');

    // 10. Save Segment
    console.log('🔟 Saving segment...');
    try {
      const savedSegment = await segment.save();
      console.log('✅ Segment saved successfully:', {
        id: savedSegment._id,
        title: savedSegment.metadata.title,
        length: savedSegment.metadata.length,
        coordinateCount: savedSegment.geojson.geometry.coordinates.length,
        elevationGain: savedSegment.metadata.elevationGain,
        elevationLoss: savedSegment.metadata.elevationLoss,
        hasElevationProfile: !!savedSegment.metadata.elevationProfile
      });

      return NextResponse.json({
        success: true,
        segment: savedSegment
      });
    } catch (saveError: any) {
      console.error('❌ Error saving segment:', {
        message: saveError.message,
        code: saveError.code,
        stack: saveError.stack
      });
      return NextResponse.json(
        { error: 'Failed to save segment', details: saveError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Unhandled error in segment save:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });

    return NextResponse.json(
      { 
        error: 'Failed to save segment',
        details: error?.message || 'Unknown error occurred',
        name: error?.name,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate length in meters
function calculateLength(coordinates: [number, number][]) {
  console.log('📏 Calculating segment length...');
  try {
    let length = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const [lon1, lat1] = coordinates[i - 1];
      const [lon2, lat2] = coordinates[i];
      length += getDistanceFromLatLonInM(lat1, lon1, lat2, lon2);
    }
    console.log('✅ Length calculated:', length);
    return Math.round(length);
  } catch (error: any) {
    console.error('❌ Error calculating length:', error);
    return 0;
  }
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