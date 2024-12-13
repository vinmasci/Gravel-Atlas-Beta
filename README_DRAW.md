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

CURRENT ISSUE
THIS BLOCK OF CODE IN MAPVIEW
  // Render Mapbox
  return (
    <MapContext.Provider value={{ map: mapInstance, setMap: setMapInstance }}>
      <div className="w-full h-full relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          style={mapContainerStyle}
          mapStyle={
            selectedStyle === 'osm-cycle'
              ? MAP_STYLES[selectedStyle].style
              : selectedStyle === 'mapbox'
              ? MAP_STYLES[selectedStyle].style
              : 'mapbox://styles/mapbox/empty-v9'
          }
          projection={selectedStyle === 'osm-cycle' ? 'mercator' : 'globe'}
          reuseMaps
          ref={mapRef}
          onLoad={(evt) => {
            setMapInstance(evt.target);
          }}
        />
        {isLoading && <LoadingSpinner />}
        {showAlert && (
          <CustomAlert message="Mapillary overlay is not available with Google Maps layers" />
        )}
        {isMobile ? (
          <MobileControls
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLayerToggle={handleLayerToggle}
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
            overlayStates={overlayStates}
            mapillaryVisible={mapillaryVisible}
          />
        ) : (
          <MapSidebar
            isOpen={isOpen}
            setIsOpen={handleSidebarToggle}
            onSearch={handleSearch}
            onLocationClick={handleLocationClick}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            availableLayers={layers}
            onLayerToggle={handleLayerToggle}
            selectedStyle={selectedStyle}
            onStyleChange={handleStyleChange}
            mapillaryVisible={mapillaryVisible}
            overlayStates={overlayStates}
          />
        )}
                <SegmentDialog
          open={!!selectedSegment}
          onOpenChange={(open) => !open && setSelectedSegment(null)}
          segment={selectedSegment}
        />
      </div>
    </MapContext.Provider>
  );
}

CREATES THIS ERROR:
Failed to compile

./components/segments/segment-dialog.tsx:6:1
Module not found: Can't resolve '@/hooks/use-toast'
  4 | import React, { useState } from 'react';
  5 | import { useUser } from '@auth0/nextjs-auth0/client';
> 6 | import { useToast } from '@/hooks/use-toast';
    | ^
  7 | import {
  8 |   Dialog,
  9 |   DialogContent,

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./components/map-view.tsx

SO I HAVE REMOVED THE                 <SegmentDialog
          open={!!selectedSegment}
          onOpenChange={(open) => !open && setSelectedSegment(null)}
          segment={selectedSegment}
        />

        FOR NOW