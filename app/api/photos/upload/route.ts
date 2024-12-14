import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@auth0/nextjs-auth0'
import { getCollection } from '../../../../lib/db'
import { PhotoDocument, PhotoMetadata, PhotoUploadResponse, GeoPoint } from '@/app/types/photos'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(request: Request): Promise<NextResponse<PhotoUploadResponse>> {
  try {
    console.log('Starting photo upload process...')
    
    // Verify AWS credentials
    const awsConfig = {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    }
    console.log('AWS Config:', awsConfig)

    if (!awsConfig.hasAccessKey || !awsConfig.hasSecretKey || !awsConfig.bucket) {
      console.error('Missing AWS credentials')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    // Verify authentication
    const session = await getSession()
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Process form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string || '{}') as PhotoMetadata

    // Validate file
    if (!file) {
      console.log('No file in request')
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload an image.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      console.log('File too large:', file.size)
      return NextResponse.json({ 
        success: false, 
        error: 'File size must be less than 10MB' 
      }, { status: 400 })
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      metadata
    })

    // Create GeoPoint if coordinates exist
    const location: GeoPoint | null = metadata.latitude && metadata.longitude ? {
      type: 'Point',
      coordinates: [metadata.longitude, metadata.latitude]
    } : null

    // Prepare for S3 upload
    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const filename = `photos/${session.user.sub}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`

    console.log('Attempting S3 upload with:', {
      filename,
      contentType: file.type,
      bucketName: process.env.AWS_S3_BUCKET
    })

    // Upload to S3
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      }))
      console.log('S3 upload successful')
    } catch (s3Error: any) {
      console.error('S3 upload error:', {
        message: s3Error.message,
        code: s3Error.code,
        statusCode: s3Error.$metadata?.httpStatusCode
      })
      throw s3Error
    }

    // Generate image URL
    const imageUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`
    console.log('Generated image URL:', imageUrl)

    // Store in MongoDB
    try {
      const photos = await getCollection('photos')
      const photoDoc: PhotoDocument = {
        url: imageUrl,
        originalName: file.name,
        uploadedAt: new Date(),
        latitude: metadata.latitude || 0,
        longitude: metadata.longitude || 0,
        auth0Id: session.user.sub,
        username: session.user.name || '',
        caption: metadata.description || '',
        picture: session.user.picture || ''
      }

      await photos.insertOne(photoDoc)
      console.log('Database record created successfully')
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
      message: 'Photo uploaded successfully'
    })

  } catch (error: any) {
    console.error('Upload error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack,
      metadata: error.$metadata
    })

    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: {
        code: error.code,
        name: error.name,
        metadata: error.$metadata
      }
    }, { status: 500 })
  }
}