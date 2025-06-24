// cognify/src/app/api/upload/route.ts
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

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const courseId = searchParams.get('courseId');

  if (!filename || !courseId) {
    return new NextResponse('Filename and courseId are required', { status: 400 });
  }
  
  const fileType = filename.split('.').pop()?.toUpperCase() ?? 'UNKNOWN';

  const document = await prisma.document.create({
    data: {
      name: filename,
      courseId: courseId,
      status: 'UPLOADING',
      fileType: fileType,
      url: '',
    }
  });

  const blob = await put(filename, request.body!, {
    access: 'public',
    metadata: {
      documentId: document.id,
      userId: session.user.id,
      courseId: courseId,
    }
  });

  // Update our database record with the final URL
  await prisma.document.update({
    where: { id: document.id },
    data: {
      url: blob.url,
      status: 'PENDING_PROCESSING',
    }
  });

  // V V V --- ADD THIS NEW SECTION --- V V V
  // Trigger the AI Worker to process the document in the background
  try {
    const aiWorkerUrl = process.env.AI_WORKER_URL; // Get URL from environment variable
    if (!aiWorkerUrl) {
      console.warn("AI_WORKER_URL not set. Document will not be processed by AI.");
      // You might want to set status to 'PROCESSING_SKIPPED' if worker is optional
    } else {
      await fetch(`${aiWorkerUrl}/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          documentUrl: blob.url,
          userId: session.user.id,
          courseId: courseId,
          fileType: fileType,
        }),
      });
      console.log(`Successfully sent document ${document.id} to AI worker.`);
    }
  } catch (workerError) {
    console.error("Failed to call AI worker:", workerError);
    // Update document status to indicate worker call failed if critical
    await prisma.document.update({
      where: { id: document.id },
      data: { status: 'WORKER_CALL_FAILED' },
    });
  }
  // ^ ^ ^ --- END OF NEW SECTION --- ^ ^ ^

  return NextResponse.json(blob);
}