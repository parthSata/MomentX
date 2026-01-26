import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";

// ... (getChats and getMessages remain the same) ...
export const getChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const chats = await Chat.find({ participants: { $in: [currentUserId] } })
    .populate("participants", "name username profilePic isOnline")
    .sort({ lastMessageAt: -1 });

  const formattedChats = chats.map((chat) => {
    const otherParticipant = chat.participants.find(
      (p) => p._id.toString() !== currentUserId.toString()
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
    .json(new ApiResponse(200, formattedChats, "Chats fetched"));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const messages = await Message.find({ chatId })
    .populate("sender", "username profilePic")
    .sort({ createdAt: 1 });
  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched"));
});

export const uploadChatMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const localFilePath = req.file.path;
  const cloudResponse = await uploadInCloudinary(localFilePath);

  if (!cloudResponse) {
    throw new ApiError(500, "Failed to upload to cloud");
  }

  // Determine File Type
  let type = "image";
  if (req.file.mimetype.startsWith("video")) type = "video";
  else if (req.file.mimetype.startsWith("audio")) type = "audio";

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { url: cloudResponse.secure_url, type },
        "Upload successful"
      )
    );
});

// ✅ UPDATED: Send Message (Handles Text & Media)
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const { text, image, video, audio } = req.body; // Accept media fields
  const senderId = req.user._id;

  if (!text && !image && !video && !audio) {
    throw new ApiError(400, "Message content cannot be empty");
  }

  // 1. Find/Create Chat
  let chat = await Chat.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [senderId, receiverId],
      lastMessage: "Started a conversation",
      lastMessageAt: new Date(),
    });
  }

  // 2. Create Message
  const newMessage = await Message.create({
    chatId: chat._id,
    sender: senderId,
    text: text || "",
    image, // Save URL if present
    video,
    audio,
    seenBy: [senderId],
  });

  // 3. Update Chat Preview
  let previewText = text;
  if (image) previewText = "📷 Image";
  if (video) previewText = "🎥 Video";
  if (audio) previewText = "🎵 Audio";

  await Chat.findByIdAndUpdate(chat._id, {
    lastMessage: previewText,
    lastMessageAt: new Date(),
  });

  // 4. Socket Event
  if (req.io) {
    req.io.to(receiverId).emit("newMessage", newMessage);
  }

  return res.status(201).json(new ApiResponse(201, newMessage, "Message sent"));
});
// ✅ NEW: Delete Messages
export const deleteMessages = async (req, res) => {
  try {
    const { chatId, messageIds } = req.body;

    // Validate Input
    if (
      !chatId ||
      !messageIds ||
      !Array.isArray(messageIds) ||
      messageIds.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request data" });
    }


    // 1. Delete Messages
    const result = await Message.deleteMany({
      _id: { $in: messageIds },
      chatId: chatId, // Ensure you match the field name in your Schema (is it 'chatId' or 'chat'?)
    });

    // Note: Check your Message Model. If the field is named "chat", use "chat: chatId".
    // If it is "chatId", use "chatId: chatId".


    // 2. Update Latest Message (Optional but recommended)
    const latestMessage = await Message.findOne({ chatId: chatId }).sort({
      createdAt: -1,
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: latestMessage
        ? latestMessage.text || "Media"
        : "No messages",
      lastMessageAt: latestMessage ? latestMessage.createdAt : new Date(),
    });

    return res
      .status(200)
      .json({ success: true, message: "Messages deleted successfully" });
  } catch (error) {
    console.error("Delete messages error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body; // The user we want to chat with

  if (!userId) throw new ApiError(400, "UserId is required");

  // 1. Check if chat exists
  let chat = await Chat.findOne({
    isGroupChat: false,
    participants: { $all: [req.user._id, userId] },
  }).populate("participants", "-password");

  if (chat) {
    return res.status(200).json(new ApiResponse(200, chat, "Chat retrieved"));
  }

  // 2. Create new chat
  const newChat = await Chat.create({
    participants: [req.user._id, userId],
    isGroupChat: false,
    lastMessageAt: new Date(),
  });

  const fullChat = await Chat.findById(newChat._id).populate(
    "participants",
    "-password"
  );

  return res.status(201).json(new ApiResponse(201, fullChat, "Chat created"));
});
