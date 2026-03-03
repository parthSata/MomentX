import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // notification receiver

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'message', 'mention', 'story_view'],
      required: true,
    },

    // ✅ Added Story Reference
    story: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    reel: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel' }, // ✅ ADDED REEL REFERENCE
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Notification', notificationSchema);
