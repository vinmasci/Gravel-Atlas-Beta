// app/api/segments/route.ts - List/Get segments
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '@/app/models/DrawnSegment';
import { dbConnect } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    
    await dbConnect();

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const userId = searchParams.get('userId');
    const bounds = searchParams.get('bounds')?.split(',').map(Number); // [west, south, east, north]

    // Build query
    const query: any = {};
    
    if (userId) {
      query.auth0Id = userId;
    }

    if (bounds) {
      query['geojson.geometry'] = {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [[
              [bounds[0], bounds[1]],
              [bounds[2], bounds[1]],
              [bounds[2], bounds[3]],
              [bounds[0], bounds[3]],
              [bounds[0], bounds[1]]
            ]]
          }
        }
      };
    }

    const segments = await DrawnSegment
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-gpxData'); // Exclude GPX data for list view

    const total = await DrawnSegment.countDocuments(query);

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