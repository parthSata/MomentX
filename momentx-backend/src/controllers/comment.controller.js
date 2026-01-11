import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendNotification } from "../utils/Notification.js"; // ✅ Import Notification Helper

// --- ADD COMMENT / REPLY (Updated with Notification) ---
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;
  const userId = req.user._id;

  if (!content) throw new ApiError(400, "Comment cannot be empty");

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const newComment = await Comment.create({
    text: content,
    post: postId,
    user: userId,
    parentComment: parentCommentId || null,
  });

  const populatedComment = await Comment.findById(newComment._id).populate(
    "user",
    "username profilePic"
  );

  // ✅ SEND NOTIFICATION (To Post Owner)
  await sendNotification({
    req,
    receiverId: post.user,
    type: "comment",
    postId: post._id,
    commentId: newComment._id,
  });

  // Optional: If this is a reply, notify the original comment author
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (parentComment) {
      await sendNotification({
        req,
        receiverId: parentComment.user, // Notify comment owner
        type: "comment", // Or create a 'reply' type
        postId: post._id,
        commentId: newComment._id,
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added"));
});

// --- GET COMMENTS ---
const getPostComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
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
    // Optional: Notify comment owner of like
    // await sendNotification({ ... })
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

// 2. DELETE COMMENT
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const post = await Post.findById(comment.post);

  const isCommentOwner = comment.user.toString() === userId.toString();
  const isPostOwner = post.user.toString() === userId.toString();

  if (!isCommentOwner && !isPostOwner) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});

export { addComment, getPostComments, toggleCommentLike, deleteComment };
