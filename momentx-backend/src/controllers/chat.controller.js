import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadInCloudinary } from '../utils/cloudinary.js';
import { getOrCreatePrivateChat } from '../utils/chatUtils.js'; // ✅ Import Helper

export const getChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const chats = await Chat.find({ participants: { $in: [currentUserId] } })
    .populate('participants', 'name username profilePic isOnline')
    .sort({ lastMessageAt: -1 });

  const formattedChats = chats.map((chat) => {
    const otherParticipant = chat.participants.find(
      (p) => p._id.toString() !== currentUserId.toString(),
    );
    return {
      _id: chat._id,
      user: otherParticipant,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
    };
  });
  return res
    .status(200)
    .json(new ApiResponse(200, formattedChats, 'Chats fetched'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId })
    .populate('sender', 'username profilePic')
    .sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, messages, 'Messages fetched'));
});

export const uploadChatMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const localFilePath = req.file.path;
  const cloudResponse = await uploadInCloudinary(localFilePath);

  if (!cloudResponse) throw new ApiError(500, 'Failed to upload to cloud');

  let type = 'image';
  if (req.file.mimetype.startsWith('video')) type = 'video';
  else if (req.file.mimetype.startsWith('audio')) type = 'audio';

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { url: cloudResponse.secure_url, type },
        'Upload successful',
      ),
    );
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { text, image, video, audio } = req.body;
  const senderId = req.user._id;

  if (!text && !image && !video && !audio) {
    throw new ApiError(400, 'Message content cannot be empty');
  }

  const chat = await getOrCreatePrivateChat(senderId, receiverId);

  const newMessage = await Message.create({
    chatId: chat._id,
    sender: senderId,
    text: text || '',
    image,
    video,
    audio,
    seenBy: [senderId],
  });

  // Update Chat Metadata
  await Chat.findByIdAndUpdate(chat._id, {
    lastMessage: text || (image ? '📷 Image' : video ? '🎥 Video' : 'Media'),
    lastMessageAt: new Date(),
  });

  // ✅ FIX: Broadcast to room EXCEPT the sender to prevent local duplicates
  if (req.io) {
    req.io
      .to(chat._id.toString())
      .except(senderId.toString())
      .emit('newMessage', newMessage);
  }

  return res.status(201).json(new ApiResponse(201, newMessage, 'Message sent'));
});

export const deleteMessages = async (req, res) => {
  try {
    const { chatId, messageIds } = req.body;

    if (
      !chatId ||
      !messageIds ||
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid request data' });
    }

    await Message.deleteMany({ _id: { $in: messageIds }, chatId });

    const latestMessage = await Message.findOne({ chatId }).sort({
      createdAt: -1,
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: latestMessage
        ? latestMessage.text || (latestMessage.image ? '📷 Image' : 'Media')
        : 'No messages',
      lastMessageAt: latestMessage ? latestMessage.createdAt : new Date(),
    });

    return res
      .status(200)
      .json({ success: true, message: 'Messages deleted successfully' });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
};

export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (!userId) throw new ApiError(400, 'UserId is required');

  const chat = await getOrCreatePrivateChat(currentUserId, userId);

  const fullChat = await Chat.findById(chat._id).populate(
    'participants',
    'name username profilePic isOnline',
  );

  // ✅ Format the response to match getChats structure
  const otherParticipant = fullChat.participants.find(
    (p) => p._id.toString() !== currentUserId.toString(),
  );

  const formattedChat = {
    _id: fullChat._id,
    user: otherParticipant,
    lastMessage: fullChat.lastMessage,
    lastMessageAt: fullChat.lastMessageAt,
    participants: fullChat.participants, // keep this for utility
  };

  return res
    .status(200)
    .json(new ApiResponse(200, formattedChat, 'Chat ready'));
});

export const cleanDuplicateChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ isGroupChat: false });
  const seen = new Set();
  let deleted = 0;

  for (const chat of chats) {
    const pair = chat.participants
      .map((p) => p.toString())
      .sort()
      .join('-');
    if (seen.has(pair)) {
      await Chat.findByIdAndDelete(chat._id);
      await Message.deleteMany({ chatId: chat._id });
      deleted++;
    } else {
      seen.add(pair);
    }
  }
  return res
    .status(200)
    .json({ message: `Deleted ${deleted} duplicate chats.` });
});

export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, 'Chat not found');

  if (!chat.participants.includes(req.user._id)) {
    throw new ApiError(403, 'Not authorized to delete this chat');
  }

  await Chat.findByIdAndDelete(chatId);
  await Message.deleteMany({ chatId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Chat deleted successfully'));
});
