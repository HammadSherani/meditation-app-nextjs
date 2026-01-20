import mongoose from "mongoose";

const NarrationSchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  script: { type: String, required: true }, 
  voiceName: { type: String }, 
  audioUrl: { type: String, required: true }, 
  duration: { type: String },
  mood: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Narration || mongoose.model("Narration", NarrationSchema);