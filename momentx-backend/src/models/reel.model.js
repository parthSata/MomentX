import mongoose from "mongoose";

const reelSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  videoUrl: { type: String, required: true },
  caption: { type: String, default: "" },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  commentsCount: { type: Number, default: 0 },

  hashtags: [{ type: String }],

}, { timestamps: true });

export default mongoose.model("Reel", reelSchema);
