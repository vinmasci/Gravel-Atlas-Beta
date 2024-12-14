// app/api/segments/route.ts - List/Get segments
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { DrawnSegment } from '../../../app/models/DrawnSegment'
import { dbConnect } from '../../../lib/mongodb';

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
      // Create a polygon in the correct format for MongoDB
      const boundingBox = {
        type: 'Polygon',
        coordinates: [[
          [bounds[0], bounds[1]], // west, south
          [bounds[0], bounds[3]], // west, north
          [bounds[2], bounds[3]], // east, north
          [bounds[2], bounds[1]], // east, south
          [bounds[0], bounds[1]]  // closing point (same as first)
        ]]
      };
    
      // Use $geoWithin instead of $geoIntersects for better performance with bounding boxes
      query['geojson.geometry'] = {
        $geoWithin: {
          $geometry: boundingBox
        }
      };
    }
    
    // Also, we need to include all necessary fields in the select
    const segments = await DrawnSegment
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-gpxData'); // Just exclude gpxData, include everything else

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