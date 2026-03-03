import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notification.controller.js';

const router = Router();

// Apply auth middleware to all routes
router.use(verifyJWT);

router.route('/').get(getNotifications);
router.route('/read').post(markNotificationsRead);

// ✅ CRITICAL FIX: /all MUST be above /:id
router.route('/all').delete(deleteAllNotifications);

// Because /all is above, Express will only reach this route if it's a real ID
router.route('/:id').delete(deleteNotification);

export default router;
