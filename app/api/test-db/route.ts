import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'

export async function GET() {
  try {
    const db = await getDb()
    
    // Get sample from each collection
    const results = {
      users: await db.collection('users').find().limit(1).toArray(),
      photos: await db.collection('photos').find().limit(1).toArray(),
      comments: await db.collection('comments').find().limit(1).toArray(),
      activities: await db.collection('activities').find().limit(1).toArray()
    }
    
    // Get counts for each collection
    const counts = {
      users: await db.collection('users').countDocuments(),
      photos: await db.collection('photos').countDocuments(),
      comments: await db.collection('comments').countDocuments(),
      activities: await db.collection('activities').countDocuments()
    }

    return NextResponse.json({ 
      success: true, 
      counts,
      sampleData: results
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}