import express from "express";
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
  likeStory, // ✅ Import
  replyStory, // ✅ Import
} from "../controllers/story.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getStories).post(upload.array("files", 10), createStory);

router.route("/:id").delete(deleteStory);
router.route("/:id/view").post(viewStory);

// ✅ NEW ROUTES
router.route("/:id/like").post(likeStory);
router.route("/:id/reply").post(replyStory);

export default router;
