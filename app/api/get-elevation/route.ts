import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

function lngLatToTile(lng: number, lat: number, zoom: number) {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
}

function lngLatToPixel(lng: number, lat: number, zoom: number) {
    const tileSize = 256;
    const scale = tileSize * Math.pow(2, zoom);
    const worldX = ((lng + 180) / 360) * scale;
    const worldY = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * scale;
    return {
        pixelX: worldX % tileSize,
        pixelY: worldY % tileSize
    };
}

async function getElevationFromMapbox(coordinates: [number, number][]) {
    if (coordinates.length === 0) return [];
    
    try {
        const promises = coordinates.map(async ([lng, lat]) => {
            const zoom = 14;  // Fixed zoom level for consistent resolution
            const { x, y } = lngLatToTile(lng, lat, zoom);
            const { pixelX, pixelY } = lngLatToPixel(lng, lat, zoom);
            
            const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
            
            console.log('Requesting elevation for point:', { lng, lat, url });
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Elevation API error: ${response.status}`);
                return [lng, lat, 0];
            }

            const buffer = await response.buffer();
            const img = await loadImage(buffer);
            
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            // Get the RGB values at the exact pixel location
            const imageData = ctx.getImageData(Math.floor(pixelX), Math.floor(pixelY), 1, 1).data;
            const [r, g, b] = imageData;
            
            // Convert RGB values to elevation using Mapbox's formula
            const elevation = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
            
            return [lng, lat, Math.round(elevation)] as [number, number, number];
        });

        const results = await Promise.all(promises);
        
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