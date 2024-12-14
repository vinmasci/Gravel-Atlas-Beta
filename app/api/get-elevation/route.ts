import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';

interface Coords {
    lng: number;
    lat: number;
}

async function getElevationFromMapbox(coordinates: [number, number][]) {
    if (coordinates.length === 0) return [];
    
    // If only one coordinate, duplicate it to meet the API requirement
    const coordsToQuery = coordinates.length === 1 
        ? [coordinates[0], coordinates[0]] 
        : coordinates;
    
    // Format coordinates for Mapbox API
    const coordinatesString = coordsToQuery
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(';');

    try {
        const response = await fetch(
            `https://api.mapbox.com/v4/mapbox.terrain-rgb/tilequery/${coordinatesString}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );

        if (!response.ok) {
            throw new Error(`Elevation API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Map the results back to coordinate format
        // If we duplicated the point, only return the first one
        const results = coordsToQuery.map((coord, index) => {
            const elevation = data.features[index]?.properties?.elevation || 0;
            return [...coord, elevation];
        });

        return coordinates.length === 1 ? [results[0]] : results;
    } catch (error) {
        console.error('Error fetching elevation:', error);
        // Return coordinates with 0 elevation on error
        return coordinates.map(coord => [...coord, 0]);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Elevation API received:', {
            coordinates: body.coordinates,
            coordinatesLength: body.coordinates?.length
        });
        const { coordinates } = body;

        if (!coordinates || !Array.isArray(coordinates)) {
            return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
        }

        // Remove the minimum coordinates check
        const elevationData = await getElevationFromMapbox(coordinates);
        return NextResponse.json({ coordinates: elevationData });

    } catch (error) {
        console.error('Elevation API error:', error);
        return NextResponse.json({ error: 'Failed to fetch elevation data' }, { status: 500 });
    }
}