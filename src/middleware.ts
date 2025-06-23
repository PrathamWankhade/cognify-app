// src/middleware.ts
export { default } from "next-auth/middleware"

// This config object specifies which routes the middleware should apply to.
export const config = { 
  matcher: [
    // Add all the routes you want to protect here
    "/dashboard/:path*", // Protects all sub-routes of /dashboard
    "/courses/:path*",
    "/settings",
  ] 
};