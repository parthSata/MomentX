import { Reel } from "../models/reel.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js"; // ✅ Import Comment
import fs from "fs";

// ✅ Create New Reel
export const createReel = asyncHandler(async (req, res) => {
  const { caption, hashtags } = req.body;
  const userId = req.user._id;

  // 1. Check for video file
  if (!req.file) {
    throw new ApiError(400, "Video file is required");
  }

  const localFilePath = req.file.path;

  // 2. Upload to Cloudinary (Video)
  // We need to tell Cloudinary this is a video
  const cloudResponse = await uploadInCloudinary(localFilePath, "video");

  if (!cloudResponse || !cloudResponse.secure_url) {
    throw new ApiError(500, "Failed to upload video to cloud");
  }

  // 3. Process Hashtags
  let parsedHashtags = [];
  if (hashtags) {
    // If sent as JSON string array or comma separated
    parsedHashtags = Array.isArray(hashtags) 
      ? hashtags 
      : hashtags.split(",").map(tag => tag.trim().replace(/^#/, ""));
  }

  // 4. Create Reel in DB
  const newReel = await Reel.create({
    user: userId,
    videoUrl: cloudResponse.secure_url,
    thumbnailUrl: cloudResponse.eager ? cloudResponse.eager[0].secure_url : cloudResponse.secure_url.replace(/\.[^/.]+$/, ".jpg"), // Simple thumbnail logic
    caption,
    hashtags: parsedHashtags,
    duration: cloudResponse.duration,
  });

  // 5. Update User's Reel Count (Optional)
  await User.findByIdAndUpdate(userId, { $push: { reels: newReel._id } });

  return res
    .status(201)
    .json(new ApiResponse(201, newReel, "Reel posted successfully"));
});

// ✅ Get All Reels (Feed)
export const getReelsFeed = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Fetch raw reels
  const reels = await Reel.find()
    .populate("user", "username name profilePic isVerified")
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
      const isLiked = reelObj.likes.some((id) => id.toString() === currentUserId.toString());

      return {
        ...reelObj,
        isLiked, // Boolean: keeps heart red
        likes: reelObj.likes.length, // Number: shows count
        commentsCount: commentCount, // Number: shows real comment count
        sharesCount: reelObj.sharesCount || 0,
        user: {
            ...reelObj.user,
            avatar: reelObj.user.profilePic // Map profilePic to avatar for consistency
        }
      };  
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, formattedReels, "Reels feed fetched"));
});

// ✅ Like/Unlike Reel
export const toggleLikeReel = asyncHandler(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user._id;

  const reel = await Reel.findById(reelId);
  if (!reel) throw new ApiError(404, "Reel not found");

  const isLiked = reel.likes.includes(userId);

  if (isLiked) {
    // Unlike
    await Reel.findByIdAndUpdate(reelId, { $pull: { likes: userId } });
    return res.status(200).json(new ApiResponse(200, { liked: false }, "Reel unliked"));
  } else {
    // Like
    await Reel.findByIdAndUpdate(reelId, { $addToSet: { likes: userId } });
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Reel liked"));
  }
});