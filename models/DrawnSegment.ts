import mongoose, { Schema, Document } from 'mongoose';

// Define the vote interface
interface Vote {
  user_id: string;
  userName: string;
  condition: string;
  timestamp: Date;
}

// Define the document interface
interface IDrawnSegment extends Document {
  gpxData: string;
  geojson: any;
  metadata: {
    title: string;
  };
  votes: Vote[];
  auth0Id: string;
  createdAt: Date;
}

// Create the schema
const drawnSegmentSchema = new Schema<IDrawnSegment>({
  gpxData: {
    type: String,
    required: true
  },
  geojson: {
    type: Schema.Types.Mixed,
    required: true
  },
  metadata: {
    title: {
      type: String,
      required: true
    }
  },
  votes: [{
    user_id: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    condition: {
      type: String,
      required: true,
      enum: ['0', '1', '2', '3', '4', '5', '6']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  auth0Id: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the model
export const DrawnSegment = mongoose.models.DrawnSegment || mongoose.model<IDrawnSegment>('DrawnSegment', drawnSegmentSchema);