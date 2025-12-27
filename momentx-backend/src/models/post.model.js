import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  caption: { type: String, default: "" },

  images: [{ type: String }], // can contain multiple image URLs
  video: { type: String }, // optional video

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  hashtags: [{ type: String }],

  location: { type: String, default: "" },

}, { timestamps: true });

export default mongoose.model("Post", postSchema);
