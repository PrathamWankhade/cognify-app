// src/components/dashboard/Sidebar.tsx
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
      <Link href="/dashboard" className="mb-8 text-2xl font-bold text-primary">
        Cognify
      </Link>
      <nav className="flex flex-col gap-2">
        {/* We will add navigation links here later */}
        <Link href="/dashboard" className="rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          Dashboard
        </Link>
        <Link href="/courses" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
          My Courses
        </Link>
         <Link href="/settings" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted">
          Settings
        </Link>
      </nav>
    </aside>
  );
}