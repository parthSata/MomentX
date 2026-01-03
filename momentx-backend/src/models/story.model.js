import mongoose, { Schema } from "mongoose";

const storySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String, // Cloudinary URL
      required: true,
    },
    publicId: {
      type: String, // ✅ REQUIRED for deleting from Cloudinary
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    viewers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // We removed the TTL index to handle cleanup manually via Cron
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: true,
  }
);

export const Story = mongoose.model("Story", storySchema);
