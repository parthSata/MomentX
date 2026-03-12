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
      let otherParticipant = null;

      if (!chat.isGroupChat) {
        otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== currentUserId.toString(),
        );
      }

      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        seenBy: { $ne: currentUserId },
      });

      return {
        _id: chat._id,
        isGroupChat: chat.isGroupChat,
        groupName: chat.groupName,
        groupAvatar: chat.groupAvatar, // assuming you have this or it's returned
        user: otherParticipant, // Will be null for group chats
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        unreadCount: unreadCount || 0,
        participants: chat.participants, // Include participants for group chats
        groupAdmins: chat.groupAdmins // Include admins for group chats
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
  const { text, image, video, audio, sharedPost } = req.body;
  const senderId = req.user._id;

  if (!text && !image && !video && !audio && !sharedPost)
    throw new ApiError(400, 'Message cannot be empty');

  // 1. Get Chat (Handles both Group Chats and Direct Messages)
  let chat = await Chat.findById(receiverId).catch(() => null);
  
  if (!chat) {
    chat = await getOrCreatePrivateChat(senderId, receiverId);
  }

  // 2. Create Message
  const newMessage = await Message.create({
    chatId: chat._id,
    sender: senderId,
    text: text || '',
    image,
    video,
    audio,
    sharedPost,
    seenBy: [senderId],
  });

  const previewText =
    text ||
    (sharedPost
      ? `Shared a ${sharedPost.type}`
      : image
        ? '📷 Image'
        : video
          ? '🎥 Video'
          : audio
            ? '🎵 Audio'
            : 'Media');

  await Chat.findByIdAndUpdate(chat._id, {
    lastMessage: previewText,
    lastMessageAt: new Date(),
  });

  await newMessage.populate('sender', 'username profilePic name');

  // 4. EMIT TO PARTICIPANTS
  if (req.io) {
    chat.participants.forEach((participantId) => {
      req.io.to(participantId.toString()).emit('newMessage', newMessage);
    });
  }

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

export const createGroupChat = asyncHandler(async (req, res) => {
  const { name, participants } = req.body; // participants is an array of IDs
  const adminId = req.user._id;

  if (!name || !participants || participants.length < 1) {
    throw new ApiError(400, 'Group name and at least one member required');
  }

  // Add current user to participants if not already there
  const allParticipants = [...new Set([...participants, adminId.toString()])];

  const chat = await Chat.create({
    groupName: name,
    participants: allParticipants,
    isGroupChat: true,
    groupAdmins: [adminId],
    lastMessage: 'Group created',
  });

  const fullGroupChat = await Chat.findById(chat._id)
    .populate('participants', 'name username profilePic isOnline')
    .populate('groupAdmins', 'name username');

  return res
    .status(201)
    .json(new ApiResponse(201, fullGroupChat, 'Group created'));
});

// ✅ ADD/REMOVE MEMBERS
export const updateGroupMembers = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId, action } = req.body; // action: 'add' or 'remove'

  const chat = await Chat.findById(chatId);
  if (!chat.groupAdmins.includes(req.user._id)) {
    throw new ApiError(403, 'Only admins can manage members');
  }

  const update =
    action === 'add'
      ? { $addToSet: { participants: userId } }
      : { $pull: { participants: userId, groupAdmins: userId } };

  const updatedChat = await Chat.findByIdAndUpdate(chatId, update, {
    new: true,
  }).populate('participants', 'name username profilePic isOnline');

  return res
    .status(200)
    .json(new ApiResponse(200, updatedChat, 'Members updated'));
});

export const updateGroupDetails = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { groupName } = req.body;
  
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.isGroupChat) {
    throw new ApiError(404, 'Group chat not found');
  }

  if (!chat.groupAdmins.includes(req.user._id)) {
    throw new ApiError(403, 'Only admins can update group details');
  }

  const updates = {};
  if (groupName) updates.groupName = groupName;
  
  if (req.file) {
    const cloudResponse = await uploadInCloudinary(req.file.path);
    if (!cloudResponse) throw new ApiError(500, 'Failed to upload group avatar');
    updates.groupAvatar = cloudResponse.secure_url;
  }

  const updatedChat = await Chat.findByIdAndUpdate(chatId, updates, { new: true })
    .populate('participants', 'name username profilePic isOnline')
    .populate('groupAdmins', 'name username profilePic');

  return res.status(200).json(new ApiResponse(200, updatedChat, 'Group details updated'));
});

export const getGroupInfo = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate('participants', 'name username profilePic isOnline')
    .populate('groupAdmins', 'name username profilePic');

  if (!chat || !chat.isGroupChat) {
    throw new ApiError(404, 'Group chat not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, chat, 'Group info fetched successfully'));
});

// ✅ TOGGLE ADMIN STATUS
export const toggleGroupAdmin = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;
  const chat = await Chat.findById(chatId);

  if (!chat.groupAdmins.includes(req.user._id))
    throw new ApiError(403, 'Admin only');

  const isAdmin = chat.groupAdmins.includes(userId);
  const update = isAdmin
    ? { $pull: { groupAdmins: userId } }
    : { $addToSet: { groupAdmins: userId } };

  await Chat.findByIdAndUpdate(chatId, update);
  return res.status(200).json(new ApiResponse(200, {}, 'Admin status updated'));
});

// ✅ LEAVE GROUP
export const leaveGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat || !chat.isGroupChat) {
    throw new ApiError(404, 'Group chat not found');
  }

  // Remove user from participants and groupAdmins
  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { participants: userId, groupAdmins: userId },
    },
    { new: true },
  );

  // If the group has no participants left, we could optionally delete it
  if (updatedChat.participants.length === 0) {
    await Chat.findByIdAndDelete(chatId);
    await Message.deleteMany({ chatId });
    return res.status(200).json(new ApiResponse(200, {}, 'Left and group deleted as no members left'));
  }

  // If the user was an admin and was the last admin, assign admin to someone else if possible
  if (chat.groupAdmins.includes(userId) && updatedChat.groupAdmins.length === 0 && updatedChat.participants.length > 0) {
    const nextAdminId = updatedChat.participants[0];
    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: { groupAdmins: nextAdminId }
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Left the group successfully'));
});

// ✅ CLEAR ALL MESSAGES
export const clearChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  const chat = await Chat.findById(chatId);
  if (!chat) throw new ApiError(404, 'Chat not found');

  if (!chat.participants.includes(userId)) {
    throw new ApiError(403, 'You are not a participant of this chat');
  }

  // Delete all messages in this chat
  await Message.deleteMany({ chatId });

  // Update last message
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: 'Messages cleared',
    lastMessageAt: new Date(),
  });

  return res.status(200).json(new ApiResponse(200, {}, 'Chat cleared successfully'));
});
