import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getExplorePosts,
  getSuggestedUsers,
  getTrendingHashtags,
} from "../controllers/explore.controller.js";

const router = Router();

router.use(verifyJWT); // Protect all explore routes

// 1. Masonry Grid Posts
router.route("/feed").get(getExplorePosts);

// 2. Suggested Profiles (Horizontal list)
router.route("/suggestions").get(getSuggestedUsers);

// 3. Trending Hashtags (Categories)
router.route("/trending").get(getTrendingHashtags);

export default router;