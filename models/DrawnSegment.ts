import mongoose from 'mongoose';

const drawnSegmentSchema = new mongoose.Schema({
  gpxData: {
    type: String,
    required: true
  },
  geojson: {
    type: Object,
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

export const DrawnSegment = mongoose.models.DrawnSegment || mongoose.model('DrawnSegment', drawnSegmentSchema);