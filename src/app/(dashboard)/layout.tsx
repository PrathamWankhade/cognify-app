// src/app/(dashboard)/layout.tsx
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 bg-muted/40 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}