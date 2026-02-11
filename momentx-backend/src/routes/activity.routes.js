import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getActivityStats } from '../controllers/activity.controller.js';

const router = Router();

router.use(verifyJWT);

// ✅ Get Dashboard Stats
router.route('/').get(getActivityStats);

export default router;
