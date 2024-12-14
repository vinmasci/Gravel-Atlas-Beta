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
├── segments/
│   └── segment-dialog.tsx        # Segment details and voting dialog
└── panels/
    └── draw-segment-panel.tsx    # Drawing UI and controls

lib/
└── segment-layer.ts              # Segment map layer handling
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

3. **Segment Display**
   - Map layer for segments
   - Bound-based segment fetching
   - Segment highlighting on hover
   - Click to view details
   - Performance optimized layer updates

4. **Segment Dialog**
   - Detailed segment information display
   - Surface condition voting system
   - User attribution
   - Length and statistics display
   - Authentication integration for voting
   - Real-time rating updates

5. **Database Schema**
   - MongoDB integration with Mongoose
   - GeoJSON support
   - Vote tracking
   - Metadata storage
   - User attribution

6. **API Endpoints**
   ```typescript
   // List Segments
   GET /api/segments
   Query params:
   - bounds: string (format: "west,south,east,north")
   - limit: number (default: 10)
   - page: number (default: 1)
   - userId: string (optional)

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

### 🚧 Current Development

1. **Vote System Refinements**
   - Vote distribution visualization
   - User vote history
   - Vote moderation system
   - Vote trend analysis

2. **UI/UX Improvements**
   - Segment style customization
   - Enhanced hover states
   - Mobile responsiveness
   - Loading states
   - Error handling improvements

### 📝 Next Steps

1. **High Priority**
   - Add segment editing capabilities
   - Implement segment filtering
   - Add segment search functionality
   - Create segment lists/collections

2. **Medium Priority**
   - Add elevation data
   - Implement surface type selection
   - Add segment filtering by rating
   - Create user profile view with segments

3. **Low Priority**
   - Add segment comments
   - Implement sharing functionality
   - Create segment routes/trails
   - Add segment metadata export

## 🔍 Technical Details

### Surface Conditions
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

## 🔧 Environment Requirements
```
NEXT_PUBLIC_MAPBOX_TOKEN=     # For map and snap-to-road
DATABASE_URL=                 # MongoDB connection string
AUTH0_SECRET=                # Auth0 secret
AUTH0_BASE_URL=              # Auth0 base URL
AUTH0_ISSUER_BASE_URL=       # Auth0 issuer URL
AUTH0_CLIENT_ID=             # Auth0 client ID
AUTH0_CLIENT_SECRET=         # Auth0 client secret
```

## 📚 Usage Examples

### Drawing a Segment
1. Toggle drawing mode
2. Click points on map
3. Optional: Toggle snap-to-road
4. Use undo/reset as needed
5. Save with title

### Voting on a Segment
1. Click segment on map
2. View segment details
3. Select surface condition
4. Submit vote
5. View updated statistics

## 💡 Known Issues
1. Snap-to-road may fail for remote areas
2. Vote updates may require refresh
3. Segment style changes not persisted

## 🔄 Future Improvements
1. Batch segment operations
2. Advanced filtering options
3. Segment relationships/connections
4. Enhanced statistics
5. Export capabilities

ADD ONS
# Elevation Profile Implementation

## 📂 New Files Added

```
components/
└── segments/
    └── elevation-profile.tsx    # Elevation profile visualization component

lib/
└── elevation-utils.ts          # (Optional) Utility functions for elevation calculations
```

## 🔧 Modified Files

1. **app/hooks/use-draw-mode.ts**
   - Added elevation sampling functionality
   - Integrated terrain querying with Mapbox
   - Added elevation profile state management

2. **components/map-view.tsx**
   - Added terrain source configuration
   - Integrated elevation profile display
   - Added elevation data flow management

## 📊 Component Details

### ElevationProfile Component
```typescript
interface ElevationPoint {
  distance: number;  // Distance in kilometers
  elevation: number; // Elevation in meters
}

interface ElevationProfileProps {
  data: ElevationPoint[];
  className?: string;
}
```

Features:
- Real-time elevation visualization
- Distance and elevation metrics
- Total elevation gain calculation
- Responsive chart sizing
- Interactive tooltips

### Implementation Requirements
1. Mapbox GL JS v2.0 or higher
2. Mapbox terrain-rgb tileset access
3. recharts library for visualization

## 🎯 Usage

The elevation profile appears automatically while drawing segments:
1. Shows in bottom-right corner of map
2. Updates in real-time as points are added
3. Displays:
   - Current elevation
   - Total elevation gain
   - Distance covered
   - Elevation profile graph

## 🔍 Technical Details

### Terrain Configuration
```typescript
// Required Mapbox terrain source
{
  'mapbox-dem': {
    type: 'raster-dem',
    url: 'mapbox://mapbox.terrain-rgb',
    tileSize: 512,
    maxzoom: 14
  }
}

// Terrain settings
{
  source: 'mapbox-dem',
  exaggeration: 1
}
```

### Elevation Sampling
- Samples elevation at each drawn point
- Interpolates between points for smooth profile
- Calculates cumulative distance and elevation gain
- Updates profile data in real-time

## 💡 Dependencies Added
```json
{
  "dependencies": {
    "recharts": "^2.10.3"
  }
}
```

## 🔄 Future Improvements
1. Elevation data caching
2. Customizable profile display
3. Export elevation data
4. Gradient coloring based on slope
5. Alternative elevation data sources

## 📝 Notes
- Elevation data requires Mapbox's terrain-rgb tileset
- Terrain source must be added before querying elevations
- Profile updates may have slight delay due to API calls
- Consider adding error handling for missing elevation data

# Elevation Implementation 

## Overview
This implementation uses server-side terrain elevation calculation by directly accessing Mapbox's terrain-rgb tiles. This approach provides several advantages over client-side terrain querying:

- More reliable elevation data retrieval
- Works with any map style
- No need to configure terrain sources in the client map
- Better error handling and fallbacks

## Architecture

### Backend (`/api/get-elevation`)
The elevation data is processed server-side using the following components:
- Direct access to Mapbox terrain-rgb tiles
- Pixel value decoding to elevation values
- Coordinate to tile coordinate conversion
- Proper error handling and fallbacks

### Frontend (Drawing System)
The drawing system handles elevation in these steps:
1. Immediate visual feedback when drawing
2. Asynchronous elevation data fetching
3. State updates with elevation data
4. Elevation profile updates

## Technical Details

### Tile Coordinates
```javascript
function lngLatToTile(lng, lat, zoom) {
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
}
```

### Elevation Calculation
- Uses Mapbox's terrain-rgb tiles at zoom level 14
- Each pixel contains elevation data encoded in RGB values
- Elevation calculation: `-10000 + ((R * 256 * 256 + G * 256 + B) * 0.1)`
- Returns elevation in meters

### API Endpoint
```typescript
POST /api/get-elevation
Body: {
  coordinates: [number, number][] // Array of [longitude, latitude] pairs
}
Response: {
  coordinates: [number, number, number][] // Array of [longitude, latitude, elevation]
}
```

## Usage Example
```typescript
// Fetch elevation for a point
const elevation = await getElevation([[longitude, latitude]]);
console.log(elevation); // [[longitude, latitude, elevationInMeters]]
```

## Error Handling
1. Invalid coordinates return 400 Bad Request
2. Failed tile fetches return 500 Internal Server Error
3. Client-side fallbacks to 0 elevation if server fails
4. Proper cleanup on component unmount

## Dependencies
- node-fetch for server-side requests
- canvas for processing terrain-rgb tiles
- Mapbox API token with terrain-rgb tileset access

## Performance Considerations
- Batches multiple elevation requests when possible
- Immediate visual feedback while fetching elevation
- Caching could be implemented for frequently accessed tiles
- Consider implementing elevation data throttling for long segments

## Implementation Notes
- Zoom level 14 provides optimal balance of precision and performance
- Terrain-rgb tiles have 0.1 meter precision
- Maximum zoom level supported is 15
- Consider implementing tile caching for improved performance
- Handles coordinate precision up to 6 decimal places

## Future Improvements
1. Implement tile caching
2. Add elevation profile smoothing
3. Batch process elevation requests
4. Add elevation data compression
5. Implement proper error retries

## 🔄 Development Update - Elevation Profile Implementation

### Recently Implemented ✅
1. **Real-time Elevation Profile**
   - Added floating elevation chart while drawing segments
   - Shows elevation gain, min, and max values
   - Updates dynamically as points are added
   - Positioned above navbar with proper spacing
   - Uses recharts for visualization

2. **File Changes**
   - Created `floating-elevation-profile.tsx`
   - Updated `draw-segment-panel.tsx` to include elevation chart
   - Removed redundant `elevation-profile.tsx` (superseded by floating version)
   - Integrated with existing elevation API endpoint

### Technical Details 📝
1. **Component Structure**
   ```
   components/
   ├── segments/
   │   └── floating-elevation-profile.tsx    # New floating chart component
   └── panels/
       └── draw-segment-panel.tsx           # Updated to include elevation chart
   ```

2. **Positioning**
   - Fixed position at `left-[360px]` to account for sidebar
   - Bottom spacing with `bottom-4` for navbar clearance
   - Width: 800px
   - Height: 150px
   - z-index: 50 to float above map

3. **Chart Features**
   - Line graph showing elevation over distance
   - Red theme (#ef4444) for consistency
   - Distance in kilometers with one decimal
   - Elevation in whole meters
   - Responsive tooltips with dark theme
   - No data points for cleaner look
   - Grid removed for minimal aesthetic

### Cleanup Tasks 📋
1. **Redundant Files to Remove**
   - `components/segments/elevation-profile.tsx` (replaced by floating version)
   - Any references to old ElevationProfile component

### Future Improvements 🎯
1. **Visualization**
   - Add area fill under the line
   - Implement gradient fill
   - Add hover state improvements
   - Consider animation on updates

2. **Functionality**
   - Add slope calculation
   - Show gradient percentage
   - Add elevation breakdown (up/down)
   - Consider elevation smoothing

3. **UX Enhancements**
   - Add minimize/maximize option
   - Consider mobile responsiveness
   - Add export capabilities
   - Implement elevation data caching

   Here's what we did:

1. Original Problem:
- The elevation profile was showing up inside the sidebar when drawing segments
- We wanted it to be full-width at the bottom of the screen, like RideWithGPS

2. Solution Approach:
- We created a DrawModeContext to share the drawing state
- Moved the FloatingElevationProfile out of the sidebar
- Put it at the root level in map-view.tsx

3. What Worked:
- Setting up the DrawModeContext
- The floating elevation profile component itself works correctly
- Data flow through the context is working

4. What Didn't Work Initially:
- The mapInstance check (`{mapInstance && <FloatingElevationProfile />}`) was preventing the profile from showing
- This was unnecessary since the profile gets its data through the DrawMode context
- Fixed by removing the mapInstance check

Key Learning:
The elevation profile should be displayed based on drawing state (isDrawing) and elevation data existence, not based on map instance availability.

Want me to clarify any part of this?