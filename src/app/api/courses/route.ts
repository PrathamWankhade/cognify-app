// cognify/src/app/api/courses/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import our auth config
import prisma from "@/lib/db"; // Import our prisma client

// This function handles POST requests to /api/courses
export async function POST(request: Request) {
  try {
    // 1. Check if the user is authenticated by getting the server-side session.
    const session = await getServerSession(authOptions);

    // If there's no session or no user ID in the session, deny access.
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized: You must be logged in to create a course.", { status: 401 });
    }

    // 2. Get the data from the request body (e.g., from our frontend form).
    const body = await request.json();
    const { title, description } = body;

    // 3. Simple validation: Ensure a title was provided.
    if (!title) {
      return new NextResponse("Bad Request: Title is required.", { status: 400 });
    }

    // 4. Use Prisma to create a new record in the 'Course' table.
    const newCourse = await prisma.course.create({
      data: {
        title: title,
        description: description,
        userId: session.user.id, // This is the crucial part: linking the course to the user.
      },
    });

    // 5. If successful, send back the newly created course data with a 201 status.
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    // If anything goes wrong, log the error and send a generic server error response.
    console.error("COURSE_CREATION_ERROR", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}