import { Post } from '../models/post.model.js';
import { Reel } from '../models/reel.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadInCloudinary } from '../utils/cloudinary.js';
import mongoose from 'mongoose';
import { sendNotification } from '../utils/Notification.js';

// ✅ STRONG FILTER: Matches visible content (false) OR old content (undefined/null)
// This ensures that if you haven't run a migration to set isHidden:false on all docs, they still show up.
const VISIBLE_FILTER = {
  $or: [{ isHidden: false }, { isHidden: { $exists: false } }],
};

// --- HELPER: Format Posts & Reels ---
const formatPosts = async (posts, currentUserId) => {
  const currentUser = await User.findById(currentUserId).select('savedPosts');
  const savedPostIds = currentUser?.savedPosts.map((id) => id.toString()) || [];

  return await Promise.all(
    posts.map(async (post) => {
      const postObj = post.toObject ? post.toObject() : post;

      const commentCount = await Comment.countDocuments({
        $or: [{ post: postObj._id }, { reel: postObj._id }],
      });

      return {
        ...postObj,
        _id: postObj._id,
        user: {
          _id: postObj.user?._id || postObj.user,
          username: postObj.user?.username || 'Unknown',
          name: postObj.user?.name || 'Unknown',
          profilePic: postObj.user?.profilePic || '',
          avatar: postObj.user?.profilePic || '',
          isVerified: postObj.user?.isVerified || false,
        },
        videoUrl: postObj.videoUrl || '',
        thumbnailUrl: postObj.thumbnailUrl || '',
        images:
          postObj.images?.length > 0
            ? postObj.images
            : postObj.thumbnailUrl
              ? [postObj.thumbnailUrl]
              : [],

        isLiked: postObj.likes.some(
          (id) => id.toString() === currentUserId.toString(),
        ),
        isSaved: savedPostIds.includes(postObj._id.toString()),
        likes: postObj.likes.length,
        commentsCount: commentCount,
        comments: commentCount,
      };
    }),
  );
};

// --- 1. CREATE POST ---
const createPost = asyncHandler(async (req, res) => {
  const { caption, location, taggedUsers } = req.body;
  const userId = req.user._id;

  if (!req.files?.images || req.files.images.length === 0) {
    throw new ApiError(400, 'Please upload at least one image');
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
        typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
    } catch (e) {
      console.warn('Could not parse taggedUsers', e);
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
    isHidden: false,
  });

  await User.findByIdAndUpdate(userId, { $inc: { posts: 1 } });

  if (parsedTags.length > 0) {
    parsedTags.forEach((taggedUserId) => {
      sendNotification({
        req,
        receiverId: taggedUserId,
        type: 'mention',
        postId: post._id,
      });
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, post, 'Post created successfully'));
});

// --- 2. GET FEED ---
// post.controller.js

const getHomeFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  const currentUserId = req.user._id;

  // 1. Get the current user to find their following list
  const currentUser = await User.findById(currentUserId).select('following');

  // 2. Create a list of IDs to fetch posts from
  // Include the user's own ID if you want them to see their own posts in the feed
  const followingList = [...currentUser.following, currentUserId];

  // 3. Update the filter to only show posts from followed users
  const FOLLOWED_USERS_FILTER = {
    user: { $in: followingList },
    ...VISIBLE_FILTER,
  };

  // 4. Fetch Posts
  const posts = await Post.find(FOLLOWED_USERS_FILTER)
    .populate('user', 'username name profilePic isVerified')
    .populate('taggedUsers', 'username')
    .sort({ createdAt: -1 }) // Sort here for better performance before lean
    .lean();

  // 5. Fetch Reels
  const reels = await Reel.find(FOLLOWED_USERS_FILTER)
    .populate('user', 'username name profilePic isVerified')
    .sort({ createdAt: -1 })
    .lean();

  // 6. Combine, Sort and Paginate
  const allContent = [...posts, ...reels].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const paginatedContent = allContent.slice(skip, skip + parseInt(limit));
  const formattedPosts = await formatPosts(paginatedContent, currentUserId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts: formattedPosts,
        currentPage: parseInt(page),
        hasMore: skip + parseInt(limit) < allContent.length,
      },
      'Feed fetched successfully',
    ),
  );
});

// --- 3. GET USER POSTS & REELS (Fixed for Reels) ---
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid User ID format');
  }

  // ✅ Apply Strong Filter to Posts
  const posts = await Post.find({ user: userId, ...VISIBLE_FILTER })
    .populate('user', 'username name profilePic isVerified')
    .sort({ createdAt: -1 });

  // ✅ Apply Strong Filter to Reels (This ensures hidden reels vanish)
  const reels = await Reel.find({ user: userId, ...VISIBLE_FILTER })
    .populate('user', 'username name profilePic isVerified')
    .sort({ createdAt: -1 });

  const allContent = [...posts, ...reels].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const formattedPosts = await formatPosts(allContent, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, 'User posts and reels fetched'));
});

// --- 4. GET SAVED POSTS ---
const getUserSavedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new ApiError(400, 'Invalid User ID');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const savedIds = user.savedPosts; // Array of ObjectIds

  // ✅ Fetch from both collections independently since refs are mixed
  const [posts, reels] = await Promise.all([
    Post.find({ _id: { $in: savedIds }, ...VISIBLE_FILTER })
      .populate('user', 'username name profilePic isVerified')
      .lean(),
    Reel.find({ _id: { $in: savedIds }, ...VISIBLE_FILTER })
      .populate('user', 'username name profilePic isVerified')
      .lean(),
  ]);

  const allSavedContent = [...posts, ...reels];

  // ✅ Sort them strictly by the order they were saved (newest first)
  const reversedSavedIds = [...savedIds].reverse().map((id) => id.toString());
  allSavedContent.sort((a, b) => {
    return (
      reversedSavedIds.indexOf(a._id.toString()) -
      reversedSavedIds.indexOf(b._id.toString())
    );
  });

  const formattedPosts = await formatPosts(allSavedContent, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedPosts, 'Saved content fetched'));
});

// --- 5. GET TAGGED POSTS ---
const getUserTaggedPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  // Fetch both Posts and Reels where the user is tagged
  const [posts, reels] = await Promise.all([
    Post.find({ taggedUsers: userId, ...VISIBLE_FILTER })
      .populate('user', 'username name profilePic isVerified')
      .lean(),
    Reel.find({ taggedUsers: userId, ...VISIBLE_FILTER })
      .populate('user', 'username name profilePic isVerified')
      .lean(),
  ]);

  const allTaggedContent = [...posts, ...reels].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const formattedContent = await formatPosts(allTaggedContent, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, formattedContent, 'Tagged content fetched'));
});

// --- INTERACTIONS (Unchanged) ---
const togglePostLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  let item = await Post.findById(postId);
  let type = 'post';

  if (!item) {
    item = await Reel.findById(postId);
    type = 'reel';
  }

  if (!item) throw new ApiError(404, 'Post/Reel not found');

  const isLiked = item.likes.includes(userId);

  if (isLiked) {
    item.likes.pull(userId);
  } else {
    item.likes.push(userId);

    if (item.user.toString() !== userId.toString()) {
      await sendNotification({
        req,
        receiverId: item.user,
        type: 'like',
        postId: type === 'post' ? item._id : undefined,
        reelId: type === 'reel' ? item._id : undefined,
      });
    }
  }

  await item.save();

  return res.status(200).json(
    new ApiResponse(200, isLiked ? 'Unliked' : 'Liked', {
      isLiked: !isLiked,
      likes: item.likes.length,
    }),
  );
});

const toggleSavePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  const isPost = await Post.exists({ _id: postId });
  const isReel = await Reel.exists({ _id: postId });

  if (!isPost && !isReel) throw new ApiError(404, 'Content not found');

  const user = await User.findById(userId);
  const isSaved = user.savedPosts.includes(postId);

  if (isSaved) {
    user.savedPosts.pull(postId);
  } else {
    user.savedPosts.push(postId);
  }

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(200, isSaved ? 'Unsaved' : 'Saved', {
      isSaved: !isSaved,
    }),
  );
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id;

  let item = await Post.findById(postId);
  let isReel = false;

  if (!item) {
    item = await Reel.findById(postId);
    isReel = true;
  }

  if (!item) throw new ApiError(404, 'Content not found');

  if (item.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this');
  }

  await Comment.deleteMany({
    $or: [{ post: postId }, { reel: postId }],
  });

  if (isReel) {
    await Reel.findByIdAndDelete(postId);
  } else {
    await Post.findByIdAndDelete(postId);
    await User.findByIdAndUpdate(userId, { $inc: { posts: -1 } });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { postId }, 'Deleted successfully'));
});

const editPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { caption, location, tags } = req.body;
  const userId = req.user._id;

  // 1. Try to find the item in the Post collection first
  let item = await Post.findById(postId);
  let isReel = false;

  // 2. If it is not found in Posts, try finding it in the Reel collection
  if (!item) {
    item = await Reel.findById(postId);
    isReel = true;
  }

  // 3. If neither has it, return a 404
  if (!item) {
    throw new ApiError(404, 'Post or Reel not found');
  }

  // 4. Check if the current user actually owns the content
  if (item.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to edit this content');
  }

  // 5. Update the fields
  item.caption = caption;

  if (location !== undefined) {
    item.location = location;
  }

  // If you added tags support in your schema, update them too
  if (tags !== undefined) {
    // Split tags by comma if sent as a string, clean them up, and assign
    item.hashtags =
      typeof tags === 'string'
        ? tags.split(',').map((tag) => tag.trim().replace(/^#/, ''))
        : tags;
  }

  // 6. Save the changes to the database
  await item.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        item,
        isReel ? 'Reel updated successfully' : 'Post updated successfully',
      ),
    );
});

// --- SEARCH (Fixed for Reels) ---
const searchHashtags = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim() === '')
    return res.status(200).json(new ApiResponse(200, [], 'No query'));

  const cleanQuery = query.replace('#', '').toLowerCase();

  // ✅ Apply Strong Filter to Search (Posts)
  const posts = await Post.find({
    caption: { $regex: `#`, $options: 'i' },
    ...VISIBLE_FILTER,
  }).select('caption');

  // ✅ Apply Strong Filter to Search (Reels)
  const reels = await Reel.find({
    caption: { $regex: `#`, $options: 'i' },
    ...VISIBLE_FILTER,
  }).select('caption');

  const combined = [...posts, ...reels];
  const tagCounts = {};

  combined.forEach((item) => {
    if (!item.caption) return;
    const matches = item.caption.match(/#[a-z0-9_]+/gi);
    if (matches) {
      matches.forEach((tag) => {
        const tagName = tag.replace('#', '').toLowerCase();
        if (tagName.includes(cleanQuery)) {
          tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        }
      });
    }
  });

  const results = Object.keys(tagCounts)
    .map((tag) => ({ tag: tag, count: tagCounts[tag] }))
    .sort((a, b) => b.count - a.count);

  return res
    .status(200)
    .json(new ApiResponse(200, results, 'Hashtag results fetched'));
});

const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, 'Invalid Post ID');
  }

  // 1. Try finding in Posts first
  let content = await Post.findById(postId).populate(
    'user',
    'username name profilePic isVerified',
  );
  let isReel = false;

  // 2. If not found in Posts, try finding in Reels
  if (!content) {
    content = await Reel.findById(postId).populate(
      'user',
      'username name profilePic isVerified',
    );
    isReel = true;
  }

  if (!content) {
    throw new ApiError(404, 'Post or Reel not found');
  }

  // Format using your existing formatPosts helper
  const formattedContentArray = await formatPosts([content], currentUserId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedContentArray[0],
        'Content fetched successfully',
      ),
    );
});

const getPostLikes = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, 'Invalid Post ID');
  }

  // 1. Try finding in Posts first
  let item = await Post.findById(postId).populate(
    'likes',
    'username name profilePic isVerified',
  );

  // 2. If not found, try Reels
  if (!item) {
    item = await Reel.findById(postId).populate(
      'likes',
      'username name profilePic isVerified',
    );
  }

  if (!item) {
    throw new ApiError(404, 'Post or Reel not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, item.likes, 'Likes fetched successfully'));
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
  editPost,
  getPostById,
  getPostLikes,
};
