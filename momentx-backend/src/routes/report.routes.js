// src/routes/report.routes.js
import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { createReport } from '../controllers/report.controller.js';

const router = Router();

router.use(verifyJWT);

// Route to submit a new report
router.route('/create').post(createReport);

export default router;
