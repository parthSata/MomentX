import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    caption: {
      type: String,
      default: '',
    },

    images: [
      { type: String }, // Array of original image URLs
    ],

    thumbnails: [
      { type: String }, // Array of compressed (thumbnail) image URLs
    ],

    video: {
      type: String, // Optional video URL
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    hashtags: [{ type: String }],
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    location: {
      type: String,
      default: '',
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

// ✅ Named export to match the controller import { Post }
export const Post = mongoose.model('Post', postSchema);
