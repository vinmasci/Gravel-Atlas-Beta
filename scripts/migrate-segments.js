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

        const properties = segment.geojson.type === 'FeatureCollection' 
          ? segment.geojson.features[0].properties 
          : segment.geojson.properties;

        const color = properties?.color?.toLowerCase();
        const rating = colorToRating[color];

        if (!rating) {
          console.log(`Skipping segment ${segment._id} - Unknown color: ${color}`);
          failures++;
          continue;
        }

        const newSegment = {
          gpxData: segment.gpxData,
          geojson: segment.geojson, // Keep original geojson structure
          metadata: {
            title: properties.title || 'Untitled Segment',
            surfaceTypes: [],
            length: segment.metadata?.length,
            elevationGain: segment.metadata?.elevationGain,
            elevationLoss: segment.metadata?.elevationLoss,
            elevationProfile: segment.metadata?.elevationProfile || []
          },
          votes: [{
            user_id: properties.auth0Id,
            userName: segment.userName || 'Unknown User',
            condition: rating,
            timestamp: segment.createdAt || new Date()
          }],
          stats: {
            averageRating: parseInt(rating),
            totalVotes: 1
          },
          auth0Id: properties.auth0Id,
          userName: segment.userName || 'Unknown User',
          createdAt: segment.createdAt || new Date(),
          updatedAt: segment.updatedAt || new Date()
        };

        await newCollection.insertOne(newSegment);
        successfulMigrations++;
        console.log(`Successfully migrated: ${properties.title}`);

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