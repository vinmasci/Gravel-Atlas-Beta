import { NextResponse } from 'next/server'
import { getCollection } from '../../../lib/db'
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

      // Get unique user IDs first
      const userIds = [...new Set(results.map(photo => photo.auth0Id))]
      
      // Fetch all needed users in one query
      const usersData = await users
        .find({ auth0Id: { $in: userIds } })
        .toArray()
      
      // Create a map for quick user lookups
      const userMap = new Map(usersData.map(user => [user.auth0Id, user]))
      
      const displayPhotos: PhotoDisplayData[] = results.map(photo => {
        const user = userMap.get(photo.auth0Id)
        
        return {
          id: photo._id!.toString(),
          url: photo.url,
          title: photo.originalName || 'Untitled',
          description: photo.caption,
          location: {
            lat: photo.latitude,
            lng: photo.longitude
          },
          dateTaken: photo.uploadedAt.getTime().toString(),
          uploadedBy: {
            id: photo.auth0Id,
            name: user?.bioName || photo.username,
            picture: photo.picture,
            website: user?.website,
            socialLinks: user?.socialLinks || {
              instagram: '',
              strava: '',
              facebook: ''
            }
          }
        }
      })
  
      return NextResponse.json(displayPhotos)
    } catch (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }
  }