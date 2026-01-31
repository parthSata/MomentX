import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  getPostComments,
  toggleCommentLike,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

// --- Core Comment Routes ---

// Get comments for a post OR Add a comment to a post
router.route("/post/:postId")
    .get(getPostComments)
    .post(addComment);

// --- Comment Actions ---

// Like a comment
router.route("/:commentId/like").post(toggleCommentLike);

// Delete a comment
router.route("/:commentId/delete").delete(deleteComment);

export default router;