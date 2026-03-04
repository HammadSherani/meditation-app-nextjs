import mongoose from "mongoose";

const NarrationSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  script: { type: String, required: true }, 
  voiceName: { type: String }, 
  audioUrl: { type: String, required: true }, 
  // duration: { type: String },
  mood: { type: String },
  bgMusicUrl: { type: String },
  bgMusicCategory: { type: String },
  settings: {
    speed: { type: Number, default: 50 },
    stability: { type: Number, default: 80 },
    similarity: { type: Number, default: 90 },
    styleExag: { type: Number, default: 0 },
    speakerBoost: { type: Boolean, default: true },
    targetDuration: { type: Number, default: 30 },
  },
  createdAt: { type: Date, default: Date.now }
});

// ⭐ Purana cached model delete karo
if (mongoose.models.Narration) {
  delete mongoose.models.Narration;
}

export default mongoose.models.Narration || mongoose.model("Narration", NarrationSchema);