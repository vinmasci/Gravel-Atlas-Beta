import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { PhotoDocument, PhotoDisplayData } from '@/app/types/photos'

export async function GET() {
  try {
    console.log('Starting photo fetch...')
    
    // Get collection
    const photos = await getCollection('photos')
    console.log('Got photos collection')

    // Get results
    const results = await photos
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray() as PhotoDocument[]
    
    console.log('Raw MongoDB results count:', results.length)
    console.log('First photo raw data:', JSON.stringify(results[0], null, 2))

    // Transform to match the format expected by the map
    console.log('Starting transformation...')
    
    const displayPhotos: PhotoDisplayData[] = results.map(photo => {
      const transformed = {
        id: photo._id!.toString(),
        url: photo.url,
        title: photo.originalName || 'Untitled',
        description: photo.caption,
        location: {
          lat: photo.latitude,
          lng: photo.longitude
        },
        dateTaken: photo.uploadedAt,
        uploadedBy: {
          id: photo.auth0Id,
          name: photo.username,
          picture: photo.picture
        }
      }
      
      console.log('Transformed photo:', JSON.stringify({
        id: transformed.id,
        uploadedBy: transformed.uploadedBy
      }, null, 2))
      
      return transformed
    })

    console.log('Total photos transformed:', displayPhotos.length)
    console.log('First transformed photo:', JSON.stringify(displayPhotos[0], null, 2))

    return NextResponse.json(displayPhotos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}