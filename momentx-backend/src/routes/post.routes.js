import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getHomeFeed,
  togglePostLike,
  toggleSavePost,
  deletePost, // ✅ Import
} from "../controllers/post.controller.js";
import {
  addComment,
  getPostComments,
  toggleCommentLike, // ✅ Import
  deleteComment, // ✅ Import
} from "../controllers/comment.controller.js";

const router = Router();

// 🔒 All routes require Authentication
router.use(verifyJWT);

// --- POST ROUTES ---
router
  .route("/create")
  .post(upload.fields([{ name: "images", maxCount: 5 }]), createPost);

router.route("/feed").get(getHomeFeed);

// --- INTERACTION ROUTES ---
router.route("/:postId/like").post(togglePostLike);
router.route("/:postId/save").post(toggleSavePost);
router.route("/:postId/delete").delete(deletePost); // ✅ Delete Post

// --- COMMENT ROUTES ---
router.route("/:postId/comments").get(getPostComments).post(addComment);
router.route("/comments/:commentId/like").post(toggleCommentLike); // ✅ Toggle Comment Like
router.route("/comments/:commentId/delete").delete(deleteComment); // ✅ Delete Comment


export default router;
