import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    // 🔗 Who created the report
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🎯 What is being reported
    targetType: {
      type: String,
      enum: ['post', 'comment', 'user'],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // 📝 Reason for reporting
    reason: {
      type: String,
      enum: [
        'spam',
        'hate',
        'nudity',
        'harassment',
        'violence',
        'misinformation',
        'other',
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // ⚙️ Moderation status
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'rejected'],
      default: 'pending',
      index: true,
    },

    // 🛡️ Admin action
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin user
    },

    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// 🔍 Useful indexes
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
