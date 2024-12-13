// app/models/DrawnSegment.ts
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
  geojson: {
    type: string;
    properties: Record<string, any>;
    geometry: {
      type: string;
      coordinates: number[][];
    };
  };
  metadata: {
    title: string;
    length?: number;
    elevationGain?: number;
    elevationLoss?: number;
    surfaceTypes?: string[];
  };
  votes: Vote[];
  stats: {
    averageRating?: number;
    totalVotes: number;
  };
  auth0Id: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const drawnSegmentSchema = new Schema<IDrawnSegment>({
  gpxData: {
    type: String,
    required: true
  },
  geojson: {
    type: {
      type: String,
      required: true,
      enum: ['Feature']
    },
    properties: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    geometry: {
      type: {
        type: String,
        required: true,
        enum: ['LineString']
      },
      coordinates: {
        type: [[Number]],
        required: true
      }
    }
  },
  metadata: {
    title: {
      type: String,
      required: true
    },
    length: Number,
    elevationGain: Number,
    elevationLoss: Number,
    surfaceTypes: [String]
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
  stats: {
    averageRating: Number,
    totalVotes: {
      type: Number,
      default: 0
    }
  },
  auth0Id: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  }
}, {
  timestamps: true  // This adds createdAt and updatedAt automatically
});

// Add indexes for better query performance
drawnSegmentSchema.index({ auth0Id: 1 });
drawnSegmentSchema.index({ 'geojson.geometry': '2dsphere' });
drawnSegmentSchema.index({ 'metadata.title': 'text' });

// Virtual for calculating average rating
drawnSegmentSchema.virtual('averageRating').get(function() {
  if (!this.votes || this.votes.length === 0) return null;
  
  const sum = this.votes.reduce((acc, vote) => acc + parseInt(vote.condition), 0);
  return (sum / this.votes.length).toFixed(1);
});

// Pre-save hook to update stats
drawnSegmentSchema.pre('save', function(next) {
  if (this.isModified('votes')) {
    // Update stats when votes change
    const voteCount = this.votes.length;
    const averageRating = voteCount > 0
      ? this.votes.reduce((acc, vote) => acc + parseInt(vote.condition), 0) / voteCount
      : null;

    this.stats = {
      ...this.stats,
      totalVotes: voteCount,
      averageRating
    };
  }
  next();
});

// Helper method to add or update a vote
drawnSegmentSchema.methods.addVote = async function(userId: string, userName: string, condition: string) {
  const existingVoteIndex = this.votes.findIndex(v => v.user_id === userId);
  
  if (existingVoteIndex >= 0) {
    // Update existing vote
    this.votes[existingVoteIndex] = {
      user_id: userId,
      userName,
      condition,
      timestamp: new Date()
    };
  } else {
    // Add new vote
    this.votes.push({
      user_id: userId,
      userName,
      condition,
      timestamp: new Date()
    });
  }

  return this.save();
};

// Create and export the model
export const DrawnSegment = mongoose.models.DrawnSegment || 
  mongoose.model<IDrawnSegment>('DrawnSegment', drawnSegmentSchema);