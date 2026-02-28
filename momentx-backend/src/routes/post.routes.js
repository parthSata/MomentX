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
  editPost,
  getPostById, // ✅ IMPORT NEW CONTROLLER
  getPostLikes, // ✅ IMPORT NEW CONTROLLER
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

// --- Interactions & Single Post Fetch ---
router.route('/:postId/like').post(togglePostLike);
router.route('/:postId/save').post(toggleSavePost);
router.route('/:postId/delete').delete(deletePost);

// ✅ FIXED: Added GET request for fetching a single post by ID
router.route('/:postId').get(getPostById).put(editPost);
router.route('/:postId/likes').get(getPostLikes); // ✅ ADDED LIKES ROUTE

export default router;
