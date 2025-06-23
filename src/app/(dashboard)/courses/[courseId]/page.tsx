// src/app/(dashboard)/courses/[courseId]/page.tsx

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import FileUpload from "@/components/dashboard/FileUpload";

// THIS IS THE FIX: We define the shape of the component's props here.
// This tells TypeScript exactly what to expect.
type Props = {
  params: {
    courseId: string;
  };
};

// And now we use our 'Props' type for the function's arguments.
export default async function CourseDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  // 1. Fetch the specific course and its documents
  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
      // Security check: ensure the course belongs to the logged-in user
      userId: session!.user.id,
    },
    include: {
      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // 2. If no course is found (or doesn't belong to the user), show a 404 page
  if (!course) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
      </div>

      {/* Section for Uploading Files */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Content</h2>
        <FileUpload courseId={course.id} />
      </div>

      {/* Section for Displaying Uploaded Documents */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Course Documents</h2>
        {course.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents have been uploaded for this course yet.</p>
        ) : (
          <div className="space-y-2">
            {course.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-md border bg-card">
                <p className="font-medium">{doc.name}</p>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{doc.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}