import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String }, // Optional: Auto-generated thumbnail from Cloudinary
    caption: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    hashtags: [{ type: String }],
    isHidden: { type: Boolean, default: false },
    sharesCount: { type: Number, default: 0 },
    duration: { type: Number }, // Video duration in seconds
  },
  { timestamps: true },
);

export const Reel = mongoose.model('Reel', reelSchema);
