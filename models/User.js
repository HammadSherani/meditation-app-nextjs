import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  profileImage: String, // Yahan Cloudinary ka URL save hoga
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);