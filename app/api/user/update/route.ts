import { NextResponse } from 'next/server'
import { getCollection } from '../../../../lib/db'
import { getSession } from '@auth0/nextjs-auth0'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const users = await getCollection('users')

    // Update user data
    const result = await users.updateOne(
      { auth0Id: session.user.sub },
      {
        $set: {
          bioName: data.bioName,
          website: data.website,
          socialLinks: data.socialLinks,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}