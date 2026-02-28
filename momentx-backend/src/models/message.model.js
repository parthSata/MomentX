import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ✅ ADDED: Schema for Shared Posts/Reels
    sharedPost: {
      type: { type: String, enum: ['post', 'reel'] },
      postId: { type: mongoose.Schema.Types.ObjectId },
      thumbnail: String,
      username: String,
      userAvatar: String,
      caption: String,
    },

    text: { type: String },
    image: { type: String },
    video: { type: String },
    audio: { type: String },

    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    storyReply: {
      storyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
      storyUrl: String,
      storyType: String,
    },
  },
  { timestamps: true },
);

export default mongoose.model('Message', messageSchema);
