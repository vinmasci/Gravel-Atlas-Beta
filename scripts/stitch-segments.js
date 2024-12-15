import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;

// Helper function to calculate distance between two points
function calculateDistance(coord1, coord2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coord1[1] * Math.PI/180; // latitude 1
  const φ2 = coord2[1] * Math.PI/180; // latitude 2
  const Δφ = (coord2[1] - coord1[1]) * Math.PI/180;
  const Δλ = (coord2[0] - coord1[0]) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // distance in meters
}

// Helper function to calculate elevation metrics
function calculateElevationMetrics(coordinates) {
  let gain = 0;
  let loss = 0;
  let totalDistance = 0;
  let elevationProfile = [];

  for (let i = 1; i < coordinates.length; i++) {
    const prevCoord = coordinates[i - 1];
    const currCoord = coordinates[i];
    const segmentDistance = calculateDistance(prevCoord, currCoord);
    totalDistance += segmentDistance;

    const elevationDiff = currCoord[2] - prevCoord[2];
    if (elevationDiff > 0) {
      gain += elevationDiff;
    } else {
      loss += Math.abs(elevationDiff);
    }

    elevationProfile.push({
      distance: totalDistance,
      elevation: currCoord[2]
    });
  }

  return {
    length: totalDistance / 1000, // Convert to kilometers
    elevationGain: Math.round(gain),
    elevationLoss: Math.round(loss),
    elevationProfile
  };
}

async function stitchSegments() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const collection = client.db('photoApp').collection('drawnsegments');

    // Find all segments with (Part X) in title
    const segments = await collection.find({
      'metadata.title': { $regex: '\\(Part \\d+\\)$' }
    }).toArray();

    // Group segments by base name
    const groupedSegments = {};
    segments.forEach(segment => {
      const baseName = segment.metadata.title.replace(/ \(Part \d+\)$/, '');
      if (!groupedSegments[baseName]) {
        groupedSegments[baseName] = [];
      }
      groupedSegments[baseName].push(segment);
    });

    // Process each group
    for (const [baseName, parts] of Object.entries(groupedSegments)) {
      console.log(`Processing ${baseName}...`);

      // Sort parts by part number
      parts.sort((a, b) => {
        const aNum = parseInt(a.metadata.title.match(/Part (\d+)/)[1]);
        const bNum = parseInt(b.metadata.title.match(/Part (\d+)/)[1]);
        return aNum - bNum;
      });

      // Combine coordinates
      let allCoordinates = [];
      parts.forEach((part, index) => {
        const coords = part.geojson.geometry.coordinates;
        if (index === 0) {
          allCoordinates = allCoordinates.concat(coords);
        } else {
          // Skip the first coordinate of subsequent parts if it's the same as the last of previous part
          const startIndex = (coords[0][0] === allCoordinates[allCoordinates.length-1][0] &&
                            coords[0][1] === allCoordinates[allCoordinates.length-1][1]) ? 1 : 0;
          allCoordinates = allCoordinates.concat(coords.slice(startIndex));
        }
      });

      // Calculate metrics
      const metrics = calculateElevationMetrics(allCoordinates);

      // Create new combined segment
      const newSegment = {
        gpxData: parts[0].gpxData, // Use GPX from first part for now
        geojson: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: allCoordinates
          },
          features: []
        },
        metadata: {
          title: baseName,
          surfaceTypes: parts[0].metadata.surfaceTypes,
          ...metrics
        },
        votes: parts[0].votes,
        stats: parts[0].stats,
        auth0Id: parts[0].auth0Id,
        userName: parts[0].userName,
        createdAt: parts[0].createdAt,
        updatedAt: new Date()
      };

      // Save new segment and delete old parts
      await collection.insertOne(newSegment);
      console.log(`Created combined segment: ${baseName}`);

      for (const part of parts) {
        await collection.deleteOne({ _id: part._id });
      }
      console.log(`Deleted ${parts.length} part segments`);
    }

  } catch (error) {
    console.error('Error stitching segments:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

stitchSegments().catch(console.error);