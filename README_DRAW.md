# Draw Segments System Documentation

## 📂 Current Implementation Files

```
app/
├── hooks/
│   └── use-draw-mode.ts              # Core drawing functionality hook
│
├── contexts/
│   └── map-context.tsx              # Map instance context provider
│
components/
└── panels/
    └── draw-segment-panel.tsx       # Drawing UI and controls

types/
└── map.ts                          # TypeScript types for map features
```

## 🔍 Component Breakdown

### use-draw-mode.ts
Core drawing functionality hook that provides:
- Drawing mode state management
- Snap-to-road functionality with Mapbox Directions API
- Point and segment tracking
- Visual feedback (lines and markers)
- Undo/reset capabilities
- GeoJSON conversion for saving

### draw-segment-panel.tsx
User interface component that includes:
- Drawing mode toggle
- Snap-to-road toggle with visual feedback
- Undo/Reset/Save controls
- Save dialog with title input
- Authentication checks
- Toast notifications for user feedback

### map-context.tsx
Context provider that:
- Shares map instance across components
- Manages map state
- Provides type-safe map access

## ✅ Implemented Features

### Drawing System
- Line drawing with point-to-point capability
- Snap-to-road functionality
- Visual markers at click points
- Undo last point functionality
- Reset drawing capability
- Line preview during drawing
- Proper cleanup on cancel/complete

### Snap-to-Road
- Toggle-able snap-to-road feature
- Automatic road snapping using Mapbox API
- Fallback to direct points when snapping fails
- Visual feedback for snapped segments

### UI/UX
- Clear visual feedback for active drawing mode
- Point markers showing click locations
- Intuitive undo/reset controls
- Save dialog with title input
- Toast notifications for user feedback
- Authentication integration

### Data Management
- Segment tracking with metadata
- GeoJSON format conversion
- Basic save functionality
- Proper state cleanup

## 🎯 Next Steps

### High Priority
1. **Data Persistence**
   - Implement MongoDB schema for segments
   - Create API endpoints for segment management
   - Add segment listing and retrieval
   - Implement segment deletion

2. **Enhanced Visualization**
   - Add elevation data to segments
   - Implement segment distance calculation
   - Add segment statistics (length, elevation gain/loss)
   - Preview cards for saved segments

3. **Editing Features**
   - Add ability to edit existing segments
   - Implement segment splitting
   - Add segment joining capability
   - Enable point adjustment after drawing

### Medium Priority
1. **User Experience**
   - Add hover tooltips for controls
   - Implement keyboard shortcuts
   - Add drawing instructions overlay
   - Improve mobile drawing experience

2. **Segment Management**
   - Add segment categorization
   - Implement segment tagging
   - Add segment description field
   - Enable segment sharing

3. **Enhanced Features**
   - Add waypoint annotations
   - Implement surface type selection
   - Add segment difficulty rating
   - Enable segment comments

### Low Priority
1. **Analytics**
   - Track segment popularity
   - Add user statistics
   - Implement heatmaps
   - Add segment recommendations

2. **Social Features**
   - Add segment likes/favorites
   - Implement user following
   - Add segment collections
   - Enable route sharing

## 🛠 Technical Improvements Needed

1. **Performance**
   - Optimize snap-to-road requests
   - Implement point clustering for long segments
   - Add request caching
   - Optimize marker rendering

2. **Error Handling**
   - Add better API error feedback
   - Implement offline support
   - Add connection recovery
   - Improve error messages

3. **Testing**
   - Add unit tests for drawing logic
   - Implement integration tests
   - Add E2E testing
   - Create testing utilities

## 📝 API Requirements

### Endpoints Needed
```typescript
// Segment Management
POST   /api/segments               // Create new segment
GET    /api/segments              // List segments
GET    /api/segments/:id          // Get single segment
PUT    /api/segments/:id          // Update segment
DELETE /api/segments/:id          // Delete segment

// Metadata
GET    /api/segments/:id/stats    // Get segment statistics
GET    /api/segments/:id/elevation // Get elevation data

// User Interaction
POST   /api/segments/:id/favorite  // Favorite a segment
POST   /api/segments/:id/comment   // Comment on segment
```

### MongoDB Schema
```typescript
interface Segment {
  id: ObjectId;
  title: string;
  geojson: FeatureCollection;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    length: number;
    elevationGain: number;
    elevationLoss: number;
    surfaceTypes: string[];
  };
  stats: {
    views: number;
    favorites: number;
    shares: number;
  };
}
```

## 🔒 Security Considerations
1. Validate all user input
2. Implement rate limiting for API calls
3. Add proper authentication checks
4. Validate segment ownership
5. Sanitize segment data
6. Implement proper CORS policies

## 📊 Metrics to Track
1. Segment creation success rate
2. API response times
3. User engagement metrics
4. Error rates
5. Usage patterns
6. Performance metrics

# Draw Segments System Documentation

[Previous sections remain the same until "Data Management" where we add:]

### Data Management
- Segment tracking with metadata
- GeoJSON format conversion
- Basic save functionality
- Proper state cleanup

### Voting System
Currently implementing a community-driven surface condition rating system where:
- Each user gets one vote per segment
- Votes can be updated
- Running average is maintained
- Historical votes are tracked

#### Vote Scale (0-6):
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

## 🎯 Next Steps

### High Priority
1. **Voting System Implementation**
   - Add vote UI component
   - Implement vote submission
   - Create vote average calculation
   - Add vote history tracking
   - Show vote distribution
   - Enable vote updates
   - Add vote validation

2. **Data Persistence**
   [Previous content remains...]

[Previous sections remain the same until "API Requirements" where we add:]

## 📝 API Requirements

### Endpoints Needed
```typescript
// Previous endpoints remain...

// Voting System
POST   /api/segments/:id/vote     // Submit/update vote
GET    /api/segments/:id/votes    // Get vote statistics
GET    /api/segments/:id/vote     // Get user's vote
DELETE /api/segments/:id/vote     // Remove vote

// Analytics
GET    /api/segments/:id/vote-history  // Get voting history
GET    /api/segments/:id/vote-stats    // Get voting statistics
```

### MongoDB Schema
```typescript
// Previous Segment interface remains...

interface Vote {
  userId: string;
  userName: string;
  segmentId: ObjectId;
  condition: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  timestamp: Date;
  previousVotes?: {
    condition: number;
    timestamp: Date;
  }[];
}

interface SegmentVoteStats {
  segmentId: ObjectId;
  averageRating: number;
  totalVotes: number;
  distribution: {
    [key: number]: number;  // condition -> count
  };
  lastUpdated: Date;
}
```

### Vote Component Requirements
```typescript
interface VoteComponentProps {
  segmentId: string;
  currentVote?: number;
  averageRating: number;
  totalVotes: number;
  distribution: Record<number, number>;
  onVote: (rating: number) => Promise<void>;
}
```

## 🎨 UI Components Needed

### Vote Display Component
- Shows current average rating
- Displays vote distribution
- Indicates user's current vote
- Shows total vote count
- Provides visual rating scale

### Vote Input Component
- Rating selector (0-6)
- Submit button
- Update confirmation
- Vote history display
- Visual condition descriptions

### Vote Statistics Component
- Vote distribution chart
- Trend over time
- Recent vote activity
- User participation stats
- Reliability metrics

## 📊 Voting System Metrics
1. Vote distribution patterns
2. Vote update frequency
3. User participation rate
4. Vote consistency
5. Segment rating stability
6. Community engagement

## 🔒 Vote Security Considerations
1. One vote per user per segment
2. Vote manipulation prevention
3. Update frequency limits
4. Vote history tracking
5. Anomaly detection
6. User verification

## 🎯 Voting System Roadmap

### Phase 1: Basic Voting
- ✅ Define vote schema
- ✅ Set up vote tracking
- ⬜ Implement vote submission
- ⬜ Add vote display
- ⬜ Create basic statistics

### Phase 2: Enhanced Features
- ⬜ Add vote history
- ⬜ Implement vote updates
- ⬜ Add distribution display
- ⬜ Create trend analysis
- ⬜ Add community insights

### Phase 3: Advanced Analytics
- ⬜ Implement reliability metrics
- ⬜ Add vote verification
- ⬜ Create user reputation
- ⬜ Add vote recommendations
- ⬜ Implement trend predictions

## 🤝 Community Guidelines
1. Vote based on personal experience
2. Update votes when conditions change
3. Provide constructive feedback
4. Respect community consensus
5. Report suspicious activity
6. Contribute regularly

[Rest of previous sections remain the same...]