import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getHomeFeed,
  togglePostLike,
  toggleSavePost,
  deletePost,
  getUserPosts,
  getUserSavedPosts, // ✅ Import
  getUserTaggedPosts, // ✅ Import
  searchHashtags,
} from "../controllers/post.controller.js";
import {
  addComment,
  getPostComments,
  toggleCommentLike,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

// --- Creation & Feed ---
router
  .route("/create")
  .post(upload.fields([{ name: "images", maxCount: 5 }]), createPost);
router.route("/feed").get(getHomeFeed);

// --- Profile Tabs Data ---
// 1. Posts Tab (Created by user)
router.route("/user-posts/:userId").get(getUserPosts);
// 2. Saved Tab (Saved by user)
router.route("/saved-posts/:userId").get(getUserSavedPosts);
// 3. Tagged Tab (User is tagged in)
router.route("/tagged-posts/:userId").get(getUserTaggedPosts);
// 2. ✅ SEARCH ROUTE (MUST BE BEFORE /:id)
router.route("/search/tags").get(searchHashtags);

// --- Interactions ---
router.route("/:postId/like").post(togglePostLike);
router.route("/:postId/save").post(toggleSavePost);
router.route("/:postId/delete").delete(deletePost);

// --- Comments ---
router.route("/:postId/comments").get(getPostComments).post(addComment);
router.route("/comments/:commentId/like").post(toggleCommentLike);
router.route("/comments/:commentId/delete").delete(deleteComment);

export default router;
