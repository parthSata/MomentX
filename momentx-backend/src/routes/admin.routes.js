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
  getVisitorLogs
} from '../controllers/admin.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Public Admin Route
router.post('/login', adminLogin);

// Protected Routes
router.use(verifyJWT);

// Strictly ADMIN-ONLY Routes
router.use(verifyAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsersAdmin);
router.patch('/users/:userId/ban', banUser);
router.delete('/posts/:postId', deletePostAdmin);
router.get('/analytics', getAnalytics);
router.delete('/users/:userId', deleteUserAdmin);
router.post('/users/:userId/warning', sendUserWarning);
router.get('/content', getAllContentAdmin); 
router.delete('/content/:id', deleteContentAdmin); 
router.patch('/content/:id/hide', toggleHideContent); 
router.get('/reports', getAllReportsAdmin);
router.patch('/reports/:reportId', updateReportStatus);
router.get('/visitor-logs', getVisitorLogs);

export default router;
