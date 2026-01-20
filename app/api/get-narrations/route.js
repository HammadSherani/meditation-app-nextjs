import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Narration from "@/models/Narration";

export async function GET() {
  try {
    // 1. Database connection ensure karein
    await connectDB();

    // 2. Saari narrations fetch karein aur latest ko pehle dikhayen
    const narrations = await Narration.find({})
      .sort({ createdAt: -1 })
      .limit(20); // Optional: Last 20 results dikhane ke liye

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