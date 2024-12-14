# Gravel Atlas Essential Documentation

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

## 🔄 Recent Updates (December 2024)
Looking at your MongoDB document, I can see that the elevation data isn't being stored when the segment is created. The metadata object shows:
jsonCopy"metadata": {
    "title": "dszdsfzdsff",
    "length": {"$numberInt":"3641"},
    "elevationGain": null,
    "elevationLoss": null,
    "surfaceTypes": []
}
We need to check where the elevation data is supposed to be saved when drawing/creating a segment. Let me check your draw mode handler:

Ah! I found the issue. In your segments/save/route.ts, when creating a new segment, it's initializing the elevation data as null:
typescriptCopysegment = new DrawnSegment({
  gpxData,
  geojson,
  metadata: {
    title,
    length,
    elevationGain: null,  // Here
    elevationLoss: null,  // And here
    surfaceTypes: []
  },
  // ...
});

Got it! The elevation data isn't being passed to the save endpoint. In draw-segment-panel.tsx, when saving the segment, we need to include the elevation data. Here's what needs to be fixed:

// In draw-segment-panel.tsx, modify the handleSave function:

const payload = {
  title: segmentTitle,
  gpxData,
  geojson: {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: segment.geometry.coordinates
    },
    properties: {}
  },
  // Add this section
  metadata: {
    elevationProfile: elevationProfile,
    // Calculate elevation gain/loss from the profile
    elevationGain: calculateElevationGain(elevationProfile),
    elevationLoss: calculateElevationLoss(elevationProfile)
  }
};

// Add these helper functions
function calculateElevationGain(profile: { distance: number; elevation: number; }[]) {
  let gain = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].elevation - profile[i-1].elevation;
    if (diff > 0) gain += diff;
  }
  return Math.round(gain);
}

function calculateElevationLoss(profile: { distance: number; elevation: number; }[]) {
  let loss = 0;
  for (let i = 1; i < profile.length; i++) {
    const diff = profile[i].elevation - profile[i-1].elevation;
    if (diff < 0) loss += Math.abs(diff);
  }
  return Math.round(loss);
}

Then in your save endpoint (segments/save/route.ts), modify the segment creation

segment = new DrawnSegment({
  gpxData,
  geojson,
  metadata: {
    title,
    length,
    elevationProfile: body.metadata?.elevationProfile || [],
    elevationGain: body.metadata?.elevationGain || null,
    elevationLoss: body.metadata?.elevationLoss || null,
    surfaceTypes: []
  },
  // ... rest of the segment data
});