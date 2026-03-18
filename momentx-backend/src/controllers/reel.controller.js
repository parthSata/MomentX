import { Reel } from '../models/reel.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadInCloudinary } from '../utils/cloudinary.js';
import { Comment } from '../models/comment.model.js';
import { sendNotification } from '../utils/Notification.js'; // ✅ IMPORTED NOTIFICATION UTILITY
import fs from 'fs';

// ✅ Create New Reel
export const createReel = asyncHandler(async (req, res) => {
  const { caption, hashtags, taggedUsers } = req.body; // Added taggedUsers
  const userId = req.user._id;

  if (!req.file) {
    throw new ApiError(400, 'Video file is required');
  }

  const cloudResponse = await uploadInCloudinary(req.file.path, 'video');

  let parsedHashtags = [];
  if (hashtags) {
    parsedHashtags = Array.isArray(hashtags) ? hashtags : hashtags.split(',');
  }

  // Handle Tagged Users
  let parsedTags = [];
  if (taggedUsers) {
    try {
      parsedTags =
        typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
    } catch (e) {
      console.warn('Could not parse taggedUsers', e);
    }
  }

  const newReel = await Reel.create({
    user: userId,
    videoUrl: cloudResponse.secure_url,
    thumbnailUrl: cloudResponse.secure_url
      .replace(/\.[^/.]+$/, '.jpg')
      .replace('/upload/', '/upload/c_fill,g_auto,w_500,h_888,q_auto,f_auto/'),
    caption,
    hashtags: parsedHashtags,
    taggedUsers: parsedTags, // Store tags in Reel
    duration: cloudResponse.duration,
  });

  // Send notifications to tagged users
  if (parsedTags.length > 0) {
    parsedTags.forEach((taggedUserId) => {
      sendNotification({
        req,
        receiverId: taggedUserId,
        type: 'mention',
        postId: newReel._id,
      });
    });
  }

  await User.findByIdAndUpdate(userId, { $push: { reels: newReel._id } });

  return res
    .status(201)
    .json(new ApiResponse(201, newReel, 'Reel posted successfully'));
});

// ✅ Get All Reels (Feed)
export const getReelsFeed = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Fetch raw reels
  const reels = await Reel.find()
    .populate('user', 'username name profilePic isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // ✅ Format reels to include isLiked, likes count, comments count
  const formattedReels = await Promise.all(
    reels.map(async (reel) => {
      const reelObj = reel.toObject();

      // Count comments for this reel
      const commentCount = await Comment.countDocuments({ reel: reelObj._id });

      // Check if current user liked it
      const isLiked = reelObj.likes.some(
        (id) => id.toString() === currentUserId.toString(),
      );

      return {
        ...reelObj,
        isLiked, // Boolean: keeps heart red
        likes: reelObj.likes.length, // Number: shows count
        commentsCount: commentCount, // Number: shows real comment count
        sharesCount: reelObj.sharesCount || 0,
        user: {
          ...reelObj.user,
          avatar: reelObj.user.profilePic, // Map profilePic to avatar for consistency
        },
      };
    }),
  );

  return res
    .status(200)
    .json(new ApiResponse(200, formattedReels, 'Reels feed fetched'));
});

// ✅ Like/Unlike Reel
export const toggleLikeReel = asyncHandler(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user._id;

  const reel = await Reel.findById(reelId);
  if (!reel) throw new ApiError(404, 'Reel not found');

  const isLiked = reel.likes.includes(userId);

  if (isLiked) {
    // Unlike
    await Reel.findByIdAndUpdate(reelId, { $pull: { likes: userId } });
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: false }, 'Reel unliked'));
  } else {
    // Like
    await Reel.findByIdAndUpdate(reelId, { $addToSet: { likes: userId } });

    // ✅ FIRED NOTIFICATION HERE
    await sendNotification({
      req,
      receiverId: reel.user, // The owner of the reel gets the notification
      type: 'like',
      reelId: reel._id, // Pass the reelId so the frontend knows it's a reel!
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, 'Reel liked'));
  }
});

export const getReelById = asyncHandler(async (req, res) => {
  const { reelId } = req.params;
  const currentUserId = req.user._id;

  const reel = await Reel.findById(reelId)
    .populate('user', 'username name profilePic isVerified')
    .lean();

  if (!reel) {
    throw new ApiError(404, 'Reel not found');
  }

  const commentCount = await Comment.countDocuments({ reel: reel._id });
  const isLiked = reel.likes.some(
    (id) => id.toString() === currentUserId.toString(),
  );

  const formattedReel = {
    ...reel,
    isLiked,
    likes: reel.likes.length,
    commentsCount: commentCount,
    sharesCount: reel.sharesCount || 0,
    user: {
      ...reel.user,
      avatar: reel.user.profilePic,
    },
  };

  return res
    .status(200)
    .json(new ApiResponse(200, formattedReel, 'Reel fetched successfully'));
});
