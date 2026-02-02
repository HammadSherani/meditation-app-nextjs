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

const moodSettings = {
    calm: { stability: 0.9, similarity_boost: 0.8, style: 0.0 },
    relaxed: { stability: 0.85, similarity_boost: 0.8, style: 0.0 },
    happy: { stability: 0.7, similarity_boost: 0.9, style: 0.1 },
    joyful: { stability: 0.6, similarity_boost: 0.9, style: 0.2 },
    excited: { stability: 0.4, similarity_boost: 0.9, style: 0.3 },
    energetic: { stability: 0.5, similarity_boost: 0.9, style: 0.3 },
    playful: { stability: 0.6, similarity_boost: 0.85, style: 0.2 },
    confident: { stability: 0.8, similarity_boost: 0.9, style: 0.1 },
    proud: { stability: 0.75, similarity_boost: 0.85, style: 0.1 },
    grateful: { stability: 0.85, similarity_boost: 0.8, style: 0.0 },
    sad: { stability: 0.8, similarity_boost: 0.7, style: 0.0 },
    depressed: { stability: 0.9, similarity_boost: 0.6, style: 0.0 },
    lonely: { stability: 0.85, similarity_boost: 0.7, style: 0.0 },
    disappointed: { stability: 0.8, similarity_boost: 0.75, style: 0.0 },
    hurt: { stability: 0.75, similarity_boost: 0.8, style: 0.0 },
    angry: { stability: 0.3, similarity_boost: 0.9, style: 0.3 },
    frustrated: { stability: 0.4, similarity_boost: 0.85, style: 0.2 },
    irritated: { stability: 0.5, similarity_boost: 0.85, style: 0.2 },
    aggressive: { stability: 0.2, similarity_boost: 0.9, style: 0.4 },
    anxious: { stability: 0.4, similarity_boost: 0.8, style: 0.1 },
    stressed: { stability: 0.3, similarity_boost: 0.85, style: 0.2 },
    nervous: { stability: 0.5, similarity_boost: 0.8, style: 0.1 },
    overwhelmed: { stability: 0.25, similarity_boost: 0.85, style: 0.3 },
    focused: { stability: 0.9, similarity_boost: 0.85, style: 0.0 },
    serious: { stability: 0.85, similarity_boost: 0.8, style: 0.0 },
    thoughtful: { stability: 0.8, similarity_boost: 0.75, style: 0.0 },
    curious: { stability: 0.7, similarity_boost: 0.85, style: 0.1 },
    surprised: { stability: 0.5, similarity_boost: 0.9, style: 0.3 },
    bored: { stability: 0.9, similarity_boost: 0.6, style: 0.0 },
    tired: { stability: 0.85, similarity_boost: 0.7, style: 0.0 },
    exhausted: { stability: 0.95, similarity_boost: 0.6, style: 0.0 },
    nostalgic: { stability: 0.8, similarity_boost: 0.7, style: 0.0 },
    peaceful: { stability: 0.95, similarity_boost: 0.8, style: 0.0 },
    neutral: { stability: 1.0, similarity_boost: 0.5, style: 0.0 }
};

export async function POST(req) {
    try {
        await connectDB();
        const { voiceId, voiceName, userText, duration, mood } = await req.json();

        const currentMood = mood?.toLowerCase() || "neutral";
        const selectedSettings = moodSettings[currentMood] || moodSettings.neutral;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            // messages: [
            //     {
            //         role: "system",
            //         content: `You are a world-class mindfulness guide. Write a guided meditation script for a session that is ${duration} seconds long (approx ${Math.floor(duration * 2.2)} words). 
            //         The user's mood is: ${currentMood}. 
            //         Context: ${userText}.

            //         Guidelines:
            //         - Punctuation is KEY: For calm/sad moods, use many ellipses (...) and commas for slow pacing. For excited/angry, use short sentences and exclamation marks (!).
            //         - Start with a greeting (hi/hello/hey) tailored to their mood.
            //         - Provide relief for negative moods or enhancement for positive ones.
            //         - Include specific breathing instructions (e.g., 'Inhale slowly...', 'Exhale...').
            //         - Do not include any intro/outro like [Scene starts], only the spoken text.`
            //     }
            // ],

            messages: [
                {
                    role: "system",
                    content: `You are the user's closest, most empathetic best friend. 
        The user is sharing their feelings with you. 
        
        User's Mood: ${currentMood}
        User's Message: "${userText}"
        Target Duration: ${duration} seconds.

        YOUR TASK:
        1. **React like a Friend**: First, acknowledge what they said. If they are sad, be supportive. If they are angry, be on their side. If they are happy, celebrate with them.
        2. **Mirror the Emotion**: Use a speaking style that matches their energy.
           - If they are HURT/SAD: Talk slowly, use "..." for pauses, and use comforting words like "I'm here for you," "It's okay to feel this way."
           - If they are ANGRY: Validate their frustration. "I totally get why you're mad, that's so unfair!!"
           - If they are EXCITED: Use high energy, shorter sentences, and exclamation marks like "Oh my god, that's AMAZING!!"
        3. **Conversation Flow**: Don't sound like a robot or a guide. Sound like a human having a heart-to-heart conversation.
        4. **Duration Control**: Keep the response length appropriate for ${duration} seconds.

        **CRITICAL FOR VOICE TONE**: 
        - For deep emotions (sad/calm), use "..." frequently to slow down the AI.
        - For high energy (happy/angry), use "!!" and ALL CAPS for emphasized words.
        
        No intros like "Friend:" or "Response:". Just speak directly to them.`
                }
            ],
        });

        const generatedScript = completion.choices[0].message.content;

        const elResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: generatedScript,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: selectedSettings.stability,
                    similarity_boost: selectedSettings.similarity_boost,
                    style: selectedSettings.style,
                    use_speaker_boost: true
                }
            }),
        });

        if (!elResponse.ok) throw new Error("ElevenLabs generation failed");

        const audioBuffer = Buffer.from(await elResponse.arrayBuffer());

        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                resource_type: "video",
                folder: "narrations"
            }, (error, result) => {
                if (error) reject(error); else resolve(result);
            }).end(audioBuffer);
        });

        const newNarration = await Narration.create({
            title: userText,
            script: generatedScript,
            voiceName: voiceName,
            audioUrl: uploadResult.secure_url,
            duration: duration,
            mood: currentMood,
        });

        return NextResponse.json({ success: true, narration: newNarration });

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}