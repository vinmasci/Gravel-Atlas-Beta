// app/api/segments/save/route.ts
export async function POST(req: Request) {
    try {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      // Connect to database and log connection status
      try {
        await dbConnect();
        console.log('Successfully connected to MongoDB');
      } catch (dbError: any) {
        console.error('Database connection error:', {
          message: dbError.message,
          stack: dbError.stack,
          details: dbError
        });
        return NextResponse.json(
          { error: 'Database connection failed', details: dbError.message },
          { status: 500 }
        );
      }
  
      // Parse and log request body
      let body;
      try {
        body = await req.json();
        console.log('Parsed request body:', JSON.stringify(body, null, 2));
      } catch (parseError: any) {
        console.error('Request body parse error:', {
          message: parseError.message,
          stack: parseError.stack
        });
        return NextResponse.json(
          { error: 'Invalid request body', details: parseError.message },
          { status: 400 }
        );
      }
  
      const { geojson, title } = body;
  
      if (!geojson || !title) {
        console.log('Missing fields:', { hasGeojson: !!geojson, hasTitle: !!title });
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }
  
      // Validate geojson structure
      if (!geojson.type || !geojson.geometry || !geojson.geometry.coordinates) {
        console.log('Invalid GeoJSON structure:', geojson);
        return NextResponse.json(
          { error: 'Invalid GeoJSON structure' },
          { status: 400 }
        );
      }
  
      // Create GPX using our server-side function
      const gpxData = createGPX(geojson, title);
  
      // Calculate basic metadata
      const coordinates = geojson.geometry.coordinates;
      const length = calculateLength(coordinates);
  
      // Log the data we're about to save
      console.log('Creating segment with data:', {
        title,
        userId: session.user.sub,
        userName: session.user.name,
        coordinatesCount: coordinates.length,
        length
      });
  
      // Create new segment document
      let segment;
      try {
        segment = new DrawnSegment({
          gpxData,
          geojson,
          metadata: {
            title,
            length,
            elevationGain: null,
            elevationLoss: null,
            surfaceTypes: []
          },
          auth0Id: session.user.sub,
          userName: session.user.name || 'Anonymous',
          votes: [],
          stats: {
            totalVotes: 0,
            averageRating: null
          }
        });
      } catch (modelError: any) {
        console.error('Error creating segment model:', {
          message: modelError.message,
          stack: modelError.stack,
          details: modelError
        });
        return NextResponse.json(
          { error: 'Failed to create segment model', details: modelError.message },
          { status: 500 }
        );
      }
  
      // Validate the model
      const validationError = segment.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return NextResponse.json(
          { error: 'Validation failed', details: validationError },
          { status: 400 }
        );
      }
  
      // Save the segment
      let savedSegment;
      try {
        savedSegment = await segment.save();
        console.log('Segment saved successfully:', savedSegment._id);
      } catch (saveError: any) {
        console.error('Error during segment save:', {
          message: saveError.message,
          stack: saveError.stack,
          code: saveError.code,
          details: saveError
        });
        return NextResponse.json(
          { error: 'Failed to save segment', details: saveError.message },
          { status: 500 }
        );
      }
  
      return NextResponse.json({
        success: true,
        segment: savedSegment
      });
      
    } catch (error: any) {
      // Enhanced error logging
      console.error('Unhandled error in segment save:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        details: error
      });
  
      return NextResponse.json(
        { 
          error: 'Failed to save segment',
          details: error?.message || 'Unknown error occurred',
          name: error?.name,
          code: error?.code
        },
        { status: 500 }
      );
    }
  }