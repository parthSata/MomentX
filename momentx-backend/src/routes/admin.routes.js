import { Router } from 'express';
import {
  adminLogin,
  getDashboardStats,
  getAllUsersAdmin,
  banUser,
  deletePostAdmin,
  getAnalytics,
  deleteUserAdmin,
  sendUserWarning,
  getAllContentAdmin,
  deleteContentAdmin,
  toggleHideContent,
  getAllReportsAdmin,
  updateReportStatus,
} from '../controllers/admin.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Public Admin Route
router.post('/login', adminLogin);

// Protected Admin Routes (Require Login + Admin Check)
router.use(verifyJWT, verifyAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsersAdmin);
router.patch('/users/:userId/ban', banUser);
router.delete('/posts/:postId', deletePostAdmin);
router.get('/analytics', getAnalytics);
router.delete('/users/:userId', deleteUserAdmin);
router.post('/users/:userId/warning', sendUserWarning);
router.get('/content', getAllContentAdmin); // ?type=posts or ?type=reels
router.delete('/content/:id', deleteContentAdmin); // ?type=post or ?type=reel
router.patch('/content/:id/hide', toggleHideContent); // ?type=post or ?type=reel
router.get('/reports', getAllReportsAdmin);
router.patch('/reports/:reportId', updateReportStatus);

export default router;
