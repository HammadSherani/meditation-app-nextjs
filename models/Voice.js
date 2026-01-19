import mongoose from "mongoose";

const VoiceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Voice name is required"],
    trim: true 
  },
  voice_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  voiceUrl: {
    type: String,
    required: [true, "Voice URL is required"]
  },
  metadata: {
    duration: { type: Number, default: 0 }, 
    fileSize: { type: Number, default: 0 }, 
    format: { type: String, default: "wav" }, 
    sampleRate: { type: Number, default: 44100 },
    quality: { type: String, default: "high" }
  },
  userId: {
    type: String,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.models.Voice || mongoose.model("Voice", VoiceSchema);