# Draw Segments System Documentation

## 📂 Current File Structure
```
app/
├── api/
│   └── segments/
│       ├── route.ts                # GET (list all segments)
│       ├── save/
│       │   └── route.ts           # POST (save new segment)
│       └── [id]/
│           ├── route.ts          # GET, PUT, DELETE (single segment)
│           ├── vote/
│           │   └── route.ts     # POST (vote on segment)
│           └── stats/
│               └── route.ts    # GET (segment statistics)
├── models/
│   └── DrawnSegment.ts           # MongoDB Schema & Model
└── hooks/
    └── use-draw-mode.ts          # Drawing functionality hook

components/
└── panels/
    └── draw-segment-panel.tsx    # Drawing UI and controls
```

## 🎯 Current Implementation

### ✅ Completed Features

1. **Drawing System**
   - Line drawing with point-to-point capability
   - Snap-to-road functionality
   - Visual markers at click points
   - Undo last point functionality
   - Reset drawing capability
   - Line preview during drawing
   - Proper cleanup on cancel/complete

2. **UI Components**
   - Drawing mode toggle
   - Snap-to-road toggle
   - Undo/Reset controls
   - Save dialog with title input
   - Authentication integration
   - Visual feedback for active drawing
   - Point markers for click locations

3. **Database Schema**
   - MongoDB integration with Mongoose
   - GeoJSON support
   - Vote tracking
   - Metadata storage
   - User attribution

4. **API Endpoints**
   ```typescript
   // List Segments
   GET /api/segments
   Query params:
   - limit: number (default: 10)
   - page: number (default: 1)
   - userId: string (optional)
   - bounds: string (optional, format: "west,south,east,north")

   // Save New Segment
   POST /api/segments/save
   Body: {
     geojson: GeoJSON,
     title: string
   }

   // Get Single Segment
   GET /api/segments/[id]

   // Update Segment
   PUT /api/segments/[id]
   Body: {
     metadata: {
       title?: string,
       surfaceTypes?: string[]
     }
   }

   // Delete Segment
   DELETE /api/segments/[id]

   // Vote on Segment
   POST /api/segments/[id]/vote
   Body: {
     condition: "0" | "1" | "2" | "3" | "4" | "5" | "6"
   }

   // Get Segment Stats
   GET /api/segments/[id]/stats
   ```

### 🚧 In Progress

1. **Segment Saving Issues**
   - Debugging save endpoint
   - Adding better error handling
   - Validating data structure
   - Improving error reporting
   - Adding proper logging

2. **Voting System Integration**
   - Vote submission implementation
   - Vote history tracking
   - Average calculation
   - Vote distribution display

### 📝 Next Steps

1. **High Priority**
   - Fix segment saving functionality
   - Complete vote submission system
   - Add segment listing component
   - Implement vote UI

2. **Medium Priority**
   - Add segment editing
   - Implement delete functionality
   - Add segment statistics display
   - Create vote history view

3. **Low Priority**
   - Add elevation data
   - Implement surface type selection
   - Add segment filtering
   - Create user profile view

## 🔍 Component Details

### DrawnSegment Schema
```typescript
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
  votes: Array<{
    user_id: string;
    userName: string;
    condition: string;
    timestamp: Date;
  }>;
  auth0Id: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Vote System
Condition ratings:
```typescript
const surfaceConditions = {
  0: 'Smooth surface, any bike',
  1: 'Well maintained, gravel bike',
  2: 'Occasional rough surface',
  3: 'Frequent loose surface',
  4: 'Very rough surface',
  5: 'Extremely rough surface, MTB',
  6: 'Hike-A-Bike'
}
```

## 🔧 Technical Details

### Current Debugging Focus
- Segment save endpoint validation
- Error handling improvement
- Data structure verification
- MongoDB connection stability
- Session handling verification

### Environment Requirements
```
NEXT_PUBLIC_MAPBOX_TOKEN=     # For map and snap-to-road
DATABASE_URL=                 # MongoDB connection string
AUTH0_SECRET=                # Auth0 secret
AUTH0_BASE_URL=              # Auth0 base URL
AUTH0_ISSUER_BASE_URL=       # Auth0 issuer URL
AUTH0_CLIENT_ID=             # Auth0 client ID
AUTH0_CLIENT_SECRET=         # Auth0 client secret
```

### API Security Measures
1. Auth0 authentication required for:
   - Drawing segments
   - Saving segments
   - Voting
   - Updating/deleting segments
2. Owner-only access for:
   - Segment updates
   - Segment deletion
3. One vote per user per segment
4. Rate limiting implementation pending

## 📚 Usage Examples
[Examples will be added once core functionality is stable]

Would you like me to:
1. Add more technical details?
2. Expand on any section?
3. Add usage examples?
4. Include error handling documentation?