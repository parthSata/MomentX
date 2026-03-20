import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  createReel,
  getReelsFeed,
  toggleLikeReel,
  getReelById,
  incrementReelView,
} from '../controllers/reel.controller.js';

const router = express.Router();

router.use(verifyJWT); // Protect all routes

// Upload Reel (Expects form-data with field name "video")
router.route('/create').post(upload.single('video'), createReel);

// Get Feed
router.route('/feed').get(getReelsFeed);

// Like/Unlike
router.route('/like/:reelId').post(toggleLikeReel);

// View Count
router.route('/:reelId/view').patch(incrementReelView);

router.route('/:reelId').get(getReelById).put(getReelById);

export default router;

