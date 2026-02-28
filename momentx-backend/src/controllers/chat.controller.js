import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadInCloudinary } from '../utils/cloudinary.js';
import { getOrCreatePrivateChat } from '../utils/chatUtils.js';

export const getChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const chats = await Chat.find({ participants: { $in: [currentUserId] } })
    .populate('participants', 'name username profilePic isOnline')
    .sort({ lastMessageAt: -1 });

  const formattedChats = await Promise.all(
    chats.map(async (chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p._id.toString() !== currentUserId.toString(),
      );
      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        seenBy: { $ne: currentUserId },
      });
      return {
        _id: chat._id,
        user: otherParticipant,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount: unreadCount || 0,
      };
    }),
  );

  return res
    .status(200)
    .json(new ApiResponse(200, formattedChats, 'Chats fetched'));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user._id;

  const messages = await Message.find({ chatId })
    .populate('sender', 'username profilePic')
    .sort({ createdAt: 1 });

  await Message.updateMany(
    { chatId, seenBy: { $ne: currentUserId } },
    { $addToSet: { seenBy: currentUserId } },
  );

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
  const { text, image, video, audio, sharedPost } = req.body; // ✅ Added sharedPost
  const senderId = req.user._id;

  if (!text && !image && !video && !audio && !sharedPost)
    throw new ApiError(400, 'Message cannot be empty');

  // 1. Get Chat
  const chat = await getOrCreatePrivateChat(senderId, receiverId);

  // 2. Create Message
  const newMessage = await Message.create({
    chatId: chat._id,
    sender: senderId,
    text: text || '',
    image,
    video,
    audio,
    sharedPost, // ✅ Save shared content
    seenBy: [senderId],
  });

  // 3. Update Chat Last Message
  const previewText =
    text ||
    (sharedPost
      ? `Shared a ${sharedPost.type}`
      : image
        ? '📷 Image'
        : video
          ? '🎥 Video'
          : '🎵 Audio');

  await Chat.findByIdAndUpdate(chat._id, {
    lastMessage: previewText,
    lastMessageAt: new Date(),
  });

  // 4. EMIT TO PARTICIPANTS (User Rooms)
  if (req.io) {
    chat.participants.forEach((participantId) => {
      req.io.to(participantId.toString()).emit('newMessage', newMessage);
    });
  }

  // ✅ Important: Populate the sender so the frontend doesn't crash on newly sent messages
  await newMessage.populate('sender', 'username profilePic name');

  return res.status(201).json(new ApiResponse(201, newMessage, 'Message sent'));
});

export const deleteMessages = async (req, res) => {
  try {
    const { chatId, messageIds } = req.body;
    if (!chatId || !messageIds?.length)
      return res.status(400).json({ success: false });

    await Message.deleteMany({ _id: { $in: messageIds }, chatId });

    const latestMessage = await Message.findOne({ chatId }).sort({
      createdAt: -1,
    });
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: latestMessage
        ? latestMessage.text || 'Media'
        : 'No messages',
      lastMessageAt: latestMessage ? latestMessage.createdAt : new Date(),
    });

    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error' });
  }
};

export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) throw new ApiError(400, 'UserId is required');

  const chat = await getOrCreatePrivateChat(req.user._id, userId);

  const fullChat = await Chat.findById(chat._id).populate(
    'participants',
    'name username profilePic isOnline',
  );
  const otherParticipant = fullChat.participants.find(
    (p) => p._id.toString() !== req.user._id.toString(),
  );

  const formattedChat = {
    _id: fullChat._id,
    user: otherParticipant,
    lastMessage: fullChat.lastMessage,
    lastMessageAt: fullChat.lastMessageAt,
    unreadCount: 0,
    participants: fullChat.participants,
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
  if (!chat.participants.includes(req.user._id))
    throw new ApiError(403, 'Not authorized');
  await Chat.findByIdAndDelete(chatId);
  await Message.deleteMany({ chatId });
  return res.status(200).json(new ApiResponse(200, {}, 'Chat deleted'));
});
