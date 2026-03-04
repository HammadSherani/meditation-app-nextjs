import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Voice from "@/models/Voice";
import { requireAuth } from "@/lib/getSession";

export async function GET() {
  try {
    // Auth check
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.response;

    await connectDB();
    
    const voices = await Voice.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, voices });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
  }
}