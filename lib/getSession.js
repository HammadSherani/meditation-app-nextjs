import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Server-side session check helper for API routes
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return session;
}

// Middleware helper - returns error response if not authenticated
export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      ),
    };
  }
  return { authenticated: true, session };
}
