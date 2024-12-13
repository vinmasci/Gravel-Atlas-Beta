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

I BELEIVE THE CURRENT ISSUE WITH THE ELEVATION CHART NOT LOADING IS BECAUSE WE ARENT LOADING THE TERRAIN OR SOMETHING LIKE THAT IN:
constants/map-styles.ts