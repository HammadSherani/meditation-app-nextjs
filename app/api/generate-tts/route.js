import { NextResponse } from "next/server";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/db";
import Narration from "@/models/Narration";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
    try {
        await connectDB();
        const { voiceId, voiceName, userText, duration, mood } = await req.json();

        // 1. OpenAI: Topic se Script Generate karna
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a world-class mindfulness guide. Write a guided meditation script for a session that is ${duration} seconds long. The user's current state is: ${mood}. and user text is: ${userText}.
                    Guidelines:
                                Focus on the user's specific mood to provide relief or enhancement.
                                Start with greeting like (hi/hello/hey) and then move to the script, and try to greet the user according to his mood.
                                Use extremely soothing, simple language.
                                Include instructions for breathing (e.g., 'Inhale slowly...', 'Exhale...').
                                Focus on the user's specific mood to provide relief or enhancement.
                                Do not include an intro or outro, just the spoken script."
                    `,
                }



            ],
        });
        const generatedScript = completion.choices[0].message.content;

        const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "xi-api-key": process.env.ELEVENLABS_API_KEY },
            body: JSON.stringify({
                text: generatedScript,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.8 }
            }),
        });

        if (!elResponse.ok) throw new Error("ElevenLabs generation failed");
        const audioBuffer = Buffer.from(await elResponse.arrayBuffer());

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "video", folder: "narrations" }, (error, result) => {
                if (error) reject(error); else resolve(result);
            }).end(audioBuffer);
        });

        const newNarration = await Narration.create({
            title: userText,
            script: generatedScript,
            voiceName: voiceName,
            audioUrl: uploadResult.secure_url,
            duration: duration,
            mood: mood,
        });

        return NextResponse.json({ success: true, narration: newNarration });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}