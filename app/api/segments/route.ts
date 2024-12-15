// app/api/segments/route.ts
import { NextResponse } from 'next/server';
// import { getSession } from '@auth0/nextjs-auth0'; // Comment this out for now
import { DrawnSegment } from '../../../app/models/DrawnSegment'
import { dbConnect } from '../../../lib/mongodb';

export async function GET(req: Request) {
  try {
    // Remove session check for now
    // const session = await getSession();
    const { searchParams } = new URL(req.url);
    
    await dbConnect();

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '3000'); // Increased limit
    const page = parseInt(searchParams.get('page') || '1');
    const userId = searchParams.get('userId');
    const bounds = searchParams.get('bounds')?.split(',').map(Number);

    // Build query
    const query: any = {};
    
    if (userId) {
      query.auth0Id = userId;
    }

    if (bounds) {
      const boundingBox = {
        type: 'Polygon',
        coordinates: [[
          [bounds[0], bounds[1]],
          [bounds[0], bounds[3]],
          [bounds[2], bounds[3]],
          [bounds[2], bounds[1]],
          [bounds[0], bounds[1]]
        ]]
      };
    
      query['geojson.geometry'] = {
        $geoWithin: {
          $geometry: boundingBox
        }
      };
    }

    // Add console.log to see what's happening
    console.log('Query:', JSON.stringify(query));
    
    const segments = await DrawnSegment
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-gpxData');

    console.log(`Found ${segments.length} segments`);

    const total = await DrawnSegment.countDocuments(query);
    console.log(`Total documents matching query: ${total}`);

    return NextResponse.json({
      segments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}