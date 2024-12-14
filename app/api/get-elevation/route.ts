import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';

async function getElevationFromMapbox(coordinates: [number, number][]) {
    if (coordinates.length === 0) return [];
    
    // Process coordinates in batches of 25 (Mapbox API limit)
    const batchSize = 25;
    const batches = [];
    
    for (let i = 0; i < coordinates.length; i += batchSize) {
        batches.push(coordinates.slice(i, i + batchSize));
    }

    try {
        // Process each batch in parallel
        const results = await Promise.all(batches.map(async (batch) => {
            // Format coordinates for the API
            const coordinatesString = batch
                .map(([lng, lat]) => `${lng},${lat}`)
                .join(',');

            // Use the Mapbox Terrain-DEM v1 API endpoint
            const response = await fetch(
                `https://api.mapbox.com/v4/mapbox.terrain-dem-v1/tilequery/${coordinatesString}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
            );

            if (!response.ok) {
                throw new Error(`Elevation API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Map the results to include elevation
            return batch.map((coord, index) => {
                const feature = data.features[index];
                // The elevation is directly provided in the elevation property
                const elevation = feature?.properties?.elevation ?? 0;
                return [...coord, elevation];
            });
        }));

        // Combine all batches
        return results.flat();

    } catch (error) {
        console.error('Error fetching elevation:', error);
        // Return coordinates with 0 elevation in case of error
        return coordinates.map(coord => [...coord, 0]);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Elevation API received:', {
            coordinates: body.coordinates,
            coordinatesLength: body.coordinates?.length,
            timestamp: new Date().toISOString()
        });

        const { coordinates } = body;

        if (!coordinates || !Array.isArray(coordinates)) {
            return NextResponse.json(
                { error: 'Invalid coordinates' }, 
                { status: 400 }
            );
        }

        const elevationData = await getElevationFromMapbox(coordinates);
        
        console.log('Elevation data returned:', {
            pointCount: elevationData.length,
            samplePoints: elevationData.slice(0, 2), // Log first two points
            timestamp: new Date().toISOString()
        });

        return NextResponse.json({ coordinates: elevationData });

    } catch (error) {
        console.error('Elevation API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch elevation data' }, 
            { status: 500 }
        );
    }
}