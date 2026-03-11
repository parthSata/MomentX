import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // ✅ Group Chat Fields
    isGroupChat: { type: Boolean, default: false },
    groupName: { type: String, trim: true },
    groupAvatar: { type: String, default: '' },
    groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model('Chat', chatSchema);
