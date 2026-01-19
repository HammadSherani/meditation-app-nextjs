import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/db";
import Voice from "@/models/Voice";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get("name");
    const audioFile = formData.get("file");
    const duration = formData.get("duration");

    if (!audioFile || !name) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Audio File ko Buffer mein convert karna Cloudinary ke liye
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Cloudinary par Upload karna
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "voice_samples" }, // Audio ke liye resource_type "video" use hota hai
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // 3. ElevenLabs par Voice Clone karna
    const elFormData = new FormData();
    elFormData.append("name", name);
    elFormData.append("files", audioFile, "sample.wav");

    const elResponse = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      body: elFormData,
    });

    const elData = await elResponse.json();
    if (!elResponse.ok) throw new Error("ElevenLabs failed");

    // 4. MongoDB mein Save karna (With Cloudinary URL)
    await connectDB();
    const savedVoice = await Voice.create({
      name: name,
      voice_id: elData.voice_id,
      voiceUrl: cloudinaryResponse.secure_url, 
      metadata: {
        fileSize: audioFile.size,
        format: audioFile.type.split("/")[1] || "wav",
        duration: duration || 0 
      }
    });

    return NextResponse.json({ success: true, voice: savedVoice });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}