import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { PhotoDocument, PhotoDisplayData } from '@/app/types/photos'

export async function GET() {
    try {
      console.log('Starting photo fetch...')
      
      const photos = await getCollection('photos')
      const users = await getCollection('users')
      
      const results = await photos
        .find({})
        .sort({ uploadedAt: -1 })
        .toArray() as PhotoDocument[]
      
      const displayPhotos: PhotoDisplayData[] = await Promise.all(results.map(async photo => {
        // Get user data for each photo
        const user = await users.findOne({ auth0Id: photo.auth0Id })
        
        return {
          id: photo._id!.toString(),
          url: photo.url,
          title: photo.originalName || 'Untitled',
          description: photo.caption,
          location: {
            lat: photo.latitude,
            lng: photo.longitude
          },
          dateTaken: photo.uploadedAt.toISOString(), // Convert to ISO string
          uploadedBy: {
            id: photo.auth0Id,
            name: user?.bioName || photo.username,  // Use bioName from users collection
            picture: photo.picture
          }
        }
      }))
  
      return NextResponse.json(displayPhotos)
    } catch (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }
  }