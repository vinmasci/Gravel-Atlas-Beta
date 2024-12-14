import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';

async function getElevationFromMapbox(coordinates: [number, number][]) {
    if (coordinates.length === 0) return [];
    
    try {
        // Process one coordinate at a time for accurate elevation data
        const results = await Promise.all(coordinates.map(async ([lng, lat]) => {
            // Make individual point query
            const url = `https://api.mapbox.com/v4/mapbox.terrain-dem-v1/tilequery/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
            
            console.log('Requesting elevation for point:', { lng, lat, url });
            
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Elevation API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw elevation response:', data);

            console.log('Raw Mapbox response:', {
                url,
                status: response.status,
                data: data,
                features: data.features?.[0]
            });

            if (!data.features || !data.features[0]) {
                console.warn('No elevation data found for point:', { lng, lat });
                return [lng, lat, 0];
            }

            // Get elevation directly from the ele property
            const elevation = data.features[0].properties.ele ?? 0;

            return [lng, lat, elevation] as [number, number, number];
        }));

        // Log the results for debugging
        console.log('Processed elevation data:', {
            inputCount: coordinates.length,
            outputCount: results.length,
            sampleData: results.slice(0, 2)
        });

        return results;

    } catch (error) {
        console.error('Error fetching elevation:', error);
        return coordinates.map(coord => [...coord, 0] as [number, number, number]);
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Elevation API received:', {
            coordinates: body.coordinates?.slice(0, 2),
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
            samplePoints: elevationData.slice(0, 2),
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