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

// Strict color list
const validColors = {
  '#01bf11': '1', // Green -> Well maintained
  '#ffa801': '2', // Yellow -> Occasionally rough
  '#c0392b': '4', // Red -> Very rough
  '#751203': '6'  // Maroon -> Hike-A-Bike
};

// Add this function back in after the validColors object and before calculateElevationMetrics
function calculateDistance(coord1, coord2) {
  // Convert coordinates to radians
  const lat1 = coord1[1] * Math.PI / 180;
  const lon1 = coord1[0] * Math.PI / 180;
  const lat2 = coord2[1] * Math.PI / 180;
  const lon2 = coord2[0] * Math.PI / 180;

  // Earth's radius in meters
  const R = 6371008.8;
  
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1) * Math.cos(lat2) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance; // Returns distance in meters
}

// Helper function to calculate distance between two points
function calculateElevationMetrics(coordinates) {
  let gain = 0;
  let loss = 0;
  let cumulativeDistance = 0;
  let elevationProfile = [];
  let lastUniquePoint = coordinates[0]; // Keep track of last non-duplicate point

  for (let i = 1; i < coordinates.length; i++) {
    const currCoord = coordinates[i];
    
    // Skip if this is a duplicate point (from triple joins)
    if (currCoord[0] === lastUniquePoint[0] && 
        currCoord[1] === lastUniquePoint[1] && 
        currCoord[2] === lastUniquePoint[2]) {
      continue;
    }

    // Calculate distance only for non-duplicate points
    const segmentDistance = calculateDistance(
      [lastUniquePoint[0], lastUniquePoint[1]], 
      [currCoord[0], currCoord[1]]
    );

    cumulativeDistance += segmentDistance;

    // Calculate elevation change
    const elevationDiff = currCoord[2] - lastUniquePoint[2];
    if (elevationDiff > 0) {
      gain += elevationDiff;
    } else {
      loss += Math.abs(elevationDiff);
    }

    // Store profile point
    elevationProfile.push({
      distance: cumulativeDistance,
      elevation: currCoord[2]
    });

    // Update last unique point
    lastUniquePoint = currCoord;
  }

  return {
    length: Math.round(cumulativeDistance), // Distance in meters
    elevationGain: Math.round(gain),
    elevationLoss: Math.round(loss),
    elevationProfile
  };
}

async function migrateSegments() {
  const client = new MongoClient(uri);
  let totalProcessed = 0;
  let successfulMigrations = 0;
  let failures = 0;

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const oldCollection = client.db('roadApp').collection('drawnRoutes');
    const newCollection = client.db('photoApp').collection('drawnsegments');

    console.log('Clearing existing migrated data...');
    await newCollection.deleteMany({});
    console.log('Existing data cleared.');

    const oldSegments = await oldCollection.find({}).toArray();
    console.log(`Found ${oldSegments.length} segments to migrate`);

    for (const segment of oldSegments) {
      try {
        totalProcessed++;
        console.log(`\nProcessing segment ${totalProcessed}/${oldSegments.length}`);

        // Get the color from the first feature's properties
        const color = segment.geojson.features[0].properties.color;
        
        // Skip segments that don't have one of our valid colors
        if (!validColors[color]) {
          console.log(`Skipping segment with color ${color} - not in valid color list`);
          continue;
        }

        const rating = validColors[color];

        // Get coordinates with triple duplicates at joins
        let allCoordinates = [];
        segment.geojson.features.forEach((feature, index) => {
          const coords = feature.geometry.coordinates;
          
          // Add coordinates
          if (index === 0) {
            // First feature: add all coordinates
            allCoordinates = allCoordinates.concat(coords);
            // Triple the last point
            allCoordinates.push(coords[coords.length - 1]);
            allCoordinates.push(coords[coords.length - 1]);
          } else {
            // All other features: triple the first point then add rest
            allCoordinates.push(coords[0]);
            allCoordinates.push(coords[0]);
            allCoordinates = allCoordinates.concat(coords);
            
            // Triple the last point (except for final feature)
            if (index < segment.geojson.features.length - 1) {
              allCoordinates.push(coords[coords.length - 1]);
              allCoordinates.push(coords[coords.length - 1]);
            }
          }
        });

        const metrics = calculateElevationMetrics(allCoordinates);

        const newSegment = {
          gpxData: segment.gpxData,
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
            title: segment.metadata.title,
            surfaceTypes: ["2"],
            ...metrics
          },
          votes: [{
            user_id: segment.auth0Id,
            userName: "Unknown User",
            condition: rating,
            timestamp: segment.createdAt
          }],
          stats: {
            averageRating: parseInt(rating),
            totalVotes: 1
          },
          auth0Id: segment.auth0Id,
          userName: "Unknown User",
          createdAt: segment.createdAt,
          updatedAt: segment.createdAt
        };

        await newCollection.insertOne(newSegment);
        successfulMigrations++;
        console.log(`Successfully migrated: ${segment.metadata.title} (Color: ${color} -> Rating: ${rating})`);
        console.log(`Distance: ${metrics.length}km, Gain: ${metrics.elevationGain}m, Loss: ${metrics.elevationLoss}m`);

      } catch (error) {
        console.error(`Error migrating segment ${segment._id}:`, error);
        failures++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total segments processed: ${totalProcessed}`);
    console.log(`Successfully migrated: ${successfulMigrations}`);
    console.log(`Failed migrations: ${failures}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migrateSegments().catch(console.error);