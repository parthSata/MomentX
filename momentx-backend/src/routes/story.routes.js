import express from "express";
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} from "../controllers/story.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .get(getStories)
  // ✅ CHANGED: Use .array() instead of .single()
  // "files" is the field name, 10 is the max count
  .post(upload.array("files", 10), createStory);

router.route("/:id").delete(deleteStory);
router.route("/:id/view").post(viewStory);

export default router;
