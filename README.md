# Gravel Atlas Beta

A web application for mapping and exploring gravel roads across Australia. Built with Next.js, Mapbox, and modern web technologies.

## 🎯 Current Status (Dec 11, 2024)

### Working Features ✅
- **Authentication & User Management**
  - Auth0 integration with unified sign-in/sign-up
  - User profile system with avatar support
  - Secure authentication flow
  - User session management
  - Dark/Light mode persistence per user
  - AWS S3 profile picture integration
  - User profile data with MongoDB integration

- **Multiple Map Providers**
  - Mapbox (outdoor style) - Primary map with clean UI
  - OpenStreetMap Cycle via Thunderforest - Great for cycling routes
  - Google Maps (Standard, Hybrid, Satellite) - Alternative views
  - Smooth transitions between providers
  - Each with proper error handling

- **Core Navigation**
  - Functional search (geocoding)
  - Zoom controls
  - Location centering
  - Style switching between providers
  - Default centered on Melbourne

- **UI/UX Achievements**
  - Minimalist, clean navbar design
  - Responsive authentication controls
  - Desktop: Full sidebar with collapsible sections
  - Mobile: Optimized controls at bottom of screen
  - Clean transitions between views
  - Dark/Light mode support
  - Loading indicators
  - Alert system for incompatible features
  - Controlled sheet animations with proper state management

- **Map Overlays**
  - Layer system implemented for:
    - Segments
    - Photos
    - Gravel/Unpaved Roads
    - Asphalt/Paved Roads
    - Speed Limits
    - Private Access
    - Mapillary integration (except with Google Maps)

### Known Issues 🚨
1. **Map Display**
   - OSM Cycle Map requires zoom level 6+ for proper display
   - Tiling issues during extreme zoom-out transitions
   - Globe effect conflicts between Mapbox/OSM

2. **Feature Limitations**
   - Mapillary only works with Mapbox/OSM (Google Maps restriction)
   - Layer states don't persist between map style changes
   - Overlay data not yet connected to backend

## 🚀 Next Development Phase

### High Priority
1. **Photo Upload Enhancement**
   - Implement GPS coordinates extraction from EXIF data
   - Add date taken metadata processing
   - Create map markers for uploaded photos
   - Add photo clustering for better map visualization
   - Implement user-specific photo management
   - Add photo deletion and editing capabilities
   - Create photo information display overlay

2. **Data Integration**
   - MongoDB connection optimization
   - Migration of existing user data
   - User preferences storage
   - Real-time updates
   - Photo metadata storage schema

3. **Core Features**
   - Drawing tools for segments
   - GPX file handling
   - Proper data layers for overlays

4. **UX Improvements**
   - Layer switching animations
   - Layer caching
   - Mobile responsiveness refinements
   - Add image compression before upload
   - Implement image cropping functionality
   - Add photo preview functionality

### Future Roadmap
- Community features
- Offline support
- Route planning algorithms
- Custom map styles
- Advanced search filters
- Distance calculations
- Performance optimizations

## 🛠 Tech Stack
- Next.js 14 (App Router)
- Auth0 Authentication
- AWS S3 for image storage
- MongoDB for data storage
- Mapbox GL JS
- Google Maps API
- Thunderforest API
- Tailwind CSS
- shadcn/ui components
- TypeScript
- next-themes

## 📦 Setup Guide

1. Clone repository
   ```bash
   npm install
   ```

2. Install required shadcn/ui components:
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add sheet
   npx shadcn-ui@latest add accordion
   npx shadcn-ui@latest add radio-group
   npx shadcn-ui@latest add alert
   npx shadcn-ui@latest add dropdown-menu
   ```

3. Create `.env.local`:
   ```
   # Map Providers
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
   NEXT_PUBLIC_THUNDERFOREST_API_KEY=your_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

   # Auth0 Configuration
   AUTH0_SECRET=use_openssl_rand_-hex_32_to_generate
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://your-tenant.region.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret

   # AWS Configuration
   AWS_REGION=ap-southeast-2
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_S3_BUCKET=your_bucket_name
   ```

4. Start development:
   ```bash
   npm run dev
   ```

## 📊 API Limits
- Thunderforest: 150,000 tiles/month (free tier)
- Google Maps: Varies by service
- Mapbox: Plan dependent
- Mapillary: No explicit limit
- Auth0: Free tier limits apply
- AWS S3: Based on chosen plan

## 🔧 Troubleshooting
1. **Map Issues**
   - Clear cache for style updates
   - Check console for API errors
   - Verify API keys
   - Use zoom level 6+ for OSM Cycle

2. **Style Switching**
   - Allow debounce time between switches
   - Monitor network tab
   - Check error console

3. **Component Problems**
   - Verify shadcn/ui installations
   - Check required imports
   - Test mobile layout
   - Clear .next directory if needed

4. **Authentication Issues**
   - Verify Auth0 environment variables
   - Check Auth0 application settings
   - Ensure callback URLs are properly configured
   - Clear browser cookies if login issues persist

5. **AWS S3 Issues**
   - Verify AWS credentials in .env.local (no quotes needed)
   - Check S3 bucket CORS configuration
   - Verify proper bucket permissions
   - Monitor AWS CloudWatch logs for errors

## 🔄 Development Updates

### December 11, 2024
1. **Profile Management Improvements**
   - Fixed profile picture upload functionality
   - Resolved phantom sheet slider issue
   - Implemented proper state management for sheet component
   - Added file type and size validation for uploads

2. **AWS Integration**
   - Completed S3 bucket setup
   - Implemented secure file upload
   - Added error handling for upload process
   - Fixed environment variable formatting

3. **UI Enhancements**
   - Added loading states for uploads
   - Improved error notifications
   - Enhanced profile picture preview
   - Fixed sheet animation issues

### Next Sprint Focus
1. **Photo Upload System**
   - Implement GPS metadata extraction
   - Add date taken processing
   - Create photo markers on map
   - Develop photo management interface

2. **Security**
   - Implement proper AWS credential rotation
   - Add additional upload validations
   - Implement rate limiting for uploads
   - Add proper error handling for failed uploads

### Technical Notes 📝
- Environment variables must be added without quotes in `.env.local`
- AWS S3 bucket requires proper CORS configuration
- Toast notifications require client-side components ("use client" directive)
- Sheet components need controlled state for proper animation

├── README.md
├── app
│   ├── admin
│   │   └── page.tsx
│   ├── api
│   │   ├── test-db
│   │   │   └── route.ts
│   │   └── user
│   │       ├── [id]
│   │       └── update
│   ├── constants
│   │   └── map-styles.ts
│   ├── favicon.ico
│   ├── fonts
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── types
│       ├── auth
│       │   └── index.ts
│       └── map.ts
├── components
│   ├── ProfileSheet.tsx
│   ├── auth
│   │   └── auth-status.tsx
│   ├── layout
│   │   ├── navbar.tsx
│   │   └── tools-panel.tsx
│   ├── map-sidebar.tsx
│   ├── map-view.tsx
│   ├── mobile-sidebar.tsx
│   ├── navbar.tsx
│   ├── panels
│   │   ├── contribute-panel.tsx
│   │   ├── layer-control.tsx
│   │   ├── layers-panel.tsx
│   │   ├── search-panel.tsx
│   │   └── user-panel.tsx
│   ├── theme-provider.tsx
│   └── ui
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── custom-alert.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── navigation-menu.tsx
│       ├── radio-group.tsx
│       ├── sheet.tsx
│       ├── switch.tsx
│       └── tabs.tsx
├── components.json
├── directory.txt
├── lib
│   ├── auth-sync.ts
│   ├── db.ts
│   ├── mapillary.ts
│   ├── mongodb.ts
│   └── utils.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── pages
│   └── api
│       └── auth
│           └── [...auth0].ts
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json

## 🔄 Development Update - Photo Upload Feature

### Recent Implementations ✅
- **Photo Upload System**
  - Created upload photo dialog with preview
  - Added file validation (type and size checks)
  - Integrated with existing AWS S3 storage
  - Added MongoDB photo collection for metadata
  - Implemented user authentication checks
  - Added EXIF data extraction for:
    - GPS coordinates
    - Date taken
    - Camera details
  - Created photo marker system for map display

### File Structure
```
app/
  ├── api/
  │   └── photos/
  │       ├── route.ts             # GET photos endpoint
  │       └── upload/
  │           └── route.ts         # POST photo upload endpoint
  ├── types/
  │   └── photos.ts               # TypeScript interfaces for photos
components/
  ├── map/
  │   └── photo-marker.tsx        # Map marker for photos
  ├── photos/
  │   └── photo-viewer.tsx        # Modal for viewing photos
  └── panels/
      └── photos-layer.tsx        # Layer control for photos
```

### Data Models
- **PhotoDocument** (MongoDB)
  - User ID
  - Image URL
  - Title and description
  - GPS location (GeoJSON Point)
  - Date taken
  - Upload timestamp
  - EXIF metadata
  - Status (active/deleted/pending)

### Dependencies Added
- exif-reader: For extracting image metadata
- @radix-ui components from shadcn/ui:
  - Dialog
  - Avatar
  - Switch

### Current Features
- Secure photo uploads for authenticated users
- Image preview before upload
- Automatic GPS coordinate extraction
- Camera metadata display
- Photo markers on map
- Photo viewer modal
- Layer toggle control

### Next Steps 🎯
1. **Photo Management**
   - Add photo editing capabilities
   - Implement photo deletion
   - Add moderation system
   - Batch upload support

2. **Map Integration**
   - Add photo clustering for better performance
   - Implement photo filtering by date/location
   - Add photo search functionality
   - Create photo routes/trails

3. **Social Features**
   - Add likes/comments
   - Share functionality
   - User photo galleries
   - Photo collections/albums

4. **Performance**
   - Implement image compression
   - Add image resizing
   - Optimize marker rendering
   - Cache photo data

### Technical Notes 📝
- Maximum file size: 10MB
- Supported formats: All standard image formats
- Photos stored in AWS S3 under `/photos/{userId}/{timestamp}-{filename}`
- MongoDB collection uses GeoJSON for location queries
- Photo layer uses Mapbox custom markers

## 🔄 Development Update - Photo Upload Features

### Recently Implemented ✅
1. **Photo Upload System**
   - Drag and drop or file picker interface
   - Multiple file selection support
   - Image preview before upload
   - Automatic GPS data extraction from EXIF
   - File validation and size limits (10MB)
   - Image compression for storage optimization
   - Visual GPS status indicator during upload

2. **Map Integration**
   - Photos appear as markers on the map
   - Cluster system for multiple photos
   - Basic photo preview on marker click
   - Layer toggle in sidebar controls
   - Proper cleanup and state management

### Current Development 🚧
1. **Enhancing Cluster UI**
   - Replacing current cluster display with improved layout
   - Implementing three-photo preview in clusters
   - Adding photo count overlay on third photo
   - Updating cluster icon to use Font Awesome styling
   - Improving single photo marker appearance

2. **Photo Detail Improvements**
   - Adding user profile information to photo popups
   - Integrating social media links
   - Including upload date and location data
   - Enhancing popup layout and styling

3. **User Integration**
   - Linking photos with user profiles
   - Adding social media handles
   - Including user avatars in photo details
   - Implementing proper attribution

### Next Steps 🎯
1. **UI/UX Refinements**
   - Implement smooth transitions
   - Enhance mobile responsiveness
   - Add loading states
   - Improve error handling

2. **Photo Management**
   - Add editing capabilities
   - Implement deletion
   - Add photo descriptions
   - Include tagging system

3. **Social Features**
   - Add likes/comments
   - Implement sharing functionality
   - Create user galleries
   - Add photo collections/albums

### Technical Notes 📝
- Using exifr for reliable GPS extraction
- Implementing browser-image-compression for upload optimization
- Utilizing Mapbox GL JS for map integration
- Leveraging shadcn/ui components for consistent UI
- MongoDB for photo metadata storage
- AWS S3 for image storage