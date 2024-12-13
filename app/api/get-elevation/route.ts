import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';

interface Coords {
    lng: number;
    lat: number;
}

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

async function getElevationData(coordinates: [number, number][]) {
    const zoom = 14; // Best zoom level for terrain-rgb tiles
    const results = await Promise.all(coordinates.map(async ([lng, lat]) => {
        try {
            const { x, y } = lngLatToTile(lng, lat, zoom);
            const { pixelX, pixelY } = lngLatToPixel(lng, lat, zoom);
            
            const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}.pngraw?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Elevation API error:`, response.status);
                return [lng, lat, 0];
            }

            const buffer = await response.buffer();
            const img = await loadImage(buffer);
            
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(Math.floor(pixelX), Math.floor(pixelY), 1, 1).data;
            const [r, g, b] = imageData;
            const elevation = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
            
            return [lng, lat, Math.round(elevation)];
        } catch (error) {
            console.error('Error processing coordinate:', { lng, lat }, error);
            return [lng, lat, 0];
        }
    }));

    return results;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { coordinates } = body;

        if (!coordinates || !Array.isArray(coordinates)) {
            return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
        }

        const elevationData = await getElevationData(coordinates);
        return NextResponse.json({ coordinates: elevationData });

    } catch (error) {
        console.error('Elevation API error:', error);
        return NextResponse.json({ error: 'Failed to fetch elevation data' }, { status: 500 });
    }
}