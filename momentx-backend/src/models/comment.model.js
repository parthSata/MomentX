import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // ✅ FIX: Set required to false so it accepts Reels too
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: false, 
    },
    // ✅ Ensure Reel field exists and is optional
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reel",
      required: false, 
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { 
      type: String, 
      required: true 
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);