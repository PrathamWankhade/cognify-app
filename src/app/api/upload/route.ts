// src/app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 1. Get filename and courseId from the search params (e.g., /api/upload?filename=doc.pdf&courseId=xyz)
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const courseId = searchParams.get('courseId');

  if (!filename || !courseId) {
    return new NextResponse('Filename and courseId are required', { status: 400 });
  }

  // 2. Create the record in our database first with PENDING status
  const document = await prisma.document.create({
    data: {
      name: filename,
      courseId: courseId,
      status: 'UPLOADING', // Set initial status
      fileType: filename.split('.').pop()?.toUpperCase() ?? 'UNKNOWN',
      url: '', // URL will be added after upload
    }
  });

  // 3. Upload the file to Vercel Blob
  // request.body is a stream of the file's contents
  const blob = await put(filename, request.body!, {
    access: 'public',
    // We can add metadata to link back to our database record
    metadata: {
      documentId: document.id,
      userId: session.user.id,
    }
  });

  // 4. Update our database record with the final URL from Vercel Blob
  await prisma.document.update({
    where: { id: document.id },
    data: {
      url: blob.url,
      status: 'PENDING_PROCESSING', // New status: ready for AI worker
    }
  });

  // TODO: In the next step, we will trigger the AI worker here.

  return NextResponse.json(blob);
}