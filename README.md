# Gravel Atlas Essential Documentation

SOME RULES
1. Dont try to edit my files yourself
2. Be specific when adding code suggestions.. always show precisely where and how to add code into existing files.. Before and after is a good technique.

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

Would you like me to add or modify any section of this summary?