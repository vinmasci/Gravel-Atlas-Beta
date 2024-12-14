import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@auth0/nextjs-auth0'
import { getCollection } from '../../../../lib/db'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(request: Request) {
  console.log('Starting image upload process...')
  try {
    // First verify our AWS credentials are loaded
    const awsConfig = {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    }
    console.log('AWS Config:', awsConfig)

    if (!awsConfig.hasAccessKey || !awsConfig.hasSecretKey || !awsConfig.bucket) {
      console.error('Missing AWS credentials')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const session = await getSession()
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      console.log('No file in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type)
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.log('File too large:', file.size)
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const filename = `${session.user.sub}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

    console.log('Attempting S3 upload with:', {
      filename,
      contentType: file.type,
      bucketName: process.env.AWS_S3_BUCKET
    })

    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
        // Removed ACL setting
      }))
      console.log('S3 upload successful')
    } catch (s3Error: any) {
      console.error('S3 upload error:', {
        message: s3Error.message,
        code: s3Error.code,
        statusCode: s3Error.$metadata?.httpStatusCode,
        requestId: s3Error.$metadata?.requestId
      })
      throw s3Error
    }

    const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
    console.log('Generated image URL:', imageUrl)

    try {
      const users = await getCollection('users')
      await users.updateOne(
        { auth0Id: session.user.sub },
        { 
          $set: { 
            picture: imageUrl,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
      console.log('Database updated successfully')
    } catch (dbError: any) {
      console.error('Database error:', {
        message: dbError.message,
        code: dbError.code
      })
      throw dbError
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: 'Profile picture updated successfully'
    })
  } catch (error: any) {
    // Detailed error logging
    console.error('Upload error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      metadata: error.$metadata
    })

    return NextResponse.json(
      { 
        error: error.message,
        details: {
          code: error.code,
          name: error.name,
          metadata: error.$metadata
        }
      },
      { status: 500 }
    )
  }
}