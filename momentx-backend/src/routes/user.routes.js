import express from 'express';
import { body, validationResult, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  searchUser,
  refreshToken,
  updateProfile,
  getAllUsers,
  forgotPassword,
  resetPassword,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getUserById,
  getUserByUsername,
  changeCurrentPassword,
  verifyOTPAndRegister, // This will handle /register-verify
  sendRegistrationOTP, // This will handle /register-otp
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ApiError } from '../utils/ApiError.js';

const router = express.Router();

// --- Helper: Validation Middleware ---
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0].msg, errors.array());
  }
  next();
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// 🔓 PUBLIC ROUTES
// ==========================================

// --- Step 1: Send OTP ---
// Matches frontend: api.post("/users/register-otp")
router.route('/register-otp').post(sendRegistrationOTP);

// --- Step 2: Verify OTP & Finalize Registration ---
// Matches frontend: api.post("/users/register-verify")
router
  .route('/register-verify')
  .post(
    upload.fields([{ name: 'profilePic', maxCount: 1 }]),
    verifyOTPAndRegister,
  );

// Keep your existing registration route if needed for legacy support,
// otherwise you can remove it.
router
  .route('/register')
  .post(upload.fields([{ name: 'profilePic', maxCount: 1 }]), registerUser);

router
  .route('/login')
  .post(
    authLimiter,
    [
      body('email').isEmail().withMessage('Please provide a valid email'),
      body('password').notEmpty().withMessage('Password is required'),
      validate,
    ],
    loginUser,
  );

router
  .route('/forgot-password')
  .post(
    authLimiter,
    [
      body('email').isEmail().withMessage('Please provide a valid email'),
      validate,
    ],
    forgotPassword,
  );

router
  .route('/reset-password')
  .post(
    authLimiter,
    [
      body('email').isEmail().withMessage('Email is required'),
      body('otp')
        .isLength({ min: 6, max: 6 })
        .withMessage('Invalid OTP format'),
      body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
      validate,
    ],
    resetPassword,
  );

router.post('/refresh-token', refreshToken);

// ==========================================
// 🔒 SECURED ROUTES (Token Required)
// ==========================================

router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.get('/all', verifyJWT, getAllUsers);

router.route('/follow/:id').post(verifyJWT, toggleFollowUser);
router.route('/followers/:id').get(verifyJWT, getUserFollowers);
router.route('/following/:id').get(verifyJWT, getUserFollowing);
router.route('/u/:username').get(verifyJWT, getUserByUsername);

router.get(
  '/search',
  verifyJWT,
  [query('username').trim().optional(), validate],
  searchUser,
);

router
  .route('/update-profile')
  .put(
    verifyJWT,
    upload.fields([{ name: 'profilePic', maxCount: 1 }]),
    [
      body('username')
        .optional()
        .trim()
        .isLength({ min: 3 })
        .withMessage('Username too short'),
      body('email').optional().isEmail(),
      body('password').optional().isLength({ min: 6 }),
      validate,
    ],
    updateProfile,
  );

router.route('/:id').get(verifyJWT, getUserById);

export default router;
