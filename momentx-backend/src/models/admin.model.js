import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['moderator', 'superadmin'],
      default: 'moderator',
    },
    permissions: [
      {
        type: String, // e.g., "manage_users", "delete_posts"
      },
    ],
  },
  { timestamps: true },
);

export const Admin = mongoose.model('Admin', adminSchema);
