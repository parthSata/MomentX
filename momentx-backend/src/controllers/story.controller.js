import { Story } from '../models/story.model.js';
import { User } from '../models/user.model.js';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import {
  uploadInCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import { sendNotification } from '../utils/Notification.js';
import { getOrCreatePrivateChat } from '../utils/chatUtils.js'; // ✅ Import Helper

export const createStory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = files.map(async (file) => {
      const localFilePath = file.path;
      const cloudResponse = await uploadInCloudinary(localFilePath);

      if (!cloudResponse) return null;

      const type = cloudResponse.resource_type === 'video' ? 'video' : 'image';

      const newStory = new Story({
        user: req.user._id,
        type: type,
        url: cloudResponse.secure_url,
        publicId: cloudResponse.public_id,
        viewers: [],
        likes: [],
      });

      await newStory.save();
      return newStory;
    });

    const results = await Promise.all(uploadPromises);
    const successfulStories = results.filter((s) => s !== null);

    if (successfulStories.length > 0) {
      await Story.populate(successfulStories, {
        path: 'user',
        select: 'username profilePic name',
      });
    }

    res.status(201).json({ success: true, data: successfulStories });
  } catch (error) {
    console.error('❌ Create Story Error:', error);
    res
      .status(500)
      .json({ message: 'Failed to create stories', error: error.message });
  }
};

export const getStories = async (req, res) => {
  try {
    const currentUserId = req.user?._id;

    // 1. Fetch the current user to get their 'following' list
    const currentUserDoc =
      await User.findById(currentUserId).select('following');
    const followingIds = currentUserDoc ? currentUserDoc.following : [];

    // 2. Create an array of valid IDs (User's own ID + Following IDs)
    const validUserIds = [...followingIds, currentUserId];

    // 3. Filter the query using the validUserIds array
    const stories = await Story.find({
      expiresAt: { $gt: new Date() },
      user: { $in: validUserIds },
    })
      .populate('user', 'username profilePic name')
      .populate('viewers.user', 'username profilePic name')
      .sort({ createdAt: -1 });

    const formattedStories = stories.map((story) => {
      const storyObj = story.toObject();
      
      // Ensure user has displayName
      if (storyObj.user && storyObj.user.name && !storyObj.user.displayName) {
        storyObj.user.displayName = storyObj.user.name;
      }
      
      // Ensure ALL viewers have displayName and profilePic/avatar consistently
      const formattedViewers = (storyObj.viewers || []).map((v) => {
        if (v.user) {
          return {
            ...v,
            user: {
              ...v.user,
              displayName: v.user.name || v.user.displayName || 'User',
              avatar: v.user.profilePic || v.user.avatar || '/image.png',
            }
          };
        }
        return v;
      });

      return {
        ...storyObj,
        isViewed: currentUserId
          ? storyObj.viewers.some(
              (v) => (v.user?._id || v.user)?.toString() === currentUserId.toString(),
            )
          : false,
        isLiked: currentUserId
          ? storyObj.likes?.some(
              (id) => id.toString() === currentUserId.toString(),
            )
          : false,
        viewers: formattedViewers,
        likes: storyObj.likes || [],
      };
    });

    res.status(200).json({ success: true, data: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const alreadyViewed = story.viewers.some(
      (v) => v.user.toString() === userId.toString(),
    );

    if (!alreadyViewed) {
      const newViewerEntry = {
        user: userId,
        viewedAt: new Date(),
      };

      story.viewers.push(newViewerEntry);
      await story.save();

      const viewerDataForSocket = {
        user: {
          _id: req.user._id.toString(),
          username: req.user.username,
          displayName: req.user.name || req.user.displayName || '',
          avatar: req.user.profilePic || req.user.avatar || '',
          profilePic: req.user.profilePic || req.user.avatar || '',
        },
        viewedAt: newViewerEntry.viewedAt,
      };

      if (req.io) {
        req.io.to(story.user.toString()).emit('story_view_updated', {
          storyId: story._id.toString(),
          newViewer: viewerDataForSocket,
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const likeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findById(id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (!story.likes) story.likes = [];

    // ✅ CRITICAL FIX: Convert ObjectIds to Strings for comparison
    const isLiked = story.likes.some(
      (likeId) => likeId.toString() === userId.toString(),
    );

    if (isLiked) {
      // Unlike: Filter out string matches
      story.likes = story.likes.filter(
        (likeId) => likeId.toString() !== userId.toString(),
      );
    } else {
      // Like
      story.likes.push(userId);

      // Send Notification
      await sendNotification({
        req,
        receiverId: story.user,
        type: 'like',
        story: story._id, // Links notification to story
        postId: null,
      });
    }

    await story.save();

    return res.status(200).json({
      success: true,
      isLiked: !isLiked,
      likesCount: story.likes.length,
    });
  } catch (error) {
    console.error('Like Story Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const replyStory = async (req, res) => {
  try {
    const { id } = req.params; // Story ID
    const { message } = req.body;
    const senderId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const story = await Story.findById(id).populate('user');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const receiverId = story.user._id;

    // ✅ STEP 1: Get existing chat safely (Prevents Overwriting)
    const chat = await getOrCreatePrivateChat(senderId, receiverId);

    // ✅ STEP 2: Create Message linked to that chat
    const newMessage = await Message.create({
      chatId: chat._id,
      sender: senderId,
      text: message,
      seenBy: [senderId],
      storyReply: {
        storyId: story._id,
        storyUrl: story.url,
        storyType: story.type,
      },
    });

    // ✅ STEP 3: Update Chat Metadata
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: `Replied to story: ${message.substring(0, 30)}...`,
      lastMessageAt: new Date(),
    });

    // ✅ STEP 4: Real-time Socket
    if (req.io) {
      req.io.to(receiverId.toString()).emit('newMessage', newMessage);
    }

    return res.status(200).json({ success: true, message: 'Reply sent' });
  } catch (error) {
    console.error('Reply Story Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { publicId, type } = story;

    // Delete from DB first
    await story.deleteOne();

    // Respond immediately to be "fast"
    res.status(200).json({ success: true, message: 'Story deleted from database' });

    // Cleanup Cloudinary in the "background" (no await on the final response)
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId, type);
      } catch (cloudinaryError) {
        console.error('Cloudinary Cleanup Error:', cloudinaryError);
      }
    }
  } catch (error) {
    console.error('Delete Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
