import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  type: { 
    type: String, 
    enum: ["image", "video"], 
    required: true 
  },

  url: { type: String, required: true },

  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  expiresAt: { type: Date, required: true }, // set +24h on creation

}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story =  mongoose.model("Story", storySchema);
