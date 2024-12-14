import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await getCollection('comments');
    const segmentComments = await comments
      .find({ segmentId: new ObjectId(params.id) })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ comments: segmentComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comments = await getCollection('comments');
    
    const comment = {
      segmentId: new ObjectId(params.id),
      userId: session.user.sub,
      userName: session.user.name,
      userImage: session.user.picture,
      content,
      createdAt: new Date(),
    };

    const result = await comments.insertOne(comment);
    
    return NextResponse.json({
      comment: { ...comment, id: result.insertedId }
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 }
    );
  }
}