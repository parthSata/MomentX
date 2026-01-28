import { Post } from "../models/post.model.js";
import { Reel } from "../models/reel.model.js"; // ✅ Import Reel Model
import { User } from "../models/user.model.js"; // Ensure User is imported
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// --- 1. Get Combined Explore Grid (Posts + Reels) ---
const getExplorePosts = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const sampleSize = parseInt(limit);

  // --- Pipeline for Standard Posts ---
  const postPipeline = [
    { $sample: { size: sampleSize } },
    
    // 1. Lookup User
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
        pipeline: [{ $project: { username: 1, profilePic: 1 } }]
      }
    },
    { $unwind: "$userInfo" },

    // 2. ✅ FIX: Lookup Comments to get real count
    {
      $lookup: {
        from: "comments", // Collection name in MongoDB (lowercase plural)
        localField: "_id",
        foreignField: "post", // Field in Comment model
        as: "postComments"
      }
    },

    // 3. Project
    {
      $project: {
        _id: 1,
        id: "$_id",
        caption: 1,
        likes: { $size: { $ifNull: ["$likes", []] } },
        comments: { $size: "$postComments" }, // ✅ Count size of looked-up comments
        user: "$userInfo",
        image: { $ifNull: [{ $arrayElemAt: ["$images", 0] }, ""] }, 
        videoUrl: "",
        type: "post"
      }
    }
  ];

  // --- Pipeline for Reels ---
  const reelPipeline = [
    { $sample: { size: sampleSize } },

    // 1. Lookup User
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
        pipeline: [{ $project: { username: 1, profilePic: 1 } }]
      }
    },
    { $unwind: "$userInfo" },

    // 2. ✅ FIX: Lookup Comments for Reels
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "reel", // Field in Comment model
        as: "reelComments"
      }
    },

    // 3. Project
    {
      $project: {
        _id: 1,
        id: "$_id",
        caption: 1, 
        likes: { $size: { $ifNull: ["$likes", []] } },
        comments: { $size: "$reelComments" }, // ✅ Count size of looked-up comments
        user: "$userInfo",
        image: "$thumbnailUrl", 
        videoUrl: "$videoUrl",
        type: "reel"
      }
    }
  ];

  // ✅ Run both queries in parallel
  const [posts, reels] = await Promise.all([
    Post.aggregate(postPipeline),
    Reel.aggregate(reelPipeline)
  ]);

  // ✅ Combine and Shuffle
  const combinedFeed = [...posts, ...reels]
    .sort(() => Math.random() - 0.5) 
    .slice(0, sampleSize); 

  return res
    .status(200)
    .json(new ApiResponse(200, combinedFeed, "Explore feed fetched"));
});

// --- 2. Get Suggested Profiles (Unchanged) ---
const getSuggestedUsers = asyncHandler(async (req, res) => {
  // ... (Keep your existing code here)
  const currentUserId = req.user._id;
  const currentUser = await User.findById(currentUserId).select("following");
  const followingIds = currentUser.following.map((id) => id.toString());
  followingIds.push(currentUserId.toString());

  const suggestions = await User.aggregate([
    { $match: { _id: { $nin: followingIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $sample: { size: 10 } },
    {
      $project: {
        _id: 1,
        username: 1,
        displayName: "$name",
        avatar: "$profilePic",
        followers: { $size: "$followers" },
      },
    },
  ]);
  return res.status(200).json(new ApiResponse(200, suggestions, "Suggested users fetched"));
});

// --- 3. Get Trending Hashtags (Unchanged) ---
const getTrendingHashtags = asyncHandler(async (req, res) => {
  // ... (Keep your existing code here)
  const trending = await Post.aggregate([
    { $unwind: "$hashtags" },
    {
      $group: {
        _id: "$hashtags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        tag: "$_id",
        posts: "$count",
      },
    },
  ]);
  return res.status(200).json(new ApiResponse(200, trending, "Trending hashtags fetched"));
});

export { getExplorePosts, getSuggestedUsers, getTrendingHashtags };