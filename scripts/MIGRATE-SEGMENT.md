OLD ONE

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

const colorToRating = {
  '#01bf11': '1', // Green -> Well maintained
  '#ffa801': '2', // Yellow -> Occasionally rough
  '#c0392b': '4', // Red -> Very rough
  '#751203': '6'  // Maroon -> Hike-A-Bike
};

// Helper function to safely convert MongoDB number types to regular numbers
const parseMongoCoordinate = coord => {
  if (!coord) return null;
  if (coord.$numberDouble) return parseFloat(coord.$numberDouble);
  if (coord.$numberInt) return parseInt(coord.$numberInt);
  return parseFloat(coord); // fallback for regular numbers
};

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

        // Get color either from metadata or first feature's properties
        let color;
        if (segment.metadata && segment.metadata.color) {
          color = segment.metadata.color;
        } else if (segment.geojson.features && segment.geojson.features.length > 0) {
          // Check each feature for a color property
          for (const feature of segment.geojson.features) {
            if (feature.properties && feature.properties.color) {
              color = feature.properties.color;
              break;
            }
          }
        }
        
        // Default to red if no color found
        const rating = colorToRating[color] || '4';

        // Get coordinates with triple duplicates at joins
        let allCoordinates = [];
        segment.geojson.features.forEach((feature, index) => {
          // Convert coordinates to regular numbers
          const coords = feature.geometry.coordinates.map(coord => [
            parseMongoCoordinate(coord[0]),
            parseMongoCoordinate(coord[1]),
            parseMongoCoordinate(coord[2])
          ].filter(val => val !== null)); // Remove any null values
          
          // Add coordinates with triple duplication at joins
          if (index === 0) {
            // First feature: add all coordinates
            allCoordinates = allCoordinates.concat(coords);
            // Triple the last point
            allCoordinates.push([...coords[coords.length - 1]]);
            allCoordinates.push([...coords[coords.length - 1]]);
          } else {
            // Subsequent features: triple the first point
            allCoordinates.push([...coords[0]]);
            allCoordinates.push([...coords[0]]);
            allCoordinates = allCoordinates.concat(coords);
            
            // Triple the last point (except for final feature)
            if (index < segment.geojson.features.length - 1) {
              allCoordinates.push([...coords[coords.length - 1]]);
              allCoordinates.push([...coords[coords.length - 1]]);
            }
          }
        });

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
            title: segment.metadata.title || "Untitled Segment",
            surfaceTypes: ["2"],
            length: null,
            elevationGain: null,
            elevationLoss: null,
            elevationProfile: []
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
        console.log(`Successfully migrated: ${newSegment.metadata.title} (Color: ${color} -> Rating: ${rating})`);

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