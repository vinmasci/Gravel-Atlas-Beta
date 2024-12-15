# Gravel Atlas Essential Documentation

SOME RULES
IMPORTANT!! Dont try to edit my files yourself
IMPORTANT!! Be specific when adding code suggestions.. always show precisely where and how to add code into existing files.. 
IMPORTANT!! When providing code changes, show me precisely where to put it by showing me code that comes before and after where you want the change.. dont simply say, near or above the handlers..

## 🎯 Project Overview
A web application for mapping and exploring gravel roads across Australia, built with Next.js, Mapbox, and modern web technologies.

## 🔑 Core Features

### Authentication & User Management
- Auth0 integration
- User profiles with MongoDB
- AWS S3 for profile pictures
- Dark/Light mode persistence

### Map Integration
- Multiple providers: Mapbox, OSM Cycle, Google Maps
- Layer system for segments, photos, roads
- Mapillary integration (except Google Maps)

### Photo System
- Upload with GPS metadata extraction
- Map markers and clustering
- Photo preview and details
- AWS S3 storage

### Draw Segments System
- Line drawing with point-to-point capability
- Snap-to-road functionality
- Surface condition voting system
- Elevation profile display

## 🛠 Technical Stack
- Next.js 14 (App Router)
- Auth0 Authentication
- AWS S3
- MongoDB/Mongoose
- Mapbox GL JS
- TypeScript
- Tailwind CSS/shadcn/ui
- Canvas for elevation data

## 📁 Project Structure Map

### `/app` - Core Application
- `/admin` - Admin dashboard and management
- `/api` - API routes:
  - `/get-elevation` - Elevation data processing
  - `/photos` - Photo management
  - `/segments` - Segment operations
  - `/user` - User management
- `/models` - MongoDB schemas

### `/components` - React Components
- `/auth` - Authentication components
- `/layout` - Core layout elements
- `/panels` - Control panels and tools
- `/segments` - Segment-related components
- `/ui` - Shared UI components

### `/lib` - Utility Functions
- `db.ts` - Database utilities
- `mongodb.ts` - MongoDB connection
- `mapillary.ts` - Mapillary integration
- `utils.ts` - Shared utilities

### `/public` - Static Assets
- Images, icons, and other static files

## 🔧 Essential Environment Variables
```env
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_THUNDERFOREST_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

MONGODB_URI=
```

## 🚀 Key Development Notes

### Elevation Profile Implementation
- Uses canvas package for terrain data processing
- Requires specific Node.js version (18.x) for Vercel deployment
- Samples elevation at fixed intervals
- Real-time updates during drawing

### Photo Management
- Handles EXIF data extraction
- Implements clustering for map display
- Supports multiple file uploads
- Includes automatic metadata processing

### Known Limitations
- OSM Cycle Map requires zoom level 6+ for proper display
- Mapillary only works with Mapbox/OSM
- Layer states don't persist between map style changes

## 💡 Common Issues & Solutions

### Path Resolution
- Use relative paths for imports in deployment
- Ensure correct path depth for nested components
- Update tsconfig.json paths appropriately

### Deployment
- Set Node.js version to 18.x in package.json
- Configure canvas package properly for Vercel
- Handle environment variables in Vercel dashboard

### State Management
- Drawing mode requires proper cleanup
- Photo uploads need progress tracking
- Layer toggling needs state persistence

## 🔄 Development Workflow
1. Start with feature branch
2. Test locally with sample data
3. Verify environment variables
4. Test all related features
5. Deploy to Vercel
6. Verify production build

## 🔄 Recent Updates (December 2024)

### Segment Sheet Enhancements
- Added user profile section to match photo viewer functionality
- Implemented social media links display (website, Instagram, Strava)
- Added elevation profile visualization using Recharts
- Integrated comments system with user avatars and timestamps
- Surface condition voting now uses an accordion to save space

### Known Issues
- User information not loading properly in segment sheet - need to fix user data fetching
- Elevation profile visualization not displaying - need to verify elevation data is being passed correctly
- Comments API needs proper MongoDB connection

### Next Steps
- Fix user data population in segments API
- Debug elevation profile data flow
- Complete comments system implementation
- Add error handling for missing profile images

## 🔄 Recent Updates (December 2024) - WHAT WE ARE UP TO NOW
We've implemented elevation profile functionality with partial success:

### What's Working
- Real-time elevation data collection during segment drawing
- Live elevation profile visualization while drawing segments
- Elevation gain/loss calculations (visible in saved segments)
- Successful integration with Mapbox elevation API

### Current Issues
- Elevation profile data points are not being persisted in MongoDB
- While elevationGain (23m) and elevationLoss (14m) are saved, the detailed point-by-point elevation data is missing
- The elevation profile graph only works during drawing but not when viewing saved segments

### Next Steps
1. Fix elevation profile data persistence:
   - Modify how elevation data is transferred from drawing state to save payload
   - Ensure elevation profile array is included in MongoDB document
   - Update segment schema to properly store the elevation point array
2. Implement elevation profile visualization for saved segments
3. Add server-side validation for elevation data
4. Add elevation data to GPX export

The core functionality is in place but needs adjustments to the data flow between the drawing interface and data persistence layer.

## 🔄 Updates (December 14, 2024)

### Elevation Profile Fix
- Fixed elevation data persistence and display in segment viewer
- Modified segment click handler to fetch complete segment data from MongoDB
- Elevation profile now correctly displays using 3D coordinates from GeoJSON
- Successfully mapped elevation gain/loss and terrain profile visualization
- Implemented full data fetching strategy: instead of relying on map layer properties, we now fetch the complete segment data when clicked

### What's Working
- Full elevation profile visualization for saved segments
- Real-time elevation data during drawing
- Elevation gain/loss calculations
- Segment details include complete elevation data
- 3D coordinates (longitude, latitude, elevation) properly stored and retrieved

### Implementation Details
- Modified segment-layer.ts to fetch complete segment data on click
- Using MongoDB's 3D coordinate storage `[longitude, latitude, elevation]`
- Seamless integration between drawing mode and saved segment visualization

## 🔄 Recent Updates (December 2024)
Fixed several issues with the segment sheet display and interaction:

### Segment Sheet Improvements
- Fixed distance display to correctly show segment length from metadata
- Added surface condition rating indicator that matches segment line colors
- Ensured rating persistence and display after voting
- Corrected title display in segment sheet
- Unified color scheme between segment lines and rating indicators

### Data Flow Improvements
- Properly integrated MongoDB stats for segment ratings
- Fixed voting system to update and persist ratings
- Ensured consistent color representation across the application

## Recent Updates (December 15, 2024) - Gravel Roads Layer Implementation

### Data Extraction
Successfully extracted gravel/unpaved roads data from OpenStreetMap (australia-latest.osm.pbf):
- Used GDAL/OGR with a custom query to extract roads with specific surfaces (unpaved, gravel, dirt, etc.)
- Included NULL and unknown surface types for 'highway=track' to capture unmarked gravel roads
- Command used:
```bash
ogr2ogr -f "GeoJSON" australia_gravel_roads.geojson -overwrite -oo CONFIG_FILE=osmconf.ini australia-latest.osm.pbf -sql "SELECT osm_id, name, highway, surface, maxspeed, access FROM lines WHERE highway IS NOT NULL AND (surface IN ('unpaved', 'compacted', 'fine_gravel', 'gravel', 'dirt', 'earth', 'ground', 'grass', 'mud', 'sand', 'wood', 'unknown') OR (highway = 'track' AND (surface IS NULL OR surface = 'unknown')))"
Vector Tile Creation
Converted to MBTiles using Tippecanoe with specific parameters for web optimization:
bashCopytippecanoe -o australia_gravel_roads.mbtiles \
--minimum-zoom=8 \
--maximum-zoom=16 \
--layer=gravel_roads \
--force \
--no-feature-limit \
--no-tile-size-limit \
--no-tile-compression \
--preserve-input-order \
--no-line-simplification \
--simplify-only-low-zooms \
--base-zoom=10 \
australia_gravel_roads.geojson
Current Implementation Status
The layer is partially implemented in the web application:

Successfully uploads to MapTiler (ID: 2378fd50-8c13-4408-babf-e7b2d62c857c)
Source and layer are properly initialized in Mapbox GL JS
Toggle functionality is implemented
Layer and source are confirmed present in map instance

Current Issue
The layer is not visually rendering despite being properly initialized. Debugging shows:

Source is correctly loaded with vector tiles
Layer exists with correct styling
Visibility property toggles correctly
Next step is to verify source-layer name and tile data structure from MapTiler

Next Steps

Verify vector tile structure using MapTiler's tile JSON
Confirm source-layer name matches the tile data
Implement proper error handling for tile loading
Add visibility debugging tools

## 🔄 Gravel Roads Layer Implementation Details (December 2024)

### Data Extraction and Processing
- Successfully extracted unpaved/gravel road data from OpenStreetMap australia-latest.osm.pbf
- Used GDAL/OGR with custom query to capture:
  - Explicitly marked unpaved/gravel surfaces
  - Unknown surface types
  - Roads with NULL surface data
- Converted to Vector Tiles using Tippecanoe for web optimization
  ```bash
  tippecanoe -o australia_gravel_roads.mbtiles \
  --minimum-zoom=8 \
  --maximum-zoom=16 \
  --layer=gravel_roads \
  --force \
  --no-feature-limit \
  --no-tile-size-limit \
  --no-tile-compression \
  --preserve-input-order \
  --no-line-simplification \
  --simplify-only-low-zooms \
  --base-zoom=10 \
  australia_gravel_roads.geojson

  Layer Features

Zoom levels 8-16 for optimal performance and file size
Progressive line width scaling (1px at zoom 8 to 5px at zoom 20)
Color coding:

Orange: Standard accessible roads
Red: Roads marked as private or no access


Hover popups showing:

Road name (when available)
Surface type
Access restrictions
Speed limits (when available)



Technical Implementation

Source: Vector tiles hosted on MapTiler
Layer type: 'line' with rounded caps and joins
Source layer name: 'gravel_roads'
Custom visibility controls integrated with map overlay system
Progressive scaling even beyond max tile zoom (16)

Optimization Notes

Max zoom level kept at 16 for file size management
Line width interpolation used to maintain visibility at higher zooms
Tile size optimizations maintained through Tippecanoe settings
Efficient attribute filtering for relevant road data

Future Considerations

Potential for separate layers based on surface types
Speed limit data enrichment
Additional attribute filtering options
Style variations based on road classification
Possible integration with elevation data

Copy
This will provide a good reference for:
1. Future development work
2. Understanding the current implementation
3. Discussing potential improvements with Claude or other developers
4. Documenting the technical decisions made

## 🔄 Recent Updates (December 15, 2024) - Drawing Mode Enhancements

### Implemented Changes
- Improved line styling with black stroke and cyan fill
- Fixed elevation profile distance calculations for multi-segment routes
- Implemented 100m interval sampling for elevation data to improve performance
- Adjusted grade calculations to provide more accurate terrain information
- Fixed marker persistence issues when adding multiple points

### Styling Updates
- Line style: Cyan with black stroke
- Markers: Cyan with black border
- No opacity on all elements for clear visibility

### Technical Improvements
- Modified elevation data collection to sample at 100m intervals
- Fixed cumulative distance calculations in elevation profile
- Improved state management for drawn coordinates

### Next Steps
- Implement interactive hover functionality between elevation profile and map
  - Add hover marker on map corresponding to elevation profile position
  - Show elevation data when hovering over map points
  - Add visual feedback for hover interactions

### Performance Optimizations
- Reduced API calls through intelligent sampling
- Improved handling of long-distance routes
- Better memory management for multi-segment paths

## 🔄 Data Migration (December 2024)
We've implemented a migration script to transfer segments from our old database (roadApp.drawnRoutes) to the new format (photoApp.drawnsegments).

### Migration Script
Located in `/scripts/migrate-segments.js`, the script:
- Converts old color-based ratings to numeric ratings:
  - #01bf11 (Green) → 1 (Well maintained)
  - #ffa801 (Yellow) → 2 (Occasionally rough)
  - #c0392b (Red) → 4 (Very rough)
  - #751203 (Maroon) → 6 (Hike-A-Bike)
- Preserves all coordinate and elevation data
- Maintains user attribution via auth0Id

### Current Status
- Successfully migrated 484 out of 516 segments
- Short segments with simple geometry display correctly on the map
- Longer segments with multiple parts (e.g., Bowden Spur Rd) aren't displaying

### Known Issues
- Segments with multiple parts in the original GPX data aren't rendering properly
- Long segments need their coordinates properly concatenated
- Some segments have duplicate coordinate points at segment joins

### Next Steps
1. Update migration script to properly handle multi-segment routes
2. Remove duplicate coordinates at segment boundaries
3. Validate coordinate array structure for complex segments
4. Add elevation gain/loss calculations during migration

To run the migration:
```bash
npm run migrate

## 🔄 Migration Issues and Attempts (December 2024)

### The Problem
Attempting to migrate multi-segment roads (FeatureCollections) from old database (roadApp.drawnRoutes) to new database (photoApp.drawnsegments). Segments stored in the old database as FeatureCollections (multiple connected line segments) need to work with the new map display layer.

### Failed Attempts
1. Converting FeatureCollections to single Features
   - Tried combining coordinates into one continuous line
   - Lost data integrity in the process
   - Segments didn't display on map

2. Modifying MongoDB Schema
   - Updated schema to accept both Feature and FeatureCollection types
   - Data migrated but segments still not visible on map

3. Modifying segment-layer.ts
   - Attempted to handle both Feature and FeatureCollection cases
   - Added flattening of features array
   - Still failed to display segments properly

### Current Status
- Migration script successfully copies data
- Elevation and distance calculations working correctly
- Color-to-rating conversion working
- BUT: Segments still not displaying on map
- Issue remains unresolved

### Next Steps
Further investigation needed into:
1. Map layer rendering of FeatureCollections
2. Data structure compatibility between database and Mapbox GL JS
3. Potential alternative approaches to handling multi-segment roads

This documents our attempts to solve the multi-segment road migration issue, with all approaches so far unsuccessful. Further work needed to resolve the display problems while maintaining data integrity.

THE LAST ATTEMPTS WERE:
I notice in the working document that duplicate points at joins appear THREE times, not just twice like in my script. Let me explain what I see:

Working document coordinate pattern at joins:

javascriptCopy[pointA, pointB, pointB, pointB, pointC]  // Same point appears 3 times
My script was only doing:
javascriptCopy[pointA, pointB, pointB, pointC]  // Only duplicating once

Color conversion from metadata.color to rating wasn't working because I was looking in the wrong place. The color is in the individual feature properties in the old data, not in metadata.

The colour, the voting both failed. 6 segments showed up on the map. The others didnt. 

Old Raw Data Schema:
{
  gpxData: string,
  geojson: {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [[{$numberDouble: string}, {$numberDouble: string}, {$numberInt: string}], ...]
      },
      properties: {
        color: string,
        dashArray: [{$numberInt: string}, {$numberInt: string}],
        id: string,
        gravelType: string[],
        title: string,
        auth0Id: string
      }
    }]
  },
  metadata: {
    color: string,
    lineStyle: string,
    gravelType: string[],
    title: string
  },
  auth0Id: string,
  createdAt: Date
}

Working Segment Schema (the one you gave before):
{
  gpxData: string,
  geojson: {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [[lon, lat, elevation], ...]
    },
    features: []
  },
  metadata: {
    title: string,
    surfaceTypes: string[],
    length: number | null,
    elevationGain: number | null,
    elevationLoss: number | null,
    elevationProfile: any[]
  },
  votes: [],
  stats: {
    averageRating: null,
    totalVotes: number
  },
  auth0Id: string,
  userName: string,
  createdAt: Date,
  updatedAt: Date
}

Current Migration Output Schema:
{"_id":{"$oid":"675e8743668e977b41b1219b"},"gpxData":"<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"togpx\"><metadata/><trk><name>segment-0</name><desc>color=#c0392b\nid=segment-0</desc><trkseg><trkpt lat=\"-37.547927\" lon=\"145.268919\"/><trkpt lat=\"-37.546433\" lon=\"145.270569\"/><trkpt lat=\"-37.546247\" lon=\"145.270989\"/><trkpt lat=\"-37.546145\" lon=\"145.271096\"/><trkpt lat=\"-37.546034\" lon=\"145.271107\"/><trkpt lat=\"-37.545724\" lon=\"145.270959\"/><trkpt lat=\"-37.545529\" lon=\"145.270972\"/><trkpt lat=\"-37.545093\" lon=\"145.271111\"/><trkpt lat=\"-37.544733\" lon=\"145.271402\"/><trkpt lat=\"-37.544462\" lon=\"145.271673\"/><trkpt lat=\"-37.544285\" lon=\"145.271916\"/><trkpt lat=\"-37.544096\" lon=\"145.272387\"/><trkpt lat=\"-37.544052\" lon=\"145.272822\"/><trkpt lat=\"-37.544347\" lon=\"145.274357\"/></trkseg></trk><trk><name>segment-1</name><desc>color=#c0392b\nid=segment-1</desc><trkseg><trkpt lat=\"-37.544347\" lon=\"145.274357\"/><trkpt lat=\"-37.544548\" lon=\"145.275449\"/><trkpt lat=\"-37.544715\" lon=\"145.275848\"/><trkpt lat=\"-37.545301\" lon=\"145.277\"/><trkpt lat=\"-37.545715\" lon=\"145.27816\"/><trkpt lat=\"-37.546275\" lon=\"145.279138\"/><trkpt lat=\"-37.546335\" lon=\"145.279303\"/><trkpt lat=\"-37.546368\" lon=\"145.279492\"/><trkpt lat=\"-37.546313\" lon=\"145.27988\"/><trkpt lat=\"-37.545893\" lon=\"145.280584\"/></trkseg></trk><trk><name>segment-2</name><desc>color=#c0392b\nid=segment-2</desc><trkseg><trkpt lat=\"-37.545893\" lon=\"145.280584\"/><trkpt lat=\"-37.545628\" lon=\"145.280974\"/><trkpt lat=\"-37.545526\" lon=\"145.281045\"/><trkpt lat=\"-37.545404\" lon=\"145.281074\"/><trkpt lat=\"-37.545322\" lon=\"145.281025\"/><trkpt lat=\"-37.545119\" lon=\"145.280656\"/><trkpt lat=\"-37.544916\" lon=\"145.280613\"/><trkpt lat=\"-37.544296\" lon=\"145.281154\"/><trkpt lat=\"-37.544149\" lon=\"145.28147\"/><trkpt lat=\"-37.544014\" lon=\"145.282199\"/><trkpt lat=\"-37.543931\" lon=\"145.282289\"/><trkpt lat=\"-37.543649\" lon=\"145.282386\"/><trkpt lat=\"-37.54354\" lon=\"145.282504\"/><trkpt lat=\"-37.543468\" lon=\"145.28266\"/><trkpt lat=\"-37.543431\" lon=\"145.282839\"/><trkpt lat=\"-37.543512\" lon=\"145.283365\"/><trkpt lat=\"-37.543469\" lon=\"145.283558\"/><trkpt lat=\"-37.542948\" lon=\"145.284451\"/><trkpt lat=\"-37.542844\" lon=\"145.284681\"/><trkpt lat=\"-37.542756\" lon=\"145.285019\"/></trkseg></trk><trk><name>segment-3</name><desc>color=#c0392b\nid=segment-3</desc><trkseg><trkpt lat=\"-37.542756\" lon=\"145.285019\"/><trkpt lat=\"-37.542534\" lon=\"145.285578\"/><trkpt lat=\"-37.541892\" lon=\"145.286506\"/><trkpt lat=\"-37.541413\" lon=\"145.287274\"/><trkpt lat=\"-37.540503\" lon=\"145.288409\"/><trkpt lat=\"-37.539278\" lon=\"145.289095\"/><trkpt lat=\"-37.53839\" lon=\"145.289319\"/></trkseg></trk><trk><name>segment-4</name><desc>color=#c0392b\nid=segment-4</desc><trkseg><trkpt lat=\"-37.53839\" lon=\"145.289319\"/><trkpt lat=\"-37.537644\" lon=\"145.28949\"/><trkpt lat=\"-37.536355\" lon=\"145.289249\"/><trkpt lat=\"-37.535691\" lon=\"145.289828\"/><trkpt lat=\"-37.535419\" lon=\"145.290472\"/><trkpt lat=\"-37.535236\" lon=\"145.291293\"/><trkpt lat=\"-37.534998\" lon=\"145.29192\"/><trkpt lat=\"-37.534709\" lon=\"145.292392\"/><trkpt lat=\"-37.532289\" lon=\"145.294313\"/></trkseg></trk><trk><name>segment-5</name><desc>color=#c0392b\nid=segment-5</desc><trkseg><trkpt lat=\"-37.532289\" lon=\"145.294313\"/><trkpt lat=\"-37.531289\" lon=\"145.295203\"/><trkpt lat=\"-37.527881\" lon=\"145.298969\"/><trkpt lat=\"-37.527146\" lon=\"145.299497\"/></trkseg></trk><trk><name>segment-7</name><desc>color=#c0392b\nid=segment-7</desc><trkseg><trkpt lat=\"-37.527146\" lon=\"145.299497\"/><trkpt lat=\"-37.526803\" lon=\"145.29976\"/><trkpt lat=\"-37.526027\" lon=\"145.300239\"/><trkpt lat=\"-37.524944\" lon=\"145.300982\"/><trkpt lat=\"-37.523816\" lon=\"145.301879\"/><trkpt lat=\"-37.523586\" lon=\"145.302157\"/><trkpt lat=\"-37.523339\" lon=\"145.302612\"/></trkseg></trk><trk><name>segment-8</name><desc>color=#c0392b\nid=segment-8</desc><trkseg><trkpt lat=\"-37.523339\" lon=\"145.302612\"/><trkpt lat=\"-37.522911\" lon=\"145.303228\"/><trkpt lat=\"-37.522574\" lon=\"145.303539\"/><trkpt lat=\"-37.52227\" lon=\"145.303734\"/><trkpt lat=\"-37.522214\" lon=\"145.303817\"/><trkpt lat=\"-37.522239\" lon=\"145.303911\"/><trkpt lat=\"-37.52231\" lon=\"145.303911\"/><trkpt lat=\"-37.523417\" lon=\"145.30334\"/><trkpt lat=\"-37.523489\" lon=\"145.303368\"/><trkpt lat=\"-37.523483\" lon=\"145.303517\"/><trkpt lat=\"-37.523186\" lon=\"145.303815\"/><trkpt lat=\"-37.521101\" lon=\"145.305395\"/></trkseg></trk><trk><name>segment-9</name><desc>color=#c0392b\nid=segment-9</desc><trkseg><trkpt lat=\"-37.521101\" lon=\"145.305395\"/><trkpt lat=\"-37.520899\" lon=\"145.30554\"/><trkpt lat=\"-37.520517\" lon=\"145.305984\"/><trkpt lat=\"-37.520372\" lon=\"145.306077\"/><trkpt lat=\"-37.520048\" lon=\"145.306098\"/><trkpt lat=\"-37.51967\" lon=\"145.306502\"/><trkpt lat=\"-37.519446\" lon=\"145.306544\"/><trkpt lat=\"-37.519407\" lon=\"145.306638\"/><trkpt lat=\"-37.519463\" lon=\"145.306736\"/><trkpt lat=\"-37.519842\" lon=\"145.306646\"/><trkpt lat=\"-37.520022\" lon=\"145.306729\"/><trkpt lat=\"-37.520162\" lon=\"145.30694\"/><trkpt lat=\"-37.520355\" lon=\"145.307093\"/><trkpt lat=\"-37.520398\" lon=\"145.307218\"/><trkpt lat=\"-37.52036\" lon=\"145.307488\"/><trkpt lat=\"-37.520244\" lon=\"145.307855\"/><trkpt lat=\"-37.520097\" lon=\"145.308063\"/><trkpt lat=\"-37.519763\" lon=\"145.30826\"/><trkpt lat=\"-37.519466\" lon=\"145.308539\"/><trkpt lat=\"-37.518943\" lon=\"145.309268\"/></trkseg></trk><trk><name>segment-10</name><desc>color=#c0392b\nid=segment-10</desc><trkseg><trkpt lat=\"-37.518943\" lon=\"145.309268\"/><trkpt lat=\"-37.517457\" lon=\"145.311346\"/><trkpt lat=\"-37.516738\" lon=\"145.312566\"/><trkpt lat=\"-37.515744\" lon=\"145.313738\"/><trkpt lat=\"-37.515382\" lon=\"145.314096\"/><trkpt lat=\"-37.515067\" lon=\"145.314521\"/><trkpt lat=\"-37.514019\" lon=\"145.316141\"/><trkpt lat=\"-37.513818\" lon=\"145.316516\"/></trkseg></trk></gpx>","geojson":{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[{"$numberDouble":"145.268919"},{"$numberDouble":"-37.547927"},{"$numberInt":"184"}],[{"$numberDouble":"145.270569"},{"$numberDouble":"-37.546433"},{"$numberInt":"189"}],[{"$numberDouble":"145.270989"},{"$numberDouble":"-37.546247"},{"$numberInt":"190"}],[{"$numberDouble":"145.271096"},{"$numberDouble":"-37.546145"},{"$numberInt":"190"}],[{"$numberDouble":"145.271107"},{"$numberDouble":"-37.546034"},{"$numberInt":"190"}],[{"$numberDouble":"145.270959"},{"$numberDouble":"-37.545724"},{"$numberInt":"186"}],[{"$numberDouble":"145.270972"},{"$numberDouble":"-37.545529"},{"$numberInt":"187"}],[{"$numberDouble":"145.271111"},{"$numberDouble":"-37.545093"},{"$numberInt":"188"}],[{"$numberDouble":"145.271402"},{"$numberDouble":"-37.544733"},{"$numberInt":"188"}],[{"$numberDouble":"145.271673"},{"$numberDouble":"-37.544462"},{"$numberInt":"191"}],[{"$numberDouble":"145.271916"},{"$numberDouble":"-37.544285"},{"$numberInt":"193"}],[{"$numberDouble":"145.272387"},{"$numberDouble":"-37.544096"},{"$numberInt":"195"}],[{"$numberDouble":"145.272822"},{"$numberDouble":"-37.544052"},{"$numberInt":"197"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.275449"},{"$numberDouble":"-37.544548"},{"$numberInt":"188"}],[{"$numberDouble":"145.275848"},{"$numberDouble":"-37.544715"},{"$numberInt":"194"}],[{"$numberDouble":"145.277"},{"$numberDouble":"-37.545301"},{"$numberInt":"207"}],[{"$numberDouble":"145.27816"},{"$numberDouble":"-37.545715"},{"$numberInt":"213"}],[{"$numberDouble":"145.279138"},{"$numberDouble":"-37.546275"},{"$numberInt":"222"}],[{"$numberDouble":"145.279303"},{"$numberDouble":"-37.546335"},{"$numberInt":"223"}],[{"$numberDouble":"145.279492"},{"$numberDouble":"-37.546368"},{"$numberInt":"225"}],[{"$numberDouble":"145.27988"},{"$numberDouble":"-37.546313"},{"$numberInt":"228"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280974"},{"$numberDouble":"-37.545628"},{"$numberInt":"239"}],[{"$numberDouble":"145.281045"},{"$numberDouble":"-37.545526"},{"$numberInt":"239"}],[{"$numberDouble":"145.281074"},{"$numberDouble":"-37.545404"},{"$numberInt":"240"}],[{"$numberDouble":"145.281025"},{"$numberDouble":"-37.545322"},{"$numberInt":"240"}],[{"$numberDouble":"145.280656"},{"$numberDouble":"-37.545119"},{"$numberInt":"236"}],[{"$numberDouble":"145.280613"},{"$numberDouble":"-37.544916"},{"$numberInt":"236"}],[{"$numberDouble":"145.281154"},{"$numberDouble":"-37.544296"},{"$numberInt":"242"}],[{"$numberDouble":"145.28147"},{"$numberDouble":"-37.544149"},{"$numberInt":"247"}],[{"$numberDouble":"145.282199"},{"$numberDouble":"-37.544014"},{"$numberInt":"256"}],[{"$numberDouble":"145.282289"},{"$numberDouble":"-37.543931"},{"$numberInt":"256"}],[{"$numberDouble":"145.282386"},{"$numberDouble":"-37.543649"},{"$numberInt":"252"}],[{"$numberDouble":"145.282504"},{"$numberDouble":"-37.54354"},{"$numberInt":"251"}],[{"$numberDouble":"145.28266"},{"$numberDouble":"-37.543468"},{"$numberInt":"252"}],[{"$numberDouble":"145.282839"},{"$numberDouble":"-37.543431"},{"$numberInt":"254"}],[{"$numberDouble":"145.283365"},{"$numberDouble":"-37.543512"},{"$numberInt":"259"}],[{"$numberDouble":"145.283558"},{"$numberDouble":"-37.543469"},{"$numberInt":"259"}],[{"$numberDouble":"145.284451"},{"$numberDouble":"-37.542948"},{"$numberInt":"262"}],[{"$numberDouble":"145.284681"},{"$numberDouble":"-37.542844"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285578"},{"$numberDouble":"-37.542534"},{"$numberInt":"262"}],[{"$numberDouble":"145.286506"},{"$numberDouble":"-37.541892"},{"$numberInt":"260"}],[{"$numberDouble":"145.287274"},{"$numberDouble":"-37.541413"},{"$numberInt":"263"}],[{"$numberDouble":"145.288409"},{"$numberDouble":"-37.540503"},{"$numberInt":"265"}],[{"$numberDouble":"145.289095"},{"$numberDouble":"-37.539278"},{"$numberInt":"270"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.28949"},{"$numberDouble":"-37.537644"},{"$numberInt":"288"}],[{"$numberDouble":"145.289249"},{"$numberDouble":"-37.536355"},{"$numberInt":"299"}],[{"$numberDouble":"145.289828"},{"$numberDouble":"-37.535691"},{"$numberInt":"289"}],[{"$numberDouble":"145.290472"},{"$numberDouble":"-37.535419"},{"$numberInt":"287"}],[{"$numberDouble":"145.291293"},{"$numberDouble":"-37.535236"},{"$numberInt":"288"}],[{"$numberDouble":"145.29192"},{"$numberDouble":"-37.534998"},{"$numberInt":"291"}],[{"$numberDouble":"145.292392"},{"$numberDouble":"-37.534709"},{"$numberInt":"296"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.295203"},{"$numberDouble":"-37.531289"},{"$numberInt":"338"}],[{"$numberDouble":"145.298969"},{"$numberDouble":"-37.527881"},{"$numberInt":"359"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.29976"},{"$numberDouble":"-37.526803"},{"$numberInt":"369"}],[{"$numberDouble":"145.300239"},{"$numberDouble":"-37.526027"},{"$numberInt":"376"}],[{"$numberDouble":"145.300982"},{"$numberDouble":"-37.524944"},{"$numberInt":"390"}],[{"$numberDouble":"145.301879"},{"$numberDouble":"-37.523816"},{"$numberInt":"416"}],[{"$numberDouble":"145.302157"},{"$numberDouble":"-37.523586"},{"$numberInt":"425"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.303228"},{"$numberDouble":"-37.522911"},{"$numberInt":"440"}],[{"$numberDouble":"145.303539"},{"$numberDouble":"-37.522574"},{"$numberInt":"443"}],[{"$numberDouble":"145.303734"},{"$numberDouble":"-37.52227"},{"$numberInt":"450"}],[{"$numberDouble":"145.303817"},{"$numberDouble":"-37.522214"},{"$numberInt":"454"}],[{"$numberDouble":"145.303911"},{"$numberDouble":"-37.522239"},{"$numberInt":"457"}],[{"$numberDouble":"145.303911"},{"$numberDouble":"-37.52231"},{"$numberInt":"456"}],[{"$numberDouble":"145.30334"},{"$numberDouble":"-37.523417"},{"$numberInt":"450"}],[{"$numberDouble":"145.303368"},{"$numberDouble":"-37.523489"},{"$numberInt":"450"}],[{"$numberDouble":"145.303517"},{"$numberDouble":"-37.523483"},{"$numberInt":"451"}],[{"$numberDouble":"145.303815"},{"$numberDouble":"-37.523186"},{"$numberInt":"458"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.30554"},{"$numberDouble":"-37.520899"},{"$numberInt":"504"}],[{"$numberDouble":"145.305984"},{"$numberDouble":"-37.520517"},{"$numberInt":"514"}],[{"$numberDouble":"145.306077"},{"$numberDouble":"-37.520372"},{"$numberInt":"518"}],[{"$numberDouble":"145.306098"},{"$numberDouble":"-37.520048"},{"$numberInt":"521"}],[{"$numberDouble":"145.306502"},{"$numberDouble":"-37.51967"},{"$numberInt":"536"}],[{"$numberDouble":"145.306544"},{"$numberDouble":"-37.519446"},{"$numberInt":"546"}],[{"$numberDouble":"145.306638"},{"$numberDouble":"-37.519407"},{"$numberInt":"549"}],[{"$numberDouble":"145.306736"},{"$numberDouble":"-37.519463"},{"$numberInt":"548"}],[{"$numberDouble":"145.306646"},{"$numberDouble":"-37.519842"},{"$numberInt":"536"}],[{"$numberDouble":"145.306729"},{"$numberDouble":"-37.520022"},{"$numberInt":"534"}],[{"$numberDouble":"145.30694"},{"$numberDouble":"-37.520162"},{"$numberInt":"537"}],[{"$numberDouble":"145.307093"},{"$numberDouble":"-37.520355"},{"$numberInt":"537"}],[{"$numberDouble":"145.307218"},{"$numberDouble":"-37.520398"},{"$numberInt":"539"}],[{"$numberDouble":"145.307488"},{"$numberDouble":"-37.52036"},{"$numberInt":"544"}],[{"$numberDouble":"145.307855"},{"$numberDouble":"-37.520244"},{"$numberInt":"556"}],[{"$numberDouble":"145.308063"},{"$numberDouble":"-37.520097"},{"$numberInt":"563"}],[{"$numberDouble":"145.30826"},{"$numberDouble":"-37.519763"},{"$numberInt":"570"}],[{"$numberDouble":"145.308539"},{"$numberDouble":"-37.519466"},{"$numberInt":"573"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.311346"},{"$numberDouble":"-37.517457"},{"$numberInt":"602"}],[{"$numberDouble":"145.312566"},{"$numberDouble":"-37.516738"},{"$numberInt":"607"}],[{"$numberDouble":"145.313738"},{"$numberDouble":"-37.515744"},{"$numberInt":"614"}],[{"$numberDouble":"145.314096"},{"$numberDouble":"-37.515382"},{"$numberInt":"614"}],[{"$numberDouble":"145.314521"},{"$numberDouble":"-37.515067"},{"$numberInt":"612"}],[{"$numberDouble":"145.316141"},{"$numberDouble":"-37.514019"},{"$numberInt":"623"}],[{"$numberDouble":"145.316516"},{"$numberDouble":"-37.513818"},{"$numberInt":"625"}]]},"features":[]},"metadata":{"title":"Bowden Spur Rd","surfaceTypes":["2"],"length":null,"elevationGain":null,"elevationLoss":null,"elevationProfile":[]},"votes":[{"user_id":"google-oauth2|104387414892803104975","userName":"Unknown User","condition":"4","timestamp":{"$date":{"$numberLong":"1731833796520"}}}],"stats":{"averageRating":{"$numberInt":"4"},"totalVotes":{"$numberInt":"1"}},"auth0Id":"google-oauth2|104387414892803104975","userName":"Unknown User","createdAt":{"$date":{"$numberLong":"1731833796520"}},"updatedAt":{"$date":{"$numberLong":"1731833796520"}}}

A migration one that worked:
{
  "_id": {
    "$oid": "675e874a668e977b41b1226b"
  },
  "gpxData": "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"togpx\"><metadata/><trk><name>segment-28</name><desc>color=#0050c1\nid=segment-28</desc><trkseg><trkpt lat=\"-37.868857\" lon=\"144.720663\"/><trkpt lat=\"-37.869215\" lon=\"144.72002\"/></trkseg></trk><trk><name>segment-29</name><desc>color=#0050c1\nid=segment-29</desc><trkseg><trkpt lat=\"-37.869215\" lon=\"144.72002\"/><trkpt lat=\"-37.869272\" lon=\"144.719984\"/><trkpt lat=\"-37.869302\" lon=\"144.720049\"/><trkpt lat=\"-37.869073\" lon=\"144.720532\"/><trkpt lat=\"-37.869073\" lon=\"144.720755\"/></trkseg></trk><trk><name>segment-30</name><desc>color=#0050c1\nid=segment-30</desc><trkseg><trkpt lat=\"-37.869073\" lon=\"144.720755\"/><trkpt lat=\"-37.869149\" lon=\"144.720949\"/><trkpt lat=\"-37.869257\" lon=\"144.721085\"/><trkpt lat=\"-37.869785\" lon=\"144.721457\"/></trkseg></trk><trk><name>segment-31</name><desc>color=#0050c1\nid=segment-31</desc><trkseg><trkpt lat=\"-37.869785\" lon=\"144.721457\"/><trkpt lat=\"-37.870026\" lon=\"144.721605\"/><trkpt lat=\"-37.870628\" lon=\"144.721752\"/><trkpt lat=\"-37.871443\" lon=\"144.721651\"/><trkpt lat=\"-37.872415\" lon=\"144.721442\"/><trkpt lat=\"-37.872671\" lon=\"144.721434\"/><trkpt lat=\"-37.872771\" lon=\"144.72148\"/><trkpt lat=\"-37.873002\" lon=\"144.721922\"/><trkpt lat=\"-37.873106\" lon=\"144.722024\"/><trkpt lat=\"-37.873214\" lon=\"144.722065\"/><trkpt lat=\"-37.873616\" lon=\"144.72204\"/></trkseg></trk><trk><name>segment-32</name><desc>color=#0050c1\nid=segment-32</desc><trkseg><trkpt lat=\"-37.873616\" lon=\"144.72204\"/><trkpt lat=\"-37.874\" lon=\"144.721787\"/><trkpt lat=\"-37.874275\" lon=\"144.721704\"/><trkpt lat=\"-37.876018\" lon=\"144.721768\"/><trkpt lat=\"-37.876558\" lon=\"144.721912\"/><trkpt lat=\"-37.876705\" lon=\"144.721871\"/><trkpt lat=\"-37.876865\" lon=\"144.721624\"/><trkpt lat=\"-37.876899\" lon=\"144.721432\"/><trkpt lat=\"-37.876905\" lon=\"144.72104\"/><trkpt lat=\"-37.877207\" lon=\"144.719812\"/></trkseg></trk><trk><name>segment-33</name><desc>color=#0050c1\nid=segment-33</desc><trkseg><trkpt lat=\"-37.877207\" lon=\"144.719812\"/><trkpt lat=\"-37.879289\" lon=\"144.711709\"/><trkpt lat=\"-37.881082\" lon=\"144.707087\"/></trkseg></trk><trk><name>segment-34</name><desc>color=#0050c1\nid=segment-34</desc><trkseg><trkpt lat=\"-37.881082\" lon=\"144.707087\"/><trkpt lat=\"-37.88155\" lon=\"144.705921\"/><trkpt lat=\"-37.882024\" lon=\"144.70548\"/><trkpt lat=\"-37.883805\" lon=\"144.701736\"/></trkseg></trk><trk><name>segment-35</name><desc>color=#0050c1\nid=segment-35</desc><trkseg><trkpt lat=\"-37.883805\" lon=\"144.701736\"/><trkpt lat=\"-37.883985\" lon=\"144.701276\"/><trkpt lat=\"-37.884034\" lon=\"144.701253\"/><trkpt lat=\"-37.884149\" lon=\"144.700998\"/><trkpt lat=\"-37.884115\" lon=\"144.700816\"/><trkpt lat=\"-37.88426\" lon=\"144.700481\"/><trkpt lat=\"-37.884222\" lon=\"144.700285\"/><trkpt lat=\"-37.884494\" lon=\"144.700075\"/></trkseg></trk><trk><name>segment-37</name><desc>color=#0050c1\nid=segment-37</desc><trkseg><trkpt lat=\"-37.884494\" lon=\"144.700075\"/><trkpt lat=\"-37.884604\" lon=\"144.699876\"/><trkpt lat=\"-37.884646\" lon=\"144.699894\"/></trkseg></trk><trk><name>segment-38</name><desc>color=#0050c1\nid=segment-38</desc><trkseg><trkpt lat=\"-37.884646\" lon=\"144.699894\"/><trkpt lat=\"-37.885\" lon=\"144.700109\"/><trkpt lat=\"-37.885027\" lon=\"144.700083\"/></trkseg></trk><trk><name>segment-39</name><desc>color=#0050c1\nid=segment-39</desc><trkseg><trkpt lat=\"-37.885027\" lon=\"144.700083\"/><trkpt lat=\"-37.885084\" lon=\"144.700032\"/><trkpt lat=\"-37.885189\" lon=\"144.700154\"/><trkpt lat=\"-37.885384\" lon=\"144.7002\"/></trkseg></trk><trk><name>segment-40</name><desc>color=#0050c1\nid=segment-40</desc><trkseg><trkpt lat=\"-37.885384\" lon=\"144.7002\"/><trkpt lat=\"-37.885666\" lon=\"144.700222\"/><trkpt lat=\"-37.885717\" lon=\"144.700158\"/><trkpt lat=\"-37.885852\" lon=\"144.700194\"/><trkpt lat=\"-37.885931\" lon=\"144.700262\"/><trkpt lat=\"-37.88617\" lon=\"144.700279\"/></trkseg></trk><trk><name>segment-41</name><desc>color=#0050c1\nid=segment-41</desc><trkseg><trkpt lat=\"-37.88617\" lon=\"144.700279\"/><trkpt lat=\"-37.889581\" lon=\"144.700577\"/></trkseg></trk><trk><name>segment-42</name><desc>color=#0050c1\nid=segment-42</desc><trkseg><trkpt lat=\"-37.889581\" lon=\"144.700577\"/><trkpt lat=\"-37.894352\" lon=\"144.701028\"/></trkseg></trk><trk><name>segment-43</name><desc>color=#0050c1\nid=segment-43</desc><trkseg><trkpt lat=\"-37.894352\" lon=\"144.701028\"/><trkpt lat=\"-37.895031\" lon=\"144.701091\"/><trkpt lat=\"-37.895502\" lon=\"144.701061\"/><trkpt lat=\"-37.897476\" lon=\"144.700235\"/><trkpt lat=\"-37.897813\" lon=\"144.70021\"/></trkseg></trk><trk><name>segment-44</name><desc>color=#0050c1\nid=segment-44</desc><trkseg><trkpt lat=\"-37.897813\" lon=\"144.70021\"/><trkpt lat=\"-37.897922\" lon=\"144.701379\"/><trkpt lat=\"-37.897894\" lon=\"144.701804\"/><trkpt lat=\"-37.898063\" lon=\"144.704038\"/><trkpt lat=\"-37.89814\" lon=\"144.704177\"/><trkpt lat=\"-37.898196\" lon=\"144.704206\"/><trkpt lat=\"-37.898539\" lon=\"144.704178\"/></trkseg></trk><trk><name>segment-45</name><desc>color=#0050c1\nid=segment-45</desc><trkseg><trkpt lat=\"-37.898539\" lon=\"144.704178\"/><trkpt lat=\"-37.899683\" lon=\"144.703859\"/><trkpt lat=\"-37.899971\" lon=\"144.703665\"/><trkpt lat=\"-37.907081\" lon=\"144.693385\"/><trkpt lat=\"-37.907521\" lon=\"144.692382\"/><trkpt lat=\"-37.908876\" lon=\"144.688364\"/></trkseg></trk><trk><name>segment-46</name><desc>color=#0050c1\nid=segment-46</desc><trkseg><trkpt lat=\"-37.908876\" lon=\"144.688364\"/><trkpt lat=\"-37.9106\" lon=\"144.683332\"/><trkpt lat=\"-37.910849\" lon=\"144.682437\"/><trkpt lat=\"-37.910871\" lon=\"144.682004\"/><trkpt lat=\"-37.91084\" lon=\"144.681388\"/><trkpt lat=\"-37.910747\" lon=\"144.681047\"/><trkpt lat=\"-37.910442\" lon=\"144.679443\"/></trkseg></trk><trk><name>segment-47</name><desc>color=#0050c1\nid=segment-47</desc><trkseg><trkpt lat=\"-37.910442\" lon=\"144.679443\"/><trkpt lat=\"-37.910335\" lon=\"144.678905\"/><trkpt lat=\"-37.909965\" lon=\"144.678181\"/><trkpt lat=\"-37.909983\" lon=\"144.678056\"/><trkpt lat=\"-37.910275\" lon=\"144.677813\"/></trkseg></trk><trk><name>segment-48</name><desc>color=#0050c1\nid=segment-48</desc><trkseg><trkpt lat=\"-37.910275\" lon=\"144.677813\"/><trkpt lat=\"-37.910702\" lon=\"144.677471\"/><trkpt lat=\"-37.912357\" lon=\"144.676717\"/><trkpt lat=\"-37.912778\" lon=\"144.676573\"/><trkpt lat=\"-37.912886\" lon=\"144.676503\"/><trkpt lat=\"-37.912949\" lon=\"144.676407\"/></trkseg></trk><trk><name>segment-49</name><desc>color=#0050c1\nid=segment-49</desc><trkseg><trkpt lat=\"-37.912949\" lon=\"144.676407\"/><trkpt lat=\"-37.917919\" lon=\"144.661695\"/><trkpt lat=\"-37.918908\" lon=\"144.659025\"/></trkseg></trk><trk><name>segment-50</name><desc>color=#0050c1\nid=segment-50</desc><trkseg><trkpt lat=\"-37.918908\" lon=\"144.659025\"/><trkpt lat=\"-37.918955\" lon=\"144.658854\"/><trkpt lat=\"-37.919121\" lon=\"144.65864\"/></trkseg></trk></gpx>",
  "geojson": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          144.720663,
          -37.868857,
          13
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.72002,
          -37.869215,
          16
        ],
        [
          144.719984,
          -37.869272,
          17
        ],
        [
          144.720049,
          -37.869302,
          17
        ],
        [
          144.720532,
          -37.869073,
          15
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720755,
          -37.869073,
          13
        ],
        [
          144.720949,
          -37.869149,
          12
        ],
        [
          144.721085,
          -37.869257,
          12
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721457,
          -37.869785,
          14
        ],
        [
          144.721605,
          -37.870026,
          15
        ],
        [
          144.721752,
          -37.870628,
          13
        ],
        [
          144.721651,
          -37.871443,
          15
        ],
        [
          144.721442,
          -37.872415,
          12
        ],
        [
          144.721434,
          -37.872671,
          14
        ],
        [
          144.72148,
          -37.872771,
          14
        ],
        [
          144.721922,
          -37.873002,
          12
        ],
        [
          144.722024,
          -37.873106,
          12
        ],
        [
          144.722065,
          -37.873214,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.72204,
          -37.873616,
          11
        ],
        [
          144.721787,
          -37.874,
          13
        ],
        [
          144.721704,
          -37.874275,
          13
        ],
        [
          144.721768,
          -37.876018,
          12
        ],
        [
          144.721912,
          -37.876558,
          10
        ],
        [
          144.721871,
          -37.876705,
          9
        ],
        [
          144.721624,
          -37.876865,
          9
        ],
        [
          144.721432,
          -37.876899,
          9
        ],
        [
          144.72104,
          -37.876905,
          10
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.719812,
          -37.877207,
          12
        ],
        [
          144.711709,
          -37.879289,
          16
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.707087,
          -37.881082,
          20
        ],
        [
          144.705921,
          -37.88155,
          23
        ],
        [
          144.70548,
          -37.882024,
          25
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701736,
          -37.883805,
          26
        ],
        [
          144.701276,
          -37.883985,
          26
        ],
        [
          144.701253,
          -37.884034,
          26
        ],
        [
          144.700998,
          -37.884149,
          27
        ],
        [
          144.700816,
          -37.884115,
          27
        ],
        [
          144.700481,
          -37.88426,
          26
        ],
        [
          144.700285,
          -37.884222,
          26
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.700075,
          -37.884494,
          25
        ],
        [
          144.699876,
          -37.884604,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.699894,
          -37.884646,
          26
        ],
        [
          144.700109,
          -37.885,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700083,
          -37.885027,
          27
        ],
        [
          144.700032,
          -37.885084,
          27
        ],
        [
          144.700154,
          -37.885189,
          27
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.7002,
          -37.885384,
          28
        ],
        [
          144.700222,
          -37.885666,
          28
        ],
        [
          144.700158,
          -37.885717,
          28
        ],
        [
          144.700194,
          -37.885852,
          28
        ],
        [
          144.700262,
          -37.885931,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700279,
          -37.88617,
          28
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.700577,
          -37.889581,
          29
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701028,
          -37.894352,
          20
        ],
        [
          144.701091,
          -37.895031,
          20
        ],
        [
          144.701061,
          -37.895502,
          21
        ],
        [
          144.700235,
          -37.897476,
          20
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.70021,
          -37.897813,
          21
        ],
        [
          144.701379,
          -37.897922,
          20
        ],
        [
          144.701804,
          -37.897894,
          19
        ],
        [
          144.704038,
          -37.898063,
          20
        ],
        [
          144.704177,
          -37.89814,
          20
        ],
        [
          144.704206,
          -37.898196,
          20
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.704178,
          -37.898539,
          21
        ],
        [
          144.703859,
          -37.899683,
          20
        ],
        [
          144.703665,
          -37.899971,
          20
        ],
        [
          144.693385,
          -37.907081,
          19
        ],
        [
          144.692382,
          -37.907521,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.688364,
          -37.908876,
          20
        ],
        [
          144.683332,
          -37.9106,
          19
        ],
        [
          144.682437,
          -37.910849,
          21
        ],
        [
          144.682004,
          -37.910871,
          22
        ],
        [
          144.681388,
          -37.91084,
          23
        ],
        [
          144.681047,
          -37.910747,
          23
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.679443,
          -37.910442,
          24
        ],
        [
          144.678905,
          -37.910335,
          24
        ],
        [
          144.678181,
          -37.909965,
          22
        ],
        [
          144.678056,
          -37.909983,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677813,
          -37.910275,
          22
        ],
        [
          144.677471,
          -37.910702,
          20
        ],
        [
          144.676717,
          -37.912357,
          24
        ],
        [
          144.676573,
          -37.912778,
          23
        ],
        [
          144.676503,
          -37.912886,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.676407,
          -37.912949,
          22
        ],
        [
          144.661695,
          -37.917919,
          22
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.659025,
          -37.918908,
          21
        ],
        [
          144.658854,
          -37.918955,
          21
        ],
        [
          144.65864,
          -37.919121,
          20
        ]
      ]
    },
    "features": []
  },
  "metadata": {
    "title": "Federation Trail",
    "surfaceTypes": [
      "2"
    ],
    "length": null,
    "elevationGain": null,
    "elevationLoss": null,
    "elevationProfile": []
  },
  "votes": [
    {
      "user_id": "google-oauth2|104387414892803104975",
      "userName": "Unknown User",
      "condition": "4",
      "timestamp": {
        "$date": "2024-11-21T03:26:45.911Z"
      }
    }
  ],
  "stats": {
    "averageRating": 4,
    "totalVotes": 1
  },
  "auth0Id": "google-oauth2|104387414892803104975",
  "userName": "Unknown User",
  "createdAt": {
    "$date": "2024-11-21T03:26:45.911Z"
  },
  "updatedAt": {
    "$date": "2024-11-21T03:26:45.911Z"
  }
}

A migration that didnt work:
{"_id":{"$oid":"675e8743668e977b41b1219b"},"gpxData":"<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"togpx\"><metadata/><trk><name>segment-0</name><desc>color=#c0392b\nid=segment-0</desc><trkseg><trkpt lat=\"-37.547927\" lon=\"145.268919\"/><trkpt lat=\"-37.546433\" lon=\"145.270569\"/><trkpt lat=\"-37.546247\" lon=\"145.270989\"/><trkpt lat=\"-37.546145\" lon=\"145.271096\"/><trkpt lat=\"-37.546034\" lon=\"145.271107\"/><trkpt lat=\"-37.545724\" lon=\"145.270959\"/><trkpt lat=\"-37.545529\" lon=\"145.270972\"/><trkpt lat=\"-37.545093\" lon=\"145.271111\"/><trkpt lat=\"-37.544733\" lon=\"145.271402\"/><trkpt lat=\"-37.544462\" lon=\"145.271673\"/><trkpt lat=\"-37.544285\" lon=\"145.271916\"/><trkpt lat=\"-37.544096\" lon=\"145.272387\"/><trkpt lat=\"-37.544052\" lon=\"145.272822\"/><trkpt lat=\"-37.544347\" lon=\"145.274357\"/></trkseg></trk><trk><name>segment-1</name><desc>color=#c0392b\nid=segment-1</desc><trkseg><trkpt lat=\"-37.544347\" lon=\"145.274357\"/><trkpt lat=\"-37.544548\" lon=\"145.275449\"/><trkpt lat=\"-37.544715\" lon=\"145.275848\"/><trkpt lat=\"-37.545301\" lon=\"145.277\"/><trkpt lat=\"-37.545715\" lon=\"145.27816\"/><trkpt lat=\"-37.546275\" lon=\"145.279138\"/><trkpt lat=\"-37.546335\" lon=\"145.279303\"/><trkpt lat=\"-37.546368\" lon=\"145.279492\"/><trkpt lat=\"-37.546313\" lon=\"145.27988\"/><trkpt lat=\"-37.545893\" lon=\"145.280584\"/></trkseg></trk><trk><name>segment-2</name><desc>color=#c0392b\nid=segment-2</desc><trkseg><trkpt lat=\"-37.545893\" lon=\"145.280584\"/><trkpt lat=\"-37.545628\" lon=\"145.280974\"/><trkpt lat=\"-37.545526\" lon=\"145.281045\"/><trkpt lat=\"-37.545404\" lon=\"145.281074\"/><trkpt lat=\"-37.545322\" lon=\"145.281025\"/><trkpt lat=\"-37.545119\" lon=\"145.280656\"/><trkpt lat=\"-37.544916\" lon=\"145.280613\"/><trkpt lat=\"-37.544296\" lon=\"145.281154\"/><trkpt lat=\"-37.544149\" lon=\"145.28147\"/><trkpt lat=\"-37.544014\" lon=\"145.282199\"/><trkpt lat=\"-37.543931\" lon=\"145.282289\"/><trkpt lat=\"-37.543649\" lon=\"145.282386\"/><trkpt lat=\"-37.54354\" lon=\"145.282504\"/><trkpt lat=\"-37.543468\" lon=\"145.28266\"/><trkpt lat=\"-37.543431\" lon=\"145.282839\"/><trkpt lat=\"-37.543512\" lon=\"145.283365\"/><trkpt lat=\"-37.543469\" lon=\"145.283558\"/><trkpt lat=\"-37.542948\" lon=\"145.284451\"/><trkpt lat=\"-37.542844\" lon=\"145.284681\"/><trkpt lat=\"-37.542756\" lon=\"145.285019\"/></trkseg></trk><trk><name>segment-3</name><desc>color=#c0392b\nid=segment-3</desc><trkseg><trkpt lat=\"-37.542756\" lon=\"145.285019\"/><trkpt lat=\"-37.542534\" lon=\"145.285578\"/><trkpt lat=\"-37.541892\" lon=\"145.286506\"/><trkpt lat=\"-37.541413\" lon=\"145.287274\"/><trkpt lat=\"-37.540503\" lon=\"145.288409\"/><trkpt lat=\"-37.539278\" lon=\"145.289095\"/><trkpt lat=\"-37.53839\" lon=\"145.289319\"/></trkseg></trk><trk><name>segment-4</name><desc>color=#c0392b\nid=segment-4</desc><trkseg><trkpt lat=\"-37.53839\" lon=\"145.289319\"/><trkpt lat=\"-37.537644\" lon=\"145.28949\"/><trkpt lat=\"-37.536355\" lon=\"145.289249\"/><trkpt lat=\"-37.535691\" lon=\"145.289828\"/><trkpt lat=\"-37.535419\" lon=\"145.290472\"/><trkpt lat=\"-37.535236\" lon=\"145.291293\"/><trkpt lat=\"-37.534998\" lon=\"145.29192\"/><trkpt lat=\"-37.534709\" lon=\"145.292392\"/><trkpt lat=\"-37.532289\" lon=\"145.294313\"/></trkseg></trk><trk><name>segment-5</name><desc>color=#c0392b\nid=segment-5</desc><trkseg><trkpt lat=\"-37.532289\" lon=\"145.294313\"/><trkpt lat=\"-37.531289\" lon=\"145.295203\"/><trkpt lat=\"-37.527881\" lon=\"145.298969\"/><trkpt lat=\"-37.527146\" lon=\"145.299497\"/></trkseg></trk><trk><name>segment-7</name><desc>color=#c0392b\nid=segment-7</desc><trkseg><trkpt lat=\"-37.527146\" lon=\"145.299497\"/><trkpt lat=\"-37.526803\" lon=\"145.29976\"/><trkpt lat=\"-37.526027\" lon=\"145.300239\"/><trkpt lat=\"-37.524944\" lon=\"145.300982\"/><trkpt lat=\"-37.523816\" lon=\"145.301879\"/><trkpt lat=\"-37.523586\" lon=\"145.302157\"/><trkpt lat=\"-37.523339\" lon=\"145.302612\"/></trkseg></trk><trk><name>segment-8</name><desc>color=#c0392b\nid=segment-8</desc><trkseg><trkpt lat=\"-37.523339\" lon=\"145.302612\"/><trkpt lat=\"-37.522911\" lon=\"145.303228\"/><trkpt lat=\"-37.522574\" lon=\"145.303539\"/><trkpt lat=\"-37.52227\" lon=\"145.303734\"/><trkpt lat=\"-37.522214\" lon=\"145.303817\"/><trkpt lat=\"-37.522239\" lon=\"145.303911\"/><trkpt lat=\"-37.52231\" lon=\"145.303911\"/><trkpt lat=\"-37.523417\" lon=\"145.30334\"/><trkpt lat=\"-37.523489\" lon=\"145.303368\"/><trkpt lat=\"-37.523483\" lon=\"145.303517\"/><trkpt lat=\"-37.523186\" lon=\"145.303815\"/><trkpt lat=\"-37.521101\" lon=\"145.305395\"/></trkseg></trk><trk><name>segment-9</name><desc>color=#c0392b\nid=segment-9</desc><trkseg><trkpt lat=\"-37.521101\" lon=\"145.305395\"/><trkpt lat=\"-37.520899\" lon=\"145.30554\"/><trkpt lat=\"-37.520517\" lon=\"145.305984\"/><trkpt lat=\"-37.520372\" lon=\"145.306077\"/><trkpt lat=\"-37.520048\" lon=\"145.306098\"/><trkpt lat=\"-37.51967\" lon=\"145.306502\"/><trkpt lat=\"-37.519446\" lon=\"145.306544\"/><trkpt lat=\"-37.519407\" lon=\"145.306638\"/><trkpt lat=\"-37.519463\" lon=\"145.306736\"/><trkpt lat=\"-37.519842\" lon=\"145.306646\"/><trkpt lat=\"-37.520022\" lon=\"145.306729\"/><trkpt lat=\"-37.520162\" lon=\"145.30694\"/><trkpt lat=\"-37.520355\" lon=\"145.307093\"/><trkpt lat=\"-37.520398\" lon=\"145.307218\"/><trkpt lat=\"-37.52036\" lon=\"145.307488\"/><trkpt lat=\"-37.520244\" lon=\"145.307855\"/><trkpt lat=\"-37.520097\" lon=\"145.308063\"/><trkpt lat=\"-37.519763\" lon=\"145.30826\"/><trkpt lat=\"-37.519466\" lon=\"145.308539\"/><trkpt lat=\"-37.518943\" lon=\"145.309268\"/></trkseg></trk><trk><name>segment-10</name><desc>color=#c0392b\nid=segment-10</desc><trkseg><trkpt lat=\"-37.518943\" lon=\"145.309268\"/><trkpt lat=\"-37.517457\" lon=\"145.311346\"/><trkpt lat=\"-37.516738\" lon=\"145.312566\"/><trkpt lat=\"-37.515744\" lon=\"145.313738\"/><trkpt lat=\"-37.515382\" lon=\"145.314096\"/><trkpt lat=\"-37.515067\" lon=\"145.314521\"/><trkpt lat=\"-37.514019\" lon=\"145.316141\"/><trkpt lat=\"-37.513818\" lon=\"145.316516\"/></trkseg></trk></gpx>","geojson":{"type":"Feature","properties":{},"geometry":{"type":"LineString","coordinates":[[{"$numberDouble":"145.268919"},{"$numberDouble":"-37.547927"},{"$numberInt":"184"}],[{"$numberDouble":"145.270569"},{"$numberDouble":"-37.546433"},{"$numberInt":"189"}],[{"$numberDouble":"145.270989"},{"$numberDouble":"-37.546247"},{"$numberInt":"190"}],[{"$numberDouble":"145.271096"},{"$numberDouble":"-37.546145"},{"$numberInt":"190"}],[{"$numberDouble":"145.271107"},{"$numberDouble":"-37.546034"},{"$numberInt":"190"}],[{"$numberDouble":"145.270959"},{"$numberDouble":"-37.545724"},{"$numberInt":"186"}],[{"$numberDouble":"145.270972"},{"$numberDouble":"-37.545529"},{"$numberInt":"187"}],[{"$numberDouble":"145.271111"},{"$numberDouble":"-37.545093"},{"$numberInt":"188"}],[{"$numberDouble":"145.271402"},{"$numberDouble":"-37.544733"},{"$numberInt":"188"}],[{"$numberDouble":"145.271673"},{"$numberDouble":"-37.544462"},{"$numberInt":"191"}],[{"$numberDouble":"145.271916"},{"$numberDouble":"-37.544285"},{"$numberInt":"193"}],[{"$numberDouble":"145.272387"},{"$numberDouble":"-37.544096"},{"$numberInt":"195"}],[{"$numberDouble":"145.272822"},{"$numberDouble":"-37.544052"},{"$numberInt":"197"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.274357"},{"$numberDouble":"-37.544347"},{"$numberInt":"191"}],[{"$numberDouble":"145.275449"},{"$numberDouble":"-37.544548"},{"$numberInt":"188"}],[{"$numberDouble":"145.275848"},{"$numberDouble":"-37.544715"},{"$numberInt":"194"}],[{"$numberDouble":"145.277"},{"$numberDouble":"-37.545301"},{"$numberInt":"207"}],[{"$numberDouble":"145.27816"},{"$numberDouble":"-37.545715"},{"$numberInt":"213"}],[{"$numberDouble":"145.279138"},{"$numberDouble":"-37.546275"},{"$numberInt":"222"}],[{"$numberDouble":"145.279303"},{"$numberDouble":"-37.546335"},{"$numberInt":"223"}],[{"$numberDouble":"145.279492"},{"$numberDouble":"-37.546368"},{"$numberInt":"225"}],[{"$numberDouble":"145.27988"},{"$numberDouble":"-37.546313"},{"$numberInt":"228"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280584"},{"$numberDouble":"-37.545893"},{"$numberInt":"233"}],[{"$numberDouble":"145.280974"},{"$numberDouble":"-37.545628"},{"$numberInt":"239"}],[{"$numberDouble":"145.281045"},{"$numberDouble":"-37.545526"},{"$numberInt":"239"}],[{"$numberDouble":"145.281074"},{"$numberDouble":"-37.545404"},{"$numberInt":"240"}],[{"$numberDouble":"145.281025"},{"$numberDouble":"-37.545322"},{"$numberInt":"240"}],[{"$numberDouble":"145.280656"},{"$numberDouble":"-37.545119"},{"$numberInt":"236"}],[{"$numberDouble":"145.280613"},{"$numberDouble":"-37.544916"},{"$numberInt":"236"}],[{"$numberDouble":"145.281154"},{"$numberDouble":"-37.544296"},{"$numberInt":"242"}],[{"$numberDouble":"145.28147"},{"$numberDouble":"-37.544149"},{"$numberInt":"247"}],[{"$numberDouble":"145.282199"},{"$numberDouble":"-37.544014"},{"$numberInt":"256"}],[{"$numberDouble":"145.282289"},{"$numberDouble":"-37.543931"},{"$numberInt":"256"}],[{"$numberDouble":"145.282386"},{"$numberDouble":"-37.543649"},{"$numberInt":"252"}],[{"$numberDouble":"145.282504"},{"$numberDouble":"-37.54354"},{"$numberInt":"251"}],[{"$numberDouble":"145.28266"},{"$numberDouble":"-37.543468"},{"$numberInt":"252"}],[{"$numberDouble":"145.282839"},{"$numberDouble":"-37.543431"},{"$numberInt":"254"}],[{"$numberDouble":"145.283365"},{"$numberDouble":"-37.543512"},{"$numberInt":"259"}],[{"$numberDouble":"145.283558"},{"$numberDouble":"-37.543469"},{"$numberInt":"259"}],[{"$numberDouble":"145.284451"},{"$numberDouble":"-37.542948"},{"$numberInt":"262"}],[{"$numberDouble":"145.284681"},{"$numberDouble":"-37.542844"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285019"},{"$numberDouble":"-37.542756"},{"$numberInt":"262"}],[{"$numberDouble":"145.285578"},{"$numberDouble":"-37.542534"},{"$numberInt":"262"}],[{"$numberDouble":"145.286506"},{"$numberDouble":"-37.541892"},{"$numberInt":"260"}],[{"$numberDouble":"145.287274"},{"$numberDouble":"-37.541413"},{"$numberInt":"263"}],[{"$numberDouble":"145.288409"},{"$numberDouble":"-37.540503"},{"$numberInt":"265"}],[{"$numberDouble":"145.289095"},{"$numberDouble":"-37.539278"},{"$numberInt":"270"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.289319"},{"$numberDouble":"-37.53839"},{"$numberInt":"281"}],[{"$numberDouble":"145.28949"},{"$numberDouble":"-37.537644"},{"$numberInt":"288"}],[{"$numberDouble":"145.289249"},{"$numberDouble":"-37.536355"},{"$numberInt":"299"}],[{"$numberDouble":"145.289828"},{"$numberDouble":"-37.535691"},{"$numberInt":"289"}],[{"$numberDouble":"145.290472"},{"$numberDouble":"-37.535419"},{"$numberInt":"287"}],[{"$numberDouble":"145.291293"},{"$numberDouble":"-37.535236"},{"$numberInt":"288"}],[{"$numberDouble":"145.29192"},{"$numberDouble":"-37.534998"},{"$numberInt":"291"}],[{"$numberDouble":"145.292392"},{"$numberDouble":"-37.534709"},{"$numberInt":"296"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.294313"},{"$numberDouble":"-37.532289"},{"$numberInt":"320"}],[{"$numberDouble":"145.295203"},{"$numberDouble":"-37.531289"},{"$numberInt":"338"}],[{"$numberDouble":"145.298969"},{"$numberDouble":"-37.527881"},{"$numberInt":"359"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.299497"},{"$numberDouble":"-37.527146"},{"$numberInt":"365"}],[{"$numberDouble":"145.29976"},{"$numberDouble":"-37.526803"},{"$numberInt":"369"}],[{"$numberDouble":"145.300239"},{"$numberDouble":"-37.526027"},{"$numberInt":"376"}],[{"$numberDouble":"145.300982"},{"$numberDouble":"-37.524944"},{"$numberInt":"390"}],[{"$numberDouble":"145.301879"},{"$numberDouble":"-37.523816"},{"$numberInt":"416"}],[{"$numberDouble":"145.302157"},{"$numberDouble":"-37.523586"},{"$numberInt":"425"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.302612"},{"$numberDouble":"-37.523339"},{"$numberInt":"433"}],[{"$numberDouble":"145.303228"},{"$numberDouble":"-37.522911"},{"$numberInt":"440"}],[{"$numberDouble":"145.303539"},{"$numberDouble":"-37.522574"},{"$numberInt":"443"}],[{"$numberDouble":"145.303734"},{"$numberDouble":"-37.52227"},{"$numberInt":"450"}],[{"$numberDouble":"145.303817"},{"$numberDouble":"-37.522214"},{"$numberInt":"454"}],[{"$numberDouble":"145.303911"},{"$numberDouble":"-37.522239"},{"$numberInt":"457"}],[{"$numberDouble":"145.303911"},{"$numberDouble":"-37.52231"},{"$numberInt":"456"}],[{"$numberDouble":"145.30334"},{"$numberDouble":"-37.523417"},{"$numberInt":"450"}],[{"$numberDouble":"145.303368"},{"$numberDouble":"-37.523489"},{"$numberInt":"450"}],[{"$numberDouble":"145.303517"},{"$numberDouble":"-37.523483"},{"$numberInt":"451"}],[{"$numberDouble":"145.303815"},{"$numberDouble":"-37.523186"},{"$numberInt":"458"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.305395"},{"$numberDouble":"-37.521101"},{"$numberInt":"501"}],[{"$numberDouble":"145.30554"},{"$numberDouble":"-37.520899"},{"$numberInt":"504"}],[{"$numberDouble":"145.305984"},{"$numberDouble":"-37.520517"},{"$numberInt":"514"}],[{"$numberDouble":"145.306077"},{"$numberDouble":"-37.520372"},{"$numberInt":"518"}],[{"$numberDouble":"145.306098"},{"$numberDouble":"-37.520048"},{"$numberInt":"521"}],[{"$numberDouble":"145.306502"},{"$numberDouble":"-37.51967"},{"$numberInt":"536"}],[{"$numberDouble":"145.306544"},{"$numberDouble":"-37.519446"},{"$numberInt":"546"}],[{"$numberDouble":"145.306638"},{"$numberDouble":"-37.519407"},{"$numberInt":"549"}],[{"$numberDouble":"145.306736"},{"$numberDouble":"-37.519463"},{"$numberInt":"548"}],[{"$numberDouble":"145.306646"},{"$numberDouble":"-37.519842"},{"$numberInt":"536"}],[{"$numberDouble":"145.306729"},{"$numberDouble":"-37.520022"},{"$numberInt":"534"}],[{"$numberDouble":"145.30694"},{"$numberDouble":"-37.520162"},{"$numberInt":"537"}],[{"$numberDouble":"145.307093"},{"$numberDouble":"-37.520355"},{"$numberInt":"537"}],[{"$numberDouble":"145.307218"},{"$numberDouble":"-37.520398"},{"$numberInt":"539"}],[{"$numberDouble":"145.307488"},{"$numberDouble":"-37.52036"},{"$numberInt":"544"}],[{"$numberDouble":"145.307855"},{"$numberDouble":"-37.520244"},{"$numberInt":"556"}],[{"$numberDouble":"145.308063"},{"$numberDouble":"-37.520097"},{"$numberInt":"563"}],[{"$numberDouble":"145.30826"},{"$numberDouble":"-37.519763"},{"$numberInt":"570"}],[{"$numberDouble":"145.308539"},{"$numberDouble":"-37.519466"},{"$numberInt":"573"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.309268"},{"$numberDouble":"-37.518943"},{"$numberInt":"578"}],[{"$numberDouble":"145.311346"},{"$numberDouble":"-37.517457"},{"$numberInt":"602"}],[{"$numberDouble":"145.312566"},{"$numberDouble":"-37.516738"},{"$numberInt":"607"}],[{"$numberDouble":"145.313738"},{"$numberDouble":"-37.515744"},{"$numberInt":"614"}],[{"$numberDouble":"145.314096"},{"$numberDouble":"-37.515382"},{"$numberInt":"614"}],[{"$numberDouble":"145.314521"},{"$numberDouble":"-37.515067"},{"$numberInt":"612"}],[{"$numberDouble":"145.316141"},{"$numberDouble":"-37.514019"},{"$numberInt":"623"}],[{"$numberDouble":"145.316516"},{"$numberDouble":"-37.513818"},{"$numberInt":"625"}]]},"features":[]},"metadata":{"title":"Bowden Spur Rd","surfaceTypes":["2"],"length":null,"elevationGain":null,"elevationLoss":null,"elevationProfile":[]},"votes":[{"user_id":"google-oauth2|104387414892803104975","userName":"Unknown User","condition":"4","timestamp":{"$date":{"$numberLong":"1731833796520"}}}],"stats":{"averageRating":{"$numberInt":"4"},"totalVotes":{"$numberInt":"1"}},"auth0Id":"google-oauth2|104387414892803104975","userName":"Unknown User","createdAt":{"$date":{"$numberLong":"1731833796520"}},"updatedAt":{"$date":{"$numberLong":"1731833796520"}}}