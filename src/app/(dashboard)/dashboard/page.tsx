// src/app/(dashboard)/dashboard/page.tsx
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

export default async function DashboardPage() {
  // Get the user session on the server side
  const session = await getServerSession(authOptions);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome back, {session?.user?.name || 'User'}!</h1>
      <p className="mt-2 text-muted-foreground">This is your smart study dashboard. More features coming soon.</p>
      
      {/* TODO: Add widgets for courses, upcoming tasks, etc. */}
    </div>
  );
}