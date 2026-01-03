import express from "express";
import {
  createStory,
  getStories,
  viewStory,
  deleteStory,
} from "../controllers/story.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // Ensure this path is correct

const router = express.Router();

// Apply Auth Middleware to ALL story routes
router.use(verifyJWT);

router
  .route("/")
  .get(getStories)
  .post(
    upload.single("file"),
    (req, res, next) => {
      // ✅ Middleware: Construct the URL manually
      if (req.file) {
        // Construct URL: http://localhost:3000/temp/filename.jpg
        // "temp" matches the folder served statically in app.js
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        req.body.url = `${baseUrl}/temp/${req.file.filename}`;

        // Determine type
        const mime = req.file.mimetype;
        req.body.type = mime.startsWith("video") ? "video" : "image";
      }
      next();
    },
    createStory
  );

router.route("/:id").delete(deleteStory);
router.route("/:id/view").post(viewStory);

export default router;
