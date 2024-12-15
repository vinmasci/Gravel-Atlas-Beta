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

Also, I want the script to work out the distance, the elevation gain and the elevation loss for me please so we can add in those fields
Raw data of what worked and showed up on map:
{
  "_id": {
    "$oid": "675e6504cd7197761e062e63"
  },
  "gpxData": "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"togpx\"><metadata/><trk><name>segment-55</name><desc>color=#01bf11\nid=segment-55</desc><trkseg><trkpt lat=\"-37.832011\" lon=\"144.88954\"/><trkpt lat=\"-37.837049\" lon=\"144.88868\"/></trkseg></trk><trk><name>segment-57</name><desc>color=#01bf11\nid=segment-57</desc><trkseg><trkpt lat=\"-37.837049\" lon=\"144.88868\"/><trkpt lat=\"-37.837261\" lon=\"144.888644\"/></trkseg></trk></gpx>",
  "geojson": {
    "type": "Feature",
    "properties": {
      "color": "#01bf11",
      "id": "segment-55",
      "gravelType": [
        "0"
      ],
      "title": "Drake St",
      "auth0Id": "google-oauth2|104387414892803104975"
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          144.88954,
          -37.832011,
          16
        ],
        [
          144.88868,
          -37.837049,
          13
        ],
        [
          144.88868,
          -37.837049,
          13
        ],
        [
          144.888644,
          -37.837261,
          12
        ]
      ]
    }
  },
  "metadata": {
    "title": "Drake St",
    "surfaceTypes": [],
    "length": null,
    "elevationGain": null,
    "elevationLoss": null,
    "elevationProfile": []
  },
  "votes": [
    {
      "user_id": "google-oauth2|104387414892803104975",
      "userName": "Unknown User",
      "condition": "1",
      "timestamp": {
        "$date": "2024-11-21T03:27:58.746Z"
      }
    }
  ],
  "stats": {
    "averageRating": 1,
    "totalVotes": 1
  },
  "auth0Id": "google-oauth2|104387414892803104975",
  "userName": "Unknown User",
  "createdAt": {
    "$date": "2024-11-21T03:27:58.746Z"
  },
  "updatedAt": {
    "$date": "2024-12-15T05:11:32.815Z"
  }
}

One that didnt:
{
  "_id": {
    "$oid": "675e64fecd7197761e062d9f"
  },
  "gpxData": "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:schemaLocation=\"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd\" version=\"1.1\" creator=\"togpx\"><metadata/><trk><name>segment-0</name><desc>color=#c0392b\nid=segment-0</desc><trkseg><trkpt lat=\"-37.547927\" lon=\"145.268919\"/><trkpt lat=\"-37.546433\" lon=\"145.270569\"/><trkpt lat=\"-37.546247\" lon=\"145.270989\"/><trkpt lat=\"-37.546145\" lon=\"145.271096\"/><trkpt lat=\"-37.546034\" lon=\"145.271107\"/><trkpt lat=\"-37.545724\" lon=\"145.270959\"/><trkpt lat=\"-37.545529\" lon=\"145.270972\"/><trkpt lat=\"-37.545093\" lon=\"145.271111\"/><trkpt lat=\"-37.544733\" lon=\"145.271402\"/><trkpt lat=\"-37.544462\" lon=\"145.271673\"/><trkpt lat=\"-37.544285\" lon=\"145.271916\"/><trkpt lat=\"-37.544096\" lon=\"145.272387\"/><trkpt lat=\"-37.544052\" lon=\"145.272822\"/><trkpt lat=\"-37.544347\" lon=\"145.274357\"/></trkseg></trk><trk><name>segment-1</name><desc>color=#c0392b\nid=segment-1</desc><trkseg><trkpt lat=\"-37.544347\" lon=\"145.274357\"/><trkpt lat=\"-37.544548\" lon=\"145.275449\"/><trkpt lat=\"-37.544715\" lon=\"145.275848\"/><trkpt lat=\"-37.545301\" lon=\"145.277\"/><trkpt lat=\"-37.545715\" lon=\"145.27816\"/><trkpt lat=\"-37.546275\" lon=\"145.279138\"/><trkpt lat=\"-37.546335\" lon=\"145.279303\"/><trkpt lat=\"-37.546368\" lon=\"145.279492\"/><trkpt lat=\"-37.546313\" lon=\"145.27988\"/><trkpt lat=\"-37.545893\" lon=\"145.280584\"/></trkseg></trk><trk><name>segment-2</name><desc>color=#c0392b\nid=segment-2</desc><trkseg><trkpt lat=\"-37.545893\" lon=\"145.280584\"/><trkpt lat=\"-37.545628\" lon=\"145.280974\"/><trkpt lat=\"-37.545526\" lon=\"145.281045\"/><trkpt lat=\"-37.545404\" lon=\"145.281074\"/><trkpt lat=\"-37.545322\" lon=\"145.281025\"/><trkpt lat=\"-37.545119\" lon=\"145.280656\"/><trkpt lat=\"-37.544916\" lon=\"145.280613\"/><trkpt lat=\"-37.544296\" lon=\"145.281154\"/><trkpt lat=\"-37.544149\" lon=\"145.28147\"/><trkpt lat=\"-37.544014\" lon=\"145.282199\"/><trkpt lat=\"-37.543931\" lon=\"145.282289\"/><trkpt lat=\"-37.543649\" lon=\"145.282386\"/><trkpt lat=\"-37.54354\" lon=\"145.282504\"/><trkpt lat=\"-37.543468\" lon=\"145.28266\"/><trkpt lat=\"-37.543431\" lon=\"145.282839\"/><trkpt lat=\"-37.543512\" lon=\"145.283365\"/><trkpt lat=\"-37.543469\" lon=\"145.283558\"/><trkpt lat=\"-37.542948\" lon=\"145.284451\"/><trkpt lat=\"-37.542844\" lon=\"145.284681\"/><trkpt lat=\"-37.542756\" lon=\"145.285019\"/></trkseg></trk><trk><name>segment-3</name><desc>color=#c0392b\nid=segment-3</desc><trkseg><trkpt lat=\"-37.542756\" lon=\"145.285019\"/><trkpt lat=\"-37.542534\" lon=\"145.285578\"/><trkpt lat=\"-37.541892\" lon=\"145.286506\"/><trkpt lat=\"-37.541413\" lon=\"145.287274\"/><trkpt lat=\"-37.540503\" lon=\"145.288409\"/><trkpt lat=\"-37.539278\" lon=\"145.289095\"/><trkpt lat=\"-37.53839\" lon=\"145.289319\"/></trkseg></trk><trk><name>segment-4</name><desc>color=#c0392b\nid=segment-4</desc><trkseg><trkpt lat=\"-37.53839\" lon=\"145.289319\"/><trkpt lat=\"-37.537644\" lon=\"145.28949\"/><trkpt lat=\"-37.536355\" lon=\"145.289249\"/><trkpt lat=\"-37.535691\" lon=\"145.289828\"/><trkpt lat=\"-37.535419\" lon=\"145.290472\"/><trkpt lat=\"-37.535236\" lon=\"145.291293\"/><trkpt lat=\"-37.534998\" lon=\"145.29192\"/><trkpt lat=\"-37.534709\" lon=\"145.292392\"/><trkpt lat=\"-37.532289\" lon=\"145.294313\"/></trkseg></trk><trk><name>segment-5</name><desc>color=#c0392b\nid=segment-5</desc><trkseg><trkpt lat=\"-37.532289\" lon=\"145.294313\"/><trkpt lat=\"-37.531289\" lon=\"145.295203\"/><trkpt lat=\"-37.527881\" lon=\"145.298969\"/><trkpt lat=\"-37.527146\" lon=\"145.299497\"/></trkseg></trk><trk><name>segment-7</name><desc>color=#c0392b\nid=segment-7</desc><trkseg><trkpt lat=\"-37.527146\" lon=\"145.299497\"/><trkpt lat=\"-37.526803\" lon=\"145.29976\"/><trkpt lat=\"-37.526027\" lon=\"145.300239\"/><trkpt lat=\"-37.524944\" lon=\"145.300982\"/><trkpt lat=\"-37.523816\" lon=\"145.301879\"/><trkpt lat=\"-37.523586\" lon=\"145.302157\"/><trkpt lat=\"-37.523339\" lon=\"145.302612\"/></trkseg></trk><trk><name>segment-8</name><desc>color=#c0392b\nid=segment-8</desc><trkseg><trkpt lat=\"-37.523339\" lon=\"145.302612\"/><trkpt lat=\"-37.522911\" lon=\"145.303228\"/><trkpt lat=\"-37.522574\" lon=\"145.303539\"/><trkpt lat=\"-37.52227\" lon=\"145.303734\"/><trkpt lat=\"-37.522214\" lon=\"145.303817\"/><trkpt lat=\"-37.522239\" lon=\"145.303911\"/><trkpt lat=\"-37.52231\" lon=\"145.303911\"/><trkpt lat=\"-37.523417\" lon=\"145.30334\"/><trkpt lat=\"-37.523489\" lon=\"145.303368\"/><trkpt lat=\"-37.523483\" lon=\"145.303517\"/><trkpt lat=\"-37.523186\" lon=\"145.303815\"/><trkpt lat=\"-37.521101\" lon=\"145.305395\"/></trkseg></trk><trk><name>segment-9</name><desc>color=#c0392b\nid=segment-9</desc><trkseg><trkpt lat=\"-37.521101\" lon=\"145.305395\"/><trkpt lat=\"-37.520899\" lon=\"145.30554\"/><trkpt lat=\"-37.520517\" lon=\"145.305984\"/><trkpt lat=\"-37.520372\" lon=\"145.306077\"/><trkpt lat=\"-37.520048\" lon=\"145.306098\"/><trkpt lat=\"-37.51967\" lon=\"145.306502\"/><trkpt lat=\"-37.519446\" lon=\"145.306544\"/><trkpt lat=\"-37.519407\" lon=\"145.306638\"/><trkpt lat=\"-37.519463\" lon=\"145.306736\"/><trkpt lat=\"-37.519842\" lon=\"145.306646\"/><trkpt lat=\"-37.520022\" lon=\"145.306729\"/><trkpt lat=\"-37.520162\" lon=\"145.30694\"/><trkpt lat=\"-37.520355\" lon=\"145.307093\"/><trkpt lat=\"-37.520398\" lon=\"145.307218\"/><trkpt lat=\"-37.52036\" lon=\"145.307488\"/><trkpt lat=\"-37.520244\" lon=\"145.307855\"/><trkpt lat=\"-37.520097\" lon=\"145.308063\"/><trkpt lat=\"-37.519763\" lon=\"145.30826\"/><trkpt lat=\"-37.519466\" lon=\"145.308539\"/><trkpt lat=\"-37.518943\" lon=\"145.309268\"/></trkseg></trk><trk><name>segment-10</name><desc>color=#c0392b\nid=segment-10</desc><trkseg><trkpt lat=\"-37.518943\" lon=\"145.309268\"/><trkpt lat=\"-37.517457\" lon=\"145.311346\"/><trkpt lat=\"-37.516738\" lon=\"145.312566\"/><trkpt lat=\"-37.515744\" lon=\"145.313738\"/><trkpt lat=\"-37.515382\" lon=\"145.314096\"/><trkpt lat=\"-37.515067\" lon=\"145.314521\"/><trkpt lat=\"-37.514019\" lon=\"145.316141\"/><trkpt lat=\"-37.513818\" lon=\"145.316516\"/></trkseg></trk></gpx>",
  "geojson": {
    "type": "Feature",
    "properties": {
      "color": "#c0392b",
      "dashArray": [
        1,
        0
      ],
      "id": "segment-0",
      "gravelType": [
        "2"
      ],
      "title": "Bowden Spur Rd",
      "auth0Id": "google-oauth2|104387414892803104975"
    },
    "geometry": {
      "type": "LineString",
      "coordinates": [
        [
          145.268919,
          -37.547927,
          184
        ],
        [
          145.270569,
          -37.546433,
          189
        ],
        [
          145.270989,
          -37.546247,
          190
        ],
        [
          145.271096,
          -37.546145,
          190
        ],
        [
          145.271107,
          -37.546034,
          190
        ],
        [
          145.270959,
          -37.545724,
          186
        ],
        [
          145.270972,
          -37.545529,
          187
        ],
        [
          145.271111,
          -37.545093,
          188
        ],
        [
          145.271402,
          -37.544733,
          188
        ],
        [
          145.271673,
          -37.544462,
          191
        ],
        [
          145.271916,
          -37.544285,
          193
        ],
        [
          145.272387,
          -37.544096,
          195
        ],
        [
          145.272822,
          -37.544052,
          197
        ],
        [
          145.274357,
          -37.544347,
          191
        ],
        [
          145.274357,
          -37.544347,
          191
        ],
        [
          145.275449,
          -37.544548,
          188
        ],
        [
          145.275848,
          -37.544715,
          194
        ],
        [
          145.277,
          -37.545301,
          207
        ],
        [
          145.27816,
          -37.545715,
          213
        ],
        [
          145.279138,
          -37.546275,
          222
        ],
        [
          145.279303,
          -37.546335,
          223
        ],
        [
          145.279492,
          -37.546368,
          225
        ],
        [
          145.27988,
          -37.546313,
          228
        ],
        [
          145.280584,
          -37.545893,
          233
        ],
        [
          145.280584,
          -37.545893,
          233
        ],
        [
          145.280974,
          -37.545628,
          239
        ],
        [
          145.281045,
          -37.545526,
          239
        ],
        [
          145.281074,
          -37.545404,
          240
        ],
        [
          145.281025,
          -37.545322,
          240
        ],
        [
          145.280656,
          -37.545119,
          236
        ],
        [
          145.280613,
          -37.544916,
          236
        ],
        [
          145.281154,
          -37.544296,
          242
        ],
        [
          145.28147,
          -37.544149,
          247
        ],
        [
          145.282199,
          -37.544014,
          256
        ],
        [
          145.282289,
          -37.543931,
          256
        ],
        [
          145.282386,
          -37.543649,
          252
        ],
        [
          145.282504,
          -37.54354,
          251
        ],
        [
          145.28266,
          -37.543468,
          252
        ],
        [
          145.282839,
          -37.543431,
          254
        ],
        [
          145.283365,
          -37.543512,
          259
        ],
        [
          145.283558,
          -37.543469,
          259
        ],
        [
          145.284451,
          -37.542948,
          262
        ],
        [
          145.284681,
          -37.542844,
          262
        ],
        [
          145.285019,
          -37.542756,
          262
        ],
        [
          145.285019,
          -37.542756,
          262
        ],
        [
          145.285578,
          -37.542534,
          262
        ],
        [
          145.286506,
          -37.541892,
          260
        ],
        [
          145.287274,
          -37.541413,
          263
        ],
        [
          145.288409,
          -37.540503,
          265
        ],
        [
          145.289095,
          -37.539278,
          270
        ],
        [
          145.289319,
          -37.53839,
          281
        ],
        [
          145.289319,
          -37.53839,
          281
        ],
        [
          145.28949,
          -37.537644,
          288
        ],
        [
          145.289249,
          -37.536355,
          299
        ],
        [
          145.289828,
          -37.535691,
          289
        ],
        [
          145.290472,
          -37.535419,
          287
        ],
        [
          145.291293,
          -37.535236,
          288
        ],
        [
          145.29192,
          -37.534998,
          291
        ],
        [
          145.292392,
          -37.534709,
          296
        ],
        [
          145.294313,
          -37.532289,
          320
        ],
        [
          145.294313,
          -37.532289,
          320
        ],
        [
          145.295203,
          -37.531289,
          338
        ],
        [
          145.298969,
          -37.527881,
          359
        ],
        [
          145.299497,
          -37.527146,
          365
        ],
        [
          145.299497,
          -37.527146,
          365
        ],
        [
          145.29976,
          -37.526803,
          369
        ],
        [
          145.300239,
          -37.526027,
          376
        ],
        [
          145.300982,
          -37.524944,
          390
        ],
        [
          145.301879,
          -37.523816,
          416
        ],
        [
          145.302157,
          -37.523586,
          425
        ],
        [
          145.302612,
          -37.523339,
          433
        ],
        [
          145.302612,
          -37.523339,
          433
        ],
        [
          145.303228,
          -37.522911,
          440
        ],
        [
          145.303539,
          -37.522574,
          443
        ],
        [
          145.303734,
          -37.52227,
          450
        ],
        [
          145.303817,
          -37.522214,
          454
        ],
        [
          145.303911,
          -37.522239,
          457
        ],
        [
          145.303911,
          -37.52231,
          456
        ],
        [
          145.30334,
          -37.523417,
          450
        ],
        [
          145.303368,
          -37.523489,
          450
        ],
        [
          145.303517,
          -37.523483,
          451
        ],
        [
          145.303815,
          -37.523186,
          458
        ],
        [
          145.305395,
          -37.521101,
          501
        ],
        [
          145.305395,
          -37.521101,
          501
        ],
        [
          145.30554,
          -37.520899,
          504
        ],
        [
          145.305984,
          -37.520517,
          514
        ],
        [
          145.306077,
          -37.520372,
          518
        ],
        [
          145.306098,
          -37.520048,
          521
        ],
        [
          145.306502,
          -37.51967,
          536
        ],
        [
          145.306544,
          -37.519446,
          546
        ],
        [
          145.306638,
          -37.519407,
          549
        ],
        [
          145.306736,
          -37.519463,
          548
        ],
        [
          145.306646,
          -37.519842,
          536
        ],
        [
          145.306729,
          -37.520022,
          534
        ],
        [
          145.30694,
          -37.520162,
          537
        ],
        [
          145.307093,
          -37.520355,
          537
        ],
        [
          145.307218,
          -37.520398,
          539
        ],
        [
          145.307488,
          -37.52036,
          544
        ],
        [
          145.307855,
          -37.520244,
          556
        ],
        [
          145.308063,
          -37.520097,
          563
        ],
        [
          145.30826,
          -37.519763,
          570
        ],
        [
          145.308539,
          -37.519466,
          573
        ],
        [
          145.309268,
          -37.518943,
          578
        ],
        [
          145.309268,
          -37.518943,
          578
        ],
        [
          145.311346,
          -37.517457,
          602
        ],
        [
          145.312566,
          -37.516738,
          607
        ],
        [
          145.313738,
          -37.515744,
          614
        ],
        [
          145.314096,
          -37.515382,
          614
        ],
        [
          145.314521,
          -37.515067,
          612
        ],
        [
          145.316141,
          -37.514019,
          623
        ],
        [
          145.316516,
          -37.513818,
          625
        ]
      ]
    }
  },
  "metadata": {
    "title": "Bowden Spur Rd",
    "surfaceTypes": [],
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
        "$date": "2024-11-17T08:56:36.520Z"
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
    "$date": "2024-11-17T08:56:36.520Z"
  },
  "updatedAt": {
    "$date": "2024-12-15T05:11:26.749Z"
  }
}