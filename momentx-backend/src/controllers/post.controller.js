import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { sendNotification } from "../utils/Notification.js"; // ✅ Import Notification Helper

// --- HELPER: Format Posts ---
const formatPosts = async (posts, currentUserId) => {
  const currentUser = await User.findById(currentUserId).select("savedPosts");
  const savedPostIds = currentUser?.savedPosts.map((id) => id.toString()) || [];

  return await Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject ? post.toObject() : post;
      const commentCount = await Comment.countDocuments({ post: postObj._id });

      return {
        ...postObj,
        user: {
          ...postObj.user,
          profilePic: postObj.user?.profilePic || "",
          avatar: postObj.user?.profilePic || "",
        },
        image: postObj.images?.[0] || "",
        isLiked: postObj.likes.some(
          (id) => id.toString() === currentUserId.toString()
        ),
        isSaved: savedPostIds.includes(postObj._id.toString()),
        likes: postObj.likes.length,
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
      parsedTags =
        typeof taggedUsers === "string" ? JSON.parse(taggedUsers) : taggedUsers;
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

  // Optional: Send notification to tagged users
  if (parsedTags.length > 0) {
    parsedTags.forEach((taggedUserId) => {
      sendNotification({
        req,
        receiverId: taggedUserId,
        type: "mention", // You might need to add 'mention' to your enum if you want this
        postId: post._id,
      });
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, post, "Post created successfully"));
});

// --- 2. GET FEED ---
const getHomeFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

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

// --- 3. GET USER POSTS ---
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID format");
  }

  const posts = await Post.find({ user: userId })
    .populate("user", "username profilePic")
    .sort({ createdAt: -1 });

  const formattedPosts = await formatPosts(posts, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, "User posts fetched"));
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
    populate: { path: "user", select: "username profilePic" },
  });

  if (!user) throw new ApiError(404, "User not found");

  const formattedPosts = await formatPosts(user.savedPosts, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, "Saved posts fetched"));
});

// --- 5. GET TAGGED POSTS ---
const getUserTaggedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new ApiError(400, "Invalid User ID");

  const posts = await Post.find({ taggedUsers: userId })
    .populate("user", "username profilePic")
    .sort({ createdAt: -1 });

  const formattedPosts = await formatPosts(posts, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, "Tagged posts fetched"));
});

// --- INTERACTIONS ---

// ✅ TOGGLE LIKE (Updated with Notification)
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const isLiked = post.likes.includes(userId);

  if (isLiked) {
    // Unlike logic
    post.likes.pull(userId);
  } else {
    // Like logic
    post.likes.push(userId);

    // ✅ SEND NOTIFICATION
    await sendNotification({
      req,
      receiverId: post.user, // Notify post owner
      type: "like",
      postId: post._id,
    });
  }

  await post.save();

  return res.status(200).json(
    new ApiResponse(200, isLiked ? "Unliked" : "Liked", {
      isLiked: !isLiked,
      likes: post.likes.length,
    })
  );
});

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

  await Comment.deleteMany({ post: postId });
  await Post.findByIdAndDelete(postId);
  await User.findByIdAndUpdate(userId, { $inc: { posts: -1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, { postId }, "Post deleted successfully"));
});

export {
  createPost,
  getHomeFeed,
  togglePostLike,
  toggleSavePost,
  deletePost,
  getUserPosts,
  getUserSavedPosts,
  getUserTaggedPosts,
};
