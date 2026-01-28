import { Post } from "../models/post.model.js";
import { Reel } from "../models/reel.model.js"; // ✅ Ensure this path is correct
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { sendNotification } from "../utils/Notification.js";

// --- HELPER: Format Posts & Reels ---
const formatPosts = async (posts, currentUserId) => {
  const currentUser = await User.findById(currentUserId).select("savedPosts");
  const savedPostIds = currentUser?.savedPosts.map((id) => id.toString()) || [];

  return await Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject ? post.toObject() : post;
      
      // Count comments (Check both 'post' and 'reel' fields)
      const commentCount = await Comment.countDocuments({ 
          $or: [{ post: postObj._id }, { reel: postObj._id }] 
      });

      return {
        ...postObj,
        _id: postObj._id,
        // ✅ FIX USER MAPPING
        user: {
          _id: postObj.user?._id || postObj.user,
          username: postObj.user?.username || "Unknown",
          name: postObj.user?.name || "Unknown", // Added Name
          profilePic: postObj.user?.profilePic || "", 
          avatar: postObj.user?.profilePic || "", 
          isVerified: postObj.user?.isVerified || false,
        },
        // ✅ Handle Reel Fields
        videoUrl: postObj.videoUrl || "",
        thumbnailUrl: postObj.thumbnailUrl || "",
        // If it's a reel without 'images', use thumbnail as the first image
        images: postObj.images?.length > 0 ? postObj.images : (postObj.thumbnailUrl ? [postObj.thumbnailUrl] : []),
        
        isLiked: postObj.likes.some(
          (id) => id.toString() === currentUserId.toString()
        ),
        isSaved: savedPostIds.includes(postObj._id.toString()),
        likes: postObj.likes.length,
        commentsCount: commentCount, 
        comments: commentCount, 
      };
    })
  );
};

// --- 1. CREATE POST ---
const createPost = asyncHandler(async (req, res) => {
  const { caption, location, taggedUsers } = req.body;
  const userId = req.user._id;

  if (!req.files?.images || req.files.images.length === 0) {
    throw new ApiError(400, "Please upload at least one image");
  }

  const imagesLocalPaths = req.files.images.map((file) => file.path);
  const imageUrls = [];
  for (const path of imagesLocalPaths) {
    const uploaded = await uploadInCloudinary(path);
    if (uploaded) imageUrls.push(uploaded.secure_url);
  }

  const hashtags = caption.match(/#[a-z0-9_]+/gi) || [];
  let parsedTags = [];
  if (taggedUsers) {
    try {
      parsedTags = typeof taggedUsers === "string" ? JSON.parse(taggedUsers) : taggedUsers;
    } catch (e) {
      console.warn("Could not parse taggedUsers", e);
    }
  }

  const post = await Post.create({
    user: userId,
    caption,
    images: imageUrls,
    location,
    hashtags,
    taggedUsers: parsedTags,
    likes: [],
  });

  await User.findByIdAndUpdate(userId, { $inc: { posts: 1 } });

  if (parsedTags.length > 0) {
    parsedTags.forEach((taggedUserId) => {
      sendNotification({
        req,
        receiverId: taggedUserId,
        type: "mention",
        postId: post._id,
      });
    });
  }

  return res.status(201).json(new ApiResponse(201, post, "Post created successfully"));
});

// --- 2. GET FEED ---
const getHomeFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Increased limit
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

  // You might want to mix Reels into the feed here later
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate("user", "username name profilePic isVerified")
    .populate("taggedUsers", "username");

  const formattedPosts = await formatPosts(posts, currentUserId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: formattedPosts,
        currentPage: parseInt(page),
        hasMore: posts.length === parseInt(limit),
      },
      "Feed fetched successfully"
    )
  );
});

// --- 3. GET USER POSTS & REELS (Profile) ---
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID format");
  }

  // 1. Fetch Posts with User details
  const posts = await Post.find({ user: userId })
    .populate("user", "username name profilePic isVerified") // ✅ Populate Post User
    .sort({ createdAt: -1 });
  
  // 2. Fetch Reels with User details
  // ✅ FIX: Added .populate() here so Reel user data is not null/buffer
  const reels = await Reel.find({ user: userId })
    .populate("user", "username name profilePic isVerified") // ✅ Populate Reel User
    .sort({ createdAt: -1 });

  // 3. Combine
  const allContent = [...posts, ...reels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const formattedPosts = await formatPosts(allContent, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, "User posts and reels fetched"));
});

// --- 4. GET SAVED POSTS ---
const getUserSavedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new ApiError(400, "Invalid User ID");

  const user = await User.findById(userId).populate({
    path: "savedPosts",
    options: { sort: { createdAt: -1 } },
    populate: { path: "user", select: "username name profilePic isVerified" },
  });

  if (!user) throw new ApiError(404, "User not found");

  const formattedPosts = await formatPosts(user.savedPosts, currentUserId);

  return res.status(200).json(new ApiResponse(200, formattedPosts, "Saved posts fetched"));
});

// --- 5. GET TAGGED POSTS ---
const getUserTaggedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const posts = await Post.find({ taggedUsers: userId })
    .populate("user", "username name profilePic isVerified")
    .sort({ createdAt: -1 });

  const formattedPosts = await formatPosts(posts, currentUserId);

  return res.status(200).json(new ApiResponse(200, formattedPosts, "Tagged posts fetched"));
});

// --- INTERACTIONS ---

// Toggle Like (Supports Post AND Reel)
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  let item = await Post.findById(postId);
  let type = "post";

  if (!item) {
    item = await Reel.findById(postId);
    type = "reel";
  }

  if (!item) throw new ApiError(404, "Post/Reel not found");

  const isLiked = item.likes.includes(userId);

  if (isLiked) {
    item.likes.pull(userId);
  } else {
    item.likes.push(userId);
    
    if (item.user.toString() !== userId.toString()) {
        await sendNotification({
          req,
          receiverId: item.user,
          type: "like",
          postId: type === "post" ? item._id : undefined,
          reelId: type === "reel" ? item._id : undefined,
        });
    }
  }

  await item.save();

  return res.status(200).json(
    new ApiResponse(200, isLiked ? "Unliked" : "Liked", {
      isLiked: !isLiked,
      likes: item.likes.length,
    })
  );
});

// Toggle Save (Supports Post AND Reel)
const toggleSavePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isPost = await Post.exists({ _id: postId });
  const isReel = await Reel.exists({ _id: postId });

  if (!isPost && !isReel) throw new ApiError(404, "Content not found");

  const user = await User.findById(userId);
  const isSaved = user.savedPosts.includes(postId);

  if (isSaved) {
    user.savedPosts.pull(postId);
  } else {
    user.savedPosts.push(postId);
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
      new ApiResponse(200, isSaved ? "Unsaved" : "Saved", { isSaved: !isSaved })
  );
});

// Delete Post (Can also add deleteReel here or separate controller)
const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  // Try finding Post
  let item = await Post.findById(postId);
  let isReel = false;

  // If not post, try Reel
  if (!item) {
      item = await Reel.findById(postId);
      isReel = true;
  }

  if (!item) throw new ApiError(404, "Content not found");

  if (item.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this");
  }

  // Delete associated comments
  await Comment.deleteMany({ 
      $or: [{ post: postId }, { reel: postId }] 
  });

  if (isReel) {
      await Reel.findByIdAndDelete(postId);
      // Optional: Decrement reel count in user if you track it
  } else {
      await Post.findByIdAndDelete(postId);
      await User.findByIdAndUpdate(userId, { $inc: { posts: -1 } });
  }

  return res.status(200).json(new ApiResponse(200, { postId }, "Deleted successfully"));
});

const searchHashtags = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === "") return res.status(200).json(new ApiResponse(200, [], "No query"));

  const cleanQuery = query.replace("#", "").toLowerCase();
  
  // Search in Posts
  const posts = await Post.find({ caption: { $regex: `#`, $options: "i" } }).select("caption");
  // Search in Reels (optional, but good for consistency)
  const reels = await Reel.find({ caption: { $regex: `#`, $options: "i" } }).select("caption");

  const combined = [...posts, ...reels];
  const tagCounts = {};

  combined.forEach((item) => {
    if (!item.caption) return;
    const matches = item.caption.match(/#[a-z0-9_]+/gi);
    if (matches) {
      matches.forEach((tag) => {
        const tagName = tag.replace("#", "").toLowerCase();
        if (tagName.includes(cleanQuery)) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        }
      });
    }
  });

  const results = Object.keys(tagCounts).map((tag) => ({ tag: tag, count: tagCounts[tag] })).sort((a, b) => b.count - a.count);

  return res.status(200).json(new ApiResponse(200, results, "Hashtag results fetched"));
});

export {
  createPost,
  getHomeFeed,
  getUserPosts,
  getUserSavedPosts,
  getUserTaggedPosts,
  togglePostLike,
  toggleSavePost,
  deletePost,
  searchHashtags,
};
