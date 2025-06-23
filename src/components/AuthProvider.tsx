// src/components/AuthProvider.tsx
"use client"; // This must be a client component

import { SessionProvider } from "next-auth/react";
import React from "react";

type Props = {
  children?: React.ReactNode;
};

// This component provides the session context to all its children.
export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}