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
  '#01bf11': '1',
  '#ffa801': '2', 
  '#c0392b': '4',
  '#751203': '6'  
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

    // Get all old segments
    const oldSegments = await oldCollection.find({}).toArray();
    console.log(`Found ${oldSegments.length} old segments`);

    for (const oldSegment of oldSegments) {
      try {
        // Get each feature from the FeatureCollection
        const features = oldSegment.geojson.features;
        
        // For each feature, create a new segment
        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          
          // Convert coordinates to regular arrays
          const coordinates = feature.geometry.coordinates.map(coord => [
            Number(coord[0].$numberDouble || coord[0]),
            Number(coord[1].$numberDouble || coord[1]),
            Number(coord[2].$numberInt || coord[2])
          ]);

          // Get color and convert to rating
          const color = feature.properties?.color || '#c0392b';  // default to red
          const rating = colorToRating[color] || '4';

          // Create new segment
          const newSegment = {
            gpxData: oldSegment.gpxData,
            geojson: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates
              },
              features: []
            },
            metadata: {
              title: `${oldSegment.metadata.title || 'Untitled'} (Part ${i + 1})`,
              surfaceTypes: ["2"],
              length: null,
              elevationGain: null,
              elevationLoss: null,
              elevationProfile: []
            },
            votes: [{
              user_id: oldSegment.auth0Id,
              userName: "Unknown User",
              condition: rating,
              timestamp: oldSegment.createdAt
            }],
            stats: {
              averageRating: parseInt(rating),
              totalVotes: 1
            },
            auth0Id: oldSegment.auth0Id,
            userName: "Unknown User",
            createdAt: oldSegment.createdAt,
            updatedAt: oldSegment.createdAt
          };

          await newCollection.insertOne(newSegment);
          successfulMigrations++;
          console.log(`Migrated: ${newSegment.metadata.title}`);
        }

        totalProcessed++;

      } catch (error) {
        console.error('Error processing segment:', error);
        failures++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total old segments processed: ${totalProcessed}`);
    console.log(`Successfully migrated features: ${successfulMigrations}`);
    console.log(`Failed migrations: ${failures}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrateSegments().catch(console.error);