import { Post } from "../models/post.model.js"; // Ensure you export Post properly in model
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// --- 1. CREATE POST ---
const createPost = asyncHandler(async (req, res) => {
  const { caption, location } = req.body;
  const userId = req.user._id;

  if (!req.files?.images || req.files.images.length === 0) {
    throw new ApiError(400, "Please upload at least one image");
  }

  // Upload all images to Cloudinary
  const imagesLocalPaths = req.files.images.map((file) => file.path);
  const imageUrls = [];

  for (const path of imagesLocalPaths) {
    const uploaded = await uploadInCloudinary(path);
    if (uploaded) imageUrls.push(uploaded.secure_url);
  }

  // Extract Hashtags from caption (e.g. "Hello #world" -> ["#world"])
  const hashtags = caption.match(/#[a-z0-9_]+/gi) || [];

  const post = await Post.create({
    user: userId,
    caption,
    images: imageUrls,
    location,
    hashtags,
    likes: [],
  });

  // Update User's post count
  await User.findByIdAndUpdate(userId, { $inc: { posts: 1 } });

  return res.status(201).json(new ApiResponse(201, "Post created", post));
});

// --- 2. GET FEED (Infinite Scroll) ---
const getHomeFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

  // Fetch posts sorted by newest
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate("user", "username name profilePic isVerified") // Populate author details
    .lean();

  // Get current user's saved posts to check "isSaved" status
  const currentUser = await User.findById(currentUserId).select("savedPosts");
  const savedPostIds = currentUser.savedPosts.map((id) => id.toString());

  // Add frontend-specific fields (isLiked, isSaved, commentsCount)
  const postsWithStatus = await Promise.all(
    posts.map(async (post) => {
      const commentCount = await Comment.countDocuments({ post: post._id });

      return {
        ...post,
        // Map backend 'profilePic' to frontend 'avatar' if needed, or update frontend to use profilePic
        user: {
          ...post.user,
          avatar: post.user.profilePic, // Compatibility mapping
        },
        image: post.images[0], // Frontend expects single 'image' string currently
        isLiked: post.likes.some(
          (id) => id.toString() === currentUserId.toString()
        ),
        isSaved: savedPostIds.includes(post._id.toString()),
        likes: post.likes.length, // Frontend expects number
        comments: commentCount, // Frontend expects number
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        // ✅ DATA GOES HERE (2nd Argument)
        posts: postsWithStatus,
        currentPage: parseInt(page),
        hasMore: posts.length === parseInt(limit),
      },
      "Feed fetched successfully" // ✅ MESSAGE GOES HERE (3rd Argument)
    )
  );
});

// --- 3. TOGGLE LIKE ---
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const isLiked = post.likes.includes(userId);

  if (isLiked) {
    post.likes.pull(userId); // Un-like
  } else {
    post.likes.push(userId); // Like
  }

  await post.save();

  return res.status(200).json(
    new ApiResponse(200, isLiked ? "Unliked" : "Liked", {
      isLiked: !isLiked,
      likes: post.likes.length,
    })
  );
});

// --- 4. TOGGLE SAVE (Bookmark) ---
const toggleSavePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const isSaved = user.savedPosts.includes(postId);

  if (isSaved) {
    user.savedPosts.pull(postId);
  } else {
    user.savedPosts.push(postId);
  }

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, isSaved ? "Unsaved" : "Saved", { isSaved: !isSaved })
    );
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (post.user.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this post");
  }

  // Delete associated comments first
  await Comment.deleteMany({ post: postId });

  // Delete the post
  await Post.findByIdAndDelete(postId);

  // Decrease user post count
  await User.findByIdAndUpdate(userId, { $inc: { posts: -1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, { postId }, "Post deleted successfully"));
});

const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // 1. Validate User ID format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID format");
  }


  // 2. Fetch Posts
  // ⚠️ CRITICAL: Check your Post Model. Is the field 'user', 'owner', or 'author'?
  // I am using 'user' here as it's the most common convention.
  // If your model says 'owner', change 'user: userId' to 'owner: userId'
  const posts = await Post.find({ user: userId })
    .populate("user", "username profilePic") // Ensure this matches the field name above
    .sort({ createdAt: -1 });


  return res
    .status(200)
    .json(new ApiResponse(200, posts, "User posts fetched successfully"));
});
export {
  createPost,
  getHomeFeed,
  togglePostLike,
  toggleSavePost,
  deletePost,
  getUserPosts,
};
