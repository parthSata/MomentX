import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { getActivityStats, trackVisit } from '../controllers/activity.controller.js';

const router = Router();

router.use(verifyJWT);

// ✅ Activity Routes
router.get('/', getActivityStats);
router.post('/track-visit', trackVisit);

export default router;
