import Chat from '../models/chat.model.js';
import mongoose from 'mongoose';

export const getOrCreatePrivateChat = async (userId1, userId2) => {
  const user1 = new mongoose.Types.ObjectId(userId1);
  const user2 = new mongoose.Types.ObjectId(userId2);

  let chat = await Chat.findOne({
    participants: { $all: [user1, user2], $size: 2 },
    $or: [
      { isGroupChat: false },
      { isGroupChat: { $exists: false } },
      { isGroupChat: null },
    ],
  });

  // If absolutely no chat exists, create one
  if (!chat) {
    chat = await Chat.create({
      participants: [user1, user2],
      isGroupChat: false,
      lastMessageAt: new Date(),
    });
  }

  return chat;
};
