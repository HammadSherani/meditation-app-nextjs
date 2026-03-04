import { NextResponse } from "next/server";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "@/lib/db";
import Narration from "@/models/Narration";
import { requireAuth } from "@/lib/getSession";

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
    neutral: { stability: 1.0, similarity_boost: 0.5, style: 0.0 },
};

const bgMusicMap = {
    peaceful_piano: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8f89b8e2b.mp3",
    ambient_nature: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8e6b7b5b0.mp3",
    soft_lofi: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_0b8f9c1a1f.mp3",
    cinematic_emotional: "https://cdn.pixabay.com/download/audio/2022/04/18/audio_7d3f5e4c8d.mp3",
    upbeat_acoustic: "https://cdn.pixabay.com/download/audio/2022/03/21/audio_9e2d4c3b2a.mp3",
    energetic_electronic: "https://cdn.pixabay.com/download/audio/2022/06/09/audio_1a2b3c4d5e.mp3",
    dark_ambient: "https://cdn.pixabay.com/download/audio/2022/03/28/audio_6f7g8h9i0j.mp3",
    gentle_meditation: "https://cdn.pixabay.com/download/audio/2022/04/05/audio_0k1l2m3n4o.mp3",
};


// Helper: Cloudinary pe buffer upload karo
function uploadToCloudinary(buffer, options) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(options, (error, result) =>
                error ? reject(error) : resolve(result)
            )
            .end(buffer);
    });
}

export async function POST(req) {
    try {
        const auth = await requireAuth();
        if (!auth.authenticated) return auth.response;

        await connectDB();

        const body = await req.json();
        const { voiceId, voiceName, userText, duration, mood, settings } = body;

        const currentMood = mood?.toLowerCase() || "neutral";
        const moodDefaults = moodSettings[currentMood] || moodSettings.neutral;

        const userSpeed = settings?.speed ?? 50;
        const userStability = settings?.stability ?? moodDefaults.stability * 100;
        const userSimilarity = settings?.similarity ?? moodDefaults.similarity_boost * 100;
        const userStyleExag = settings?.styleExag ?? moodDefaults.style * 100;
        const userSpeakerBoost = settings?.speakerBoost ?? true;
        const targetDuration = settings?.duration || duration || 30;

        const finalStability = userStability / 100;
        const finalSimilarity = userSimilarity / 100;
        const finalStyle = userStyleExag / 100;
        const finalSpeed = 0.7 + (userSpeed / 100) * 0.5;

        // ── 1. GPT se script generate karo ──
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are the user's closest, most empathetic best friend. 
The user is sharing their feelings with you. 

User's Mood: ${currentMood}
User's Message: "${userText}"
Target Duration: ${targetDuration} seconds.

YOUR TASK:
1. **React like a Friend**: First, acknowledge what they said. If they are sad, be supportive. If they are angry, be on their side. If they are happy, celebrate with them.
2. **Mirror the Emotion**: Use a speaking style that matches their energy.
   - If they are HURT/SAD: Talk slowly, use "..." for pauses, and use comforting words like "I'm here for you," "It's okay to feel this way."
   - If they are ANGRY: Validate their frustration. "I totally get why you're mad, that's so unfair!!"
   - If they are EXCITED: Use high energy, shorter sentences, and exclamation marks like "Oh my god, that's AMAZING!!"
3. **Conversation Flow**: Don't sound like a robot or a guide. Sound like a human having a heart-to-heart conversation.
4. **Duration Control**: Keep the response length appropriate for ${targetDuration} seconds.

**CRITICAL FOR VOICE TONE**: 
- For deep emotions (sad/calm), use "..." frequently to slow down the AI.
- For high energy (happy/angry), use "!!" and ALL CAPS for emphasized words.

No intros like "Friend:" or "Response:". Just speak directly to them.`,
                },
            ],
        });

        const generatedScript = completion.choices[0].message.content;

        // ── 2. ElevenLabs se voice generate karo ──
        const elResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": process.env.ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text: generatedScript,
                    model_id: "eleven_turbo_v2_5",
                    voice_settings: {
                        stability: finalStability,
                        similarity_boost: finalSimilarity,
                        style: finalStyle,
                        use_speaker_boost: userSpeakerBoost,
                        speed: finalSpeed,
                    },
                }),
            }
        );

        if (!elResponse.ok) {
            const errText = await elResponse.text();
            throw new Error(`ElevenLabs failed: ${errText}`);
        }

        const voiceBuffer = Buffer.from(await elResponse.arrayBuffer());

        // ── 3. GPT se music category choose karo ──
        const musicCompletion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a music director. Based on the mood and content of a speech, pick the SINGLE best background music category.

Available categories:
- peaceful_piano (soft piano, ideal for calm/peaceful/relaxed/grateful moods)
- ambient_nature (birds, rain, wind, ocean sounds - ideal for meditation/thoughtful/nostalgic)
- soft_lofi (lo-fi beats, ideal for focused/curious/neutral moods)
- cinematic_emotional (orchestral/strings, ideal for sad/lonely/hurt/disappointed moods)
- upbeat_acoustic (light guitar/ukulele, ideal for happy/joyful/playful/proud moods)
- energetic_electronic (upbeat synths/drums, ideal for excited/energetic/confident moods)
- dark_ambient (deep drones/tension, ideal for angry/frustrated/aggressive/stressed moods)
- gentle_meditation (singing bowls/chimes, ideal for anxious/nervous/overwhelmed/exhausted moods)

Respond with ONLY the category name, nothing else.`,
                },
                {
                    role: "user",
                    content: `Mood: ${currentMood}\nSpeech content: ${generatedScript.substring(0, 300)}`,
                },
            ],
            max_tokens: 20,
        });

        const musicCategory = musicCompletion.choices[0].message.content.trim().toLowerCase();
        const bgMusicUrl = bgMusicMap[musicCategory] || bgMusicMap.peaceful_piano;

        // ── 4. Voice Cloudinary pe upload karo ──
        const voiceUpload = await uploadToCloudinary(voiceBuffer, {
            resource_type: "video",
            folder: "narrations/voice",
        });

        // ── 5. DB mein save karo ──
        const newNarration = await Narration.create({
            title: userText,
            script: generatedScript,
            voiceName: voiceName,
            audioUrl: voiceUpload.secure_url,       // Voice URL
            bgMusicUrl: bgMusicUrl,                  // BG Music URL (direct pixabay link)
            duration: voiceUpload.duration,
            mood: currentMood,
            bgMusicCategory: musicCategory,
            settings: {
                speed: userSpeed,
                stability: userStability,
                similarity: userSimilarity,
                styleExag: userStyleExag,
                speakerBoost: userSpeakerBoost,
                targetDuration: targetDuration,
            },
        });

        return NextResponse.json({ success: true, narration: newNarration });
    } catch (error) {
        console.error("Generation error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}