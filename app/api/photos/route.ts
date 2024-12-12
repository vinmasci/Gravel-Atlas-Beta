import { NextResponse } from 'next/server'
import { getCollection } from '@/lib/db'
import { PhotoDocument, PhotoDisplayData } from '@/app/types/photos'

export async function GET(request: Request) {
  try {
    const photos = await getCollection('photos')
    const results = await photos
      .find({ status: 'active' })
      .sort({ uploadedAt: -1 })
      .limit(100)
      .toArray() as PhotoDocument[]

    // Transform to display format
    const displayPhotos: PhotoDisplayData[] = results.map(photo => ({
      id: photo._id!.toString(),
      url: photo.url,
      title: photo.title,
      description: photo.description,
      location: photo.location ? {
        lat: photo.location.coordinates[1],
        lng: photo.location.coordinates[0]
      } : undefined,
      dateTaken: photo.dateTaken,
      uploadedBy: {
        id: photo.userId,
        name: photo.userId, // You might want to fetch user details here
        picture: undefined
      },
      tags: photo.tags || []
    }))

    return NextResponse.json(displayPhotos)
  } catch (error: any) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}