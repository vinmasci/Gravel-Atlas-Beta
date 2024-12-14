import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';

interface Coords {
    lng: number;
    lat: number;
}

async function getElevationFromMapbox(coordinates: [number, number][]) {
    if (coordinates.length === 0) return [];
    
    // Format coordinates for Mapbox API
    const coordinatesString = coordinates
        .map(([lng, lat]) => `${lng},${lat}`)
        .join(';');

    try {
        const response = await fetch(
            `https://api.mapbox.com/v4/mapbox.terrain-rgb-v1/tilequery/${coordinatesString}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );

        if (!response.ok) {
            throw new Error(`Elevation API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Map the results back to coordinate format
        return coordinates.map((coord, index) => {
            const feature = data.features[index];
            if (!feature) return [...coord, 0];
            
            // Parse elevation from RGB values
            const rgb = feature.properties;
            const elevation = rgb ? 
                -10000 + ((rgb.r * 256 * 256 + rgb.g * 256 + rgb.b) * 0.1) : 
                0;
            
            return [...coord, Math.round(elevation)];
        });
    } catch (error) {
        console.error('Error fetching elevation:', error);
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