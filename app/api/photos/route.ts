import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { PhotoDocument, PhotoDisplayData } from '@/app/types/photos'

export async function GET() {
  try {
    const photos = await getCollection('photos')
    const results = await photos
      .find({})
      .sort({ uploadedAt: -1 })
      .toArray() as PhotoDocument[]

    // Transform to match the format expected by the map
    const displayPhotos: PhotoDisplayData[] = results.map(photo => ({
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