import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { Reel } from "../models/reel.model.js"; 
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/Notification.js";

// Helper to find parent (Post or Reel)
const findParent = async (id) => {
  if (!id) return null;
  // Try finding in Posts first
  let parent = await Post.findById(id);
  if (parent) return { doc: parent, type: "Post" };

  // Try finding in Reels
  parent = await Reel.findById(id);
  if (parent) return { doc: parent, type: "Reel" };

  return null;
};

// --- ADD COMMENT ---
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params; // This ID could be for a Post OR a Reel
  const { content, parentCommentId } = req.body;
  const userId = req.user._id;

  if (!content) throw new ApiError(400, "Comment cannot be empty");

  const parentFound = await findParent(postId);
  if (!parentFound) throw new ApiError(404, "Post/Reel not found");

  const { doc: parentDoc, type: parentType } = parentFound;

  // Create Comment dynamically linking to Post OR Reel
  const newComment = await Comment.create({
    text: content,
    user: userId,
    // Only assign the ID to the correct field
    post: parentType === "Post" ? postId : undefined, 
    reel: parentType === "Reel" ? postId : undefined, 
    parentComment: parentCommentId || null,
  });

  const populatedComment = await Comment.findById(newComment._id).populate(
    "user",
    "username profilePic"
  );

  // Send Notification
  if (parentDoc.user.toString() !== userId.toString()) {
    await sendNotification({
      req,
      receiverId: parentDoc.user,
      type: "comment",
      postId: parentType === "Post" ? parentDoc._id : undefined,
      reelId: parentType === "Reel" ? parentDoc._id : undefined,
      commentId: newComment._id,
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added"));
});

// --- GET COMMENTS ---
const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // Find comments where either 'post' or 'reel' matches the ID
  const comments = await Comment.find({ 
    $or: [{ post: postId }, { reel: postId }] 
  })
    .sort({ createdAt: -1 })
    .populate("user", "username profilePic");

  const formattedComments = comments.map((c) => ({
    _id: c._id,
    user: {
      username: c.user.username,
      profilePic: c.user.profilePic,
    },
    text: c.text,
    createdAt: c.createdAt,
    likes: c.likes || [],
    parentComment: c.parentComment,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formattedComments, "Comments fetched"));
});

// --- TOGGLE LIKE ---
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const isLiked = comment.likes.includes(userId);

  if (isLiked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.push(userId);
  }

  await comment.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isLiked: !isLiked, likes: comment.likes },
        "Like toggled"
      )
    );
});

// --- DELETE COMMENT ---
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  // Determine owner of the parent (Post or Reel)
  let parentOwnerId = null;
  if (comment.post) {
    const p = await Post.findById(comment.post);
    if(p) parentOwnerId = p.user.toString();
  } else if (comment.reel) {
    const r = await Reel.findById(comment.reel);
    if(r) parentOwnerId = r.user.toString();
  }

  const isCommentOwner = comment.user.toString() === userId.toString();
  const isParentOwner = parentOwnerId === userId.toString();

  // Allow deletion if user owns the comment OR the parent post/reel
  if (!isCommentOwner && !isParentOwner) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});

export { addComment, getPostComments, toggleCommentLike, deleteComment };