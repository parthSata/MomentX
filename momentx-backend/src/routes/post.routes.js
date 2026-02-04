import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
  createPost,
  getHomeFeed,
  togglePostLike,
  toggleSavePost,
  deletePost,
  getUserPosts,
  getUserSavedPosts,
  getUserTaggedPosts,
  searchHashtags,
} from '../controllers/post.controller.js';

const router = Router();

router.use(verifyJWT);

// --- Creation & Feed ---
router
  .route('/create')
  .post(upload.fields([{ name: 'images', maxCount: 5 }]), createPost);
router.route('/feed').get(getHomeFeed);

// --- Profile Tabs Data ---
router.route('/user-posts/:userId').get(getUserPosts);
router.route('/saved-posts/:userId').get(getUserSavedPosts);
router.route('/tagged-posts/:userId').get(getUserTaggedPosts);

// --- Search ---
router.route('/search/tags').get(searchHashtags);

// --- Interactions ---
router.route('/:postId/like').post(togglePostLike);
router.route('/:postId/save').post(toggleSavePost);
router.route('/:postId/delete').delete(deletePost);

export default router;
