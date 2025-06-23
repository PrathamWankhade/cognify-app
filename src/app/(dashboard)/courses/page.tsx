// cognify/src/app/(dashboard)/courses/page.tsx

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import CreateCourseDialog from "@/components/dashboard/CreateCourseDialog";

// This is an async Server Component
export default async function CoursesPage() {
  // 1. Securely get the user's session on the server.
  const session = await getServerSession(authOptions);
  
  // 2. Fetch the courses for ONLY the logged-in user from the database.
  // The '!' tells TypeScript we are certain the session and user.id exist because
  // this route is protected by our middleware.
  const courses = await prisma.course.findMany({
    where: {
      userId: session!.user.id,
    },
    orderBy: {
      createdAt: "desc", // Show the newest courses at the top
    },
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <CreateCourseDialog />
      </div>

      {/* Conditional Rendering: Show a message if no courses exist */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
          <h3 className="text-xl font-semibold">No Courses Found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Click "Create New Course" to get started.
          </p>
        </div>
      ) : (
        // Otherwise, map over the courses and display them as cards
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description || "No description."}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}