import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const bgMusicDir = path.join(process.cwd(), "public", "bgMusic");
        
        // Check if directory exists
        if (!fs.existsSync(bgMusicDir)) {
            return NextResponse.json({ 
                success: true, 
                tracks: [],
                message: "No background music folder found" 
            });
        }

        // Read all files from the directory
        const files = fs.readdirSync(bgMusicDir);
        
        // Filter only audio files and create track objects
        const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"];
        const tracks = files
            .filter(file => audioExtensions.some(ext => file.toLowerCase().endsWith(ext)))
            .map((file, index) => {
                // Extract a cleaner name from the filename
                const nameWithoutExt = file.replace(/\.[^/.]+$/, "");
                const cleanName = nameWithoutExt
                    .split(/[-_]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(" ")
                    .replace(/\s+\d+$/, "") // Remove trailing numbers
                    .trim();

                return {
                    id: `bg-track-${index + 1}`,
                    name: cleanName,
                    filename: file,
                    url: `/bgMusic/${file}`,
                    category: categorizeTrack(nameWithoutExt)
                };
            });

        return NextResponse.json({ 
            success: true, 
            tracks 
        });

    } catch (error) {
        console.error("Error reading background music:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Helper function to categorize tracks based on filename
function categorizeTrack(filename) {
    const lower = filename.toLowerCase();
    
    if (lower.includes("calm") || lower.includes("peaceful") || lower.includes("relax")) {
        return "Calm";
    }
    if (lower.includes("epic") || lower.includes("cinematic") || lower.includes("inspirational")) {
        return "Cinematic";
    }
    if (lower.includes("happy") || lower.includes("upbeat") || lower.includes("joy")) {
        return "Upbeat";
    }
    if (lower.includes("sad") || lower.includes("emotional") || lower.includes("romantic")) {
        return "Emotional";
    }
    if (lower.includes("dark") || lower.includes("mystery") || lower.includes("ghost") || lower.includes("halloween")) {
        return "Dark";
    }
    if (lower.includes("electronic") || lower.includes("house") || lower.includes("beat")) {
        return "Electronic";
    }
    if (lower.includes("flute") || lower.includes("acoustic") || lower.includes("country")) {
        return "Acoustic";
    }
    if (lower.includes("meditation") || lower.includes("ambient") || lower.includes("nature")) {
        return "Meditation";
    }
    
    return "General";
}
