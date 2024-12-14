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