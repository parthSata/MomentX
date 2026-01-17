import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: { type: String },
    image: { type: String },
    video: { type: String },
    audio: { type: String },

    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    storyReply: {
      storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story" },
      storyUrl: String,
      storyType: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
