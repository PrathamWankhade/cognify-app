// src/app/(dashboard)/courses/[courseId]/page.tsx

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import FileUpload from "@/components/dashboard/FileUpload";

// Step 1: Define the complete, official props type for a Next.js Page.
type PageProps = {
  params: { courseId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Step 2: Accept the entire 'props' object with the 'PageProps' type.
// We will NOT destructure { params } here.
export default async function CourseDetailPage(props: PageProps) {
  // Step 3: Destructure 'params' from the props object right here.
  // This is the key change in our approach.
  const { params } = props;

  const session = await getServerSession(authOptions);

  const course = await prisma.course.findUnique({
    where: {
      id: params.courseId,
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

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Content</h2>
        <FileUpload courseId={course.id} />
      </div>

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