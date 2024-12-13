# Draw Segments System Documentation

## 📚 Source Code Reference
To access the source code from Gravel-Atlas2:

1. **Repository Access**
```bash
# Repository Information
Owner: vinmasci
Repository: Gravel-Atlas2
Access: Public repository
```

2. **Key File Paths**
```
# Core Files for Drawing System
api/save-drawn-route.js
models/RoadModification.js
js/routes.js

# To access these files using GitHub API:
get_file_contents:
  - path: "api/save-drawn-route.js"
  - repo: "Gravel-Atlas2"
  - owner: "vinmasci"
```

3. **Reference Paths**
- For implementation details, check:
  ```
  api/
    - save-drawn-route.js      # Route saving logic
    - get-drawn-routes.js      # Route retrieval
    - delete-drawn-route.js    # Route deletion
    - get-road-modifications.js # Surface modifications
  js/
    - routes.js               # Drawing implementation
    - map.js                  # Map integration
  models/
    - RoadModification.js     # Data schemas
    - Activity.js            # User activity tracking
  ```

[Previous content remains the same...]

# Draw Segments System Documentation

## 🎯 Current Implementation (Gravel-Atlas2)

### Data Structure
```typescript
// Route Schema
interface DrawnRoute {
  gpxData: string;
  geojson: FeatureCollection;
  metadata: {
    title: string;
    initialDifficulty: string; // To be removed in new system
  };
  auth0Id: string;
  votes: Vote[];
  createdAt: Date;
}

// Vote Schema
interface Vote {
  user_id: string;
  userName: string;
  condition: string; // 0-6 rating
  timestamp: Date;
}

// Condition Rating Scale
const difficultyLevels = [
  '0: Smooth surface, any bike',
  '1: Well maintained, gravel bike',
  '2: Occasional rough surface',
  '3: Frequent loose surface',
  '4: Very rough surface',
  '5: Extremely rough surface, MTB',
  '6: Hike-A-Bike'
]
```

### Core Features
1. **Route Drawing**
   - Draw route segments on map
   - Automatic elevation data enrichment
   - GPX data generation
   - Multiple segment support
   - LineString geometry type

2. **Metadata Handling**
   - Title assignment
   - User attribution (auth0Id)
   - Initial difficulty rating (to be removed)
   - Creation timestamp

3. **Voting System**
   - Per-user voting
   - Historical vote tracking
   - User identification
   - Timestamp tracking
   - 0-6 difficulty scale

### File Structure
```
api/
  ├── save-drawn-route.js       # Route saving endpoint
  ├── get-drawn-routes.js       # Route retrieval
  └── get-road-modifications.js # Vote/modification data
models/
  └── RoadModification.js       # Schema definitions
js/
  ├── routes.js                 # Drawing functionality
  └── map.js                    # Map integration
```

## 🔄 Planned Changes for Gravel-Atlas-Beta

### Modified Data Flow
1. **Drawing Phase**
   - User draws route segment
   - Elevation data enrichment
   - Basic metadata collection (title, user)
   - Initial save without difficulty rating

2. **Voting Phase**
   - Creator submits first vote
   - Other users can vote
   - Running average calculation
   - Vote history maintenance

### Database Updates
1. **Route Collection**
   ```javascript
   {
     _id: ObjectId,
     gpxData: String,
     geojson: {
       type: "FeatureCollection",
       features: [{
         type: "Feature",
         geometry: {
           type: "LineString",
           coordinates: [[lng, lat, elevation]]
         },
         properties: {
           title: String,
           auth0Id: String
         }
       }]
     },
     metadata: {
       title: String
     },
     votes: [{
       user_id: String,
       userName: String,
       condition: String,
       timestamp: Date
     }],
     auth0Id: String,
     createdAt: Date
   }
   ```

2. **Vote Collection**
   ```javascript
   {
     route_id: ObjectId,
     votes: [{
       user_id: String,
       userName: String,
       condition: String,
       timestamp: Date
     }],
     averageRating: Number,
     totalVotes: Number
   }
   ```

### API Endpoints Needed
1. **Drawing**
   - POST /api/routes/save
   - GET /api/routes/list
   - DELETE /api/routes/:id

2. **Voting**
   - POST /api/routes/:id/vote
   - GET /api/routes/:id/votes
   - PUT /api/routes/:id/vote (update vote)

### UI Components Required
1. **Drawing Interface**
   - Draw tool activation
   - Segment visualization
   - Elevation preview
   - Save controls

2. **Voting Interface**
   - Difficulty selector
   - Vote submission
   - Vote history view
   - Average rating display

### Security Considerations
1. **Route Creation**
   - Authentication required
   - User verification
   - Rate limiting

2. **Voting**
   - One vote per user per route
   - Vote modification allowed
   - Vote history tracking

## 🎯 Implementation Steps

1. **Phase 1: Basic Drawing**
   - Implement route drawing tools
   - Set up MongoDB schema
   - Create save endpoint
   - Add elevation enrichment

2. **Phase 2: Voting System**
   - Create voting UI
   - Implement vote endpoints
   - Add vote tracking
   - Calculate averages

3. **Phase 3: UI/UX**
   - Add loading states
   - Implement error handling
   - Add success notifications
   - Mobile optimization

4. **Phase 4: Enhancement**
   - Add vote history
   - Implement statistics
   - Add user profiles
   - Add moderation tools

## 📝 Technical Notes
- Environment variables needed for MongoDB and Mapbox
- Proper error handling required for elevation data fetching
- Rate limiting implementation for API endpoints
- Proper cleanup of drawn routes on cancellation
- Optimistic updates for voting system
- Proper validation for vote submissions

Based on our conversation, here's my understanding of what you want to do:

1. You want to merge the route drawing and voting system from Gravel-Atlas2 into your newer Gravel-Atlas-Beta project, but with a key modification:

2. The main change is in the workflow:
   - In Gravel-Atlas2: Users draw a segment AND assign a difficulty rating immediately
   - In the new system: Users only draw the segment first, then both they and others can vote on its difficulty later

3. Specifically for Gravel-Atlas-Beta, you want:
   - Keep the drawing functionality for segments
   - Remove the initial difficulty rating requirement
   - Implement the voting system where:
     - The original creator can vote on difficulty after creating
     - Other users can also vote on the same segment
     - Each user gets one vote (but can update their vote)

4. From what I can see in the GPX data you shared, the segments are currently storing:
   - Geographic coordinates with elevation data
   - Metadata like title and user ID
   - Line styling (color, dash array)
   - Properties including gravelType

Is this an accurate understanding of what you're looking to implement? Would you like to clarify or correct any part of this?

I suggest we start with laying out the tasks in order of priority. Let me outline a step-by-step approach:

First Task - Drawing Functionality:

We need to add the draw control panel from Gravel-Atlas2 to your Gravel-Atlas-Beta
This would start in components/panels/contribute-panel.tsx
We'll need the route drawing logic from the original routes.js
The saving mechanism will be similar to save-drawn-route.js but without the difficulty rating


Second Task - MongoDB Schema:

Modify your current schema to accommodate the voting system
Add the vote collection structure from RoadModification.js
Set up the API endpoints for vote handling



Would you like to start with the drawing functionality? If so, I can:

Show you the proposed changes to your contribute-panel component
Set up the route drawing logic
Create the save endpoint without the difficulty rating

Which part would you like to tackle first?

# Draw Segment Implementation Progress

## Created Files & Structure

```
app/
├── contexts/
│   └── map-context.tsx              # Map context provider for sharing map instance
├── hooks/
│   └── use-draw-mode.ts             # Custom hook for handling draw functionality
├── api/
│   └── segments/
│       └── save/
│           └── route.ts             # API endpoint for saving drawn segments
models/
└── DrawnSegment.ts                  # Mongoose model for segments

components/
└── panels/
    └── draw-segment-panel.tsx       # Panel component with integrated drawing interface

Files Modified:
└── components/
    └── map-view.tsx                # Added MapContext provider and map instance state
```

## Implementation Details

### 1. Map Context (`map-context.tsx`)
- Provides map instance across components
- Exports both context and custom hook
- Type-safe implementation with MapContextType interface

### 2. Drawing Hook (`use-draw-mode.ts`)
- Manages drawing state and coordinates
- Handles map click interactions
- Controls line drawing visualization
- Manages drawing layer on map
- Provides undo functionality
- Handles drawing cleanup
- Manages cursor states
- Provides GeoJSON conversion

### 3. Draw Segment Panel (`draw-segment-panel.tsx`)
- Provides main interface in sidebar
- Authentication check for drawing
- Toggle-able drawing mode with visual feedback
- Drawing tool controls:
  - Undo last point
  - Reset drawing
  - Save segment
- Snap to road option
- Save dialog with title input
- Integration with map context and drawing hook

### 4. Map View Modifications (`map-view.tsx`)
Added:
- MapContext.Provider wrapper
- Map instance state management
- onLoad handler for map instance
- Drawing layer support

### 5. MongoDB Schema (`DrawnSegment.ts`)
- Implements segment data structure
- Includes vote schema
- Handles GPX and GeoJSON data
- Tracks user attribution
- Manages timestamps

### 6. API Routes (`/api/segments/save/route.ts`)
- Handles segment saving
- Server-side GPX generation
- Authentication check
- Data validation
- MongoDB integration

## Currently Implemented
1. ✅ MongoDB Schema Setup
2. ✅ Basic API Route (save)
3. ✅ Drawing Interface with Tools
4. ✅ Map Context System
5. ✅ Interactive Drawing System

## Next Steps To Implement
1. API Routes:
   - Segment retrieval (`GET /api/segments`)
   - Vote submission endpoint
   - Vote retrieval endpoint
2. Voting System:
   - Vote interface
   - Vote submission
   - Vote display
3. Segment Display Layer:
   - Load segments on map
   - Segment styling
   - Segment interaction
4. Enhanced Drawing Features:
   - Implement snap to road functionality
   - Add elevation data
   - Add distance calculations

## Dependencies Added
```bash
npm install mongoose @turf/turf
```

## Environment Variables Required
```
MONGODB_URI=your_mongodb_connection_string
```

## Usage Instructions
1. Click the "Draw Segment" accordion in the sidebar
2. Authenticate if not already logged in
3. Click "Start Drawing" to enter drawing mode
4. Click on the map to place points
5. Use tools while drawing:
   - Undo: Remove last point
   - Reset: Clear current drawing
   - Save: Complete drawing and add title
6. Save dialog will appear for title input
7. Segment is saved to database with GPX and GeoJSON data