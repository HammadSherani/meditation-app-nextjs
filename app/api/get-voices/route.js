import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Voice from "@/models/Voice";

export async function GET() {
  try {
    await connectDB();
    
    const voices = await Voice.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, voices });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
  }
}