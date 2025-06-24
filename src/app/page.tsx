// cognify/src/app/page.tsx
"use client"; // This component needs to be a client component to use useSession and useRouter

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming you have Button from Shadcn/UI

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If session status is "authenticated", redirect to dashboard
    if (status === "authenticated") {
      router.push("/dashboard");
    }
    // No action needed if status is "loading" (still checking session)
    // If status is "unauthenticated", show the landing page content below
  }, [status, router]);

  // While checking session or if unauthenticated, show this content
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Content for unauthenticated users
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-primary/10 to-background">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-primary mb-6 animate-fade-in">
        Welcome to Cognify
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in animation-delay-300">
        Your AI-powered study assistant and planning partner. Unlock smarter learning.
      </p>
      <div className="flex gap-4 animate-fade-in animation-delay-600">
        <Link href="/login" passHref>
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/register" passHref>
          <Button variant="outline" size="lg">Sign Up</Button>
        </Link>
      </div>
    </main>
  );
}