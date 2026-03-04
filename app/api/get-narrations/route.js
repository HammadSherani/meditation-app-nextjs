import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Narration from "@/models/Narration";
import { requireAuth } from "@/lib/getSession";

export async function GET() {
  try {
    // Auth check
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    // 1. Ensure database connection
    await connectDB();

    // 2. Fetch all narrations, latest first
    const narrations = await Narration.find({})
      .sort({ createdAt: -1 })
      .limit(20); // Optional: Show last 20 results

    return NextResponse.json({ 
      success: true, 
      narrations 
    });

  } catch (error) {
    console.error("Fetch Narrations Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history" }, 
      { status: 500 }
    );
  }
}