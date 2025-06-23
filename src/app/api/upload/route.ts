// src/app/api/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/db';

export async function POST(request: Request): Promise<NextResponse> {
  // First, authenticate the user. This is a secure endpoint.
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 1. Get filename and courseId from the URL's search parameters.
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const courseId = searchParams.get('courseId');

  // Validate that we have the necessary parameters.
  if (!filename || !courseId) {
    return new NextResponse('Filename and courseId query parameters are required', { status: 400 });
  }

  // 2. Create a preliminary record in our database.
  // This gives us a document ID before we even start the upload.
  const document = await prisma.document.create({
    data: {
      name: filename,
      courseId: courseId,
      status: 'UPLOADING', // The initial status of the document.
      fileType: filename.split('.').pop()?.toUpperCase() ?? 'UNKNOWN',
      url: '', // The URL will be empty until the upload is complete.
    }
  });

  // 3. Upload the file stream from the request body to Vercel Blob.
  // The 'request.body!' is the raw file data sent from the frontend.
  // The second argument to `put` is the body, the third is the options.
  const blob = await put(filename, request.body!, {
    access: 'public',
    // The 'metadata' property is not supported here in this version.
    // It is now handled automatically via 'x-metadata-*' headers from the client.
  });

  // 4. Once the upload is successful, update our database record.
  // We now have the final URL from Vercel Blob.
  await prisma.document.update({
    where: { id: document.id },
    data: {
      url: blob.url,
      status: 'PENDING_PROCESSING', // The new status, ready for our AI.
    }
  });

  // TODO: In the next phase, we will trigger the AI worker from here.

  // 5. Return the successful blob information to the client.
  return NextResponse.json(blob);
}