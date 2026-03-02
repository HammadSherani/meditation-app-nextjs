// middleware.js
import { auth } from "./lib/auth";

export const middleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // Protect /dashboard route - redirect to login if not authenticated
  if (!isLoggedIn && nextUrl.pathname.startsWith("/dashboard")) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Can add more route protections here as needed
  return undefined;
});

// Configure which routes should use this middleware
export const config = {
  matcher: [
    // Protect dashboard and other routes
    "/dashboard/:path*",
    // Add other protected routes here
    // "/api/protected/:path*",
  ],
};
