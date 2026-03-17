import mongoose from 'mongoose';

const visitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      trim: true,
    },
    path: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance on stats
visitLogSchema.index({ createdAt: -1 });
visitLogSchema.index({ user: 1 });

export const VisitLog = mongoose.model('VisitLog', visitLogSchema);
