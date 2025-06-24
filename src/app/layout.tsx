// cognify/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider"; // Ensure this import is correct

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cognify - Your Smart Study Assistant",
  description: "AI-powered personalized study assistance and planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}