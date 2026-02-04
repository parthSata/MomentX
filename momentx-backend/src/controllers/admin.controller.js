import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Reel } from '../models/reel.model.js';
import { Admin } from '../models/admin.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { Report } from '../models/report.model.js';
import { sendEmail } from '../utils/sendEmail.js';

/* ===================== 1. ADMIN LOGIN ===================== */

const HARDCODED_ADMIN = {
  username: 'Parth@MomentX',
  password: 'Parth1709@MomentX',
  role: 'admin',
};

const adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, 'Username and password are required');
  }

  // 🔐 STATIC MASTER ADMIN
  if (
    username === HARDCODED_ADMIN.username &&
    password === HARDCODED_ADMIN.password
  ) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new ApiError(500, 'ACCESS_TOKEN_SECRET not configured');

    const adminToken = jwt.sign(
      {
        _id: 'static-admin-id',
        username: 'Parth@MomentX',
        email: 'Parth@MomentX',
        role: 'superadmin',
        isStaticAdmin: true,
      },
      secret,
      { expiresIn: '7d' },
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: adminToken, role: 'superadmin' },
          'Admin login successful',
        ),
      );
  }

  // 🔐 DATABASE ADMIN LOGIN
  const user = await User.findOne({ username }).select('+password');
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const adminData = await Admin.findOne({ user: user._id });
  if (!adminData) {
    throw new ApiError(403, 'You do not have admin access');
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, role: adminData.role, accessToken },
        'Admin login successful',
      ),
    );
});

/* ===================== 2. DASHBOARD STATS ===================== */

const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalPosts, totalReports] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Report.countDocuments(),
  ]);

  const engagementAgg = await Post.aggregate([
    { $project: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
    { $group: { _id: null, totalLikes: { $sum: '$likesCount' } } },
  ]);

  const totalLikes = engagementAgg[0]?.totalLikes || 0;
  const engagementRate =
    totalUsers > 0 ? `${((totalLikes / totalUsers) * 100).toFixed(1)}%` : '0%';

  const stats = [
    { label: 'Total Users', value: totalUsers, trend: 'up', change: '+12.5%' },
    { label: 'Total Posts', value: totalPosts, trend: 'up', change: '+8.2%' },
    {
      label: 'Engagement Rate',
      value: engagementRate,
      trend: 'down',
      change: '-0.3%',
    },
    {
      label: 'Reports',
      value: totalReports,
      trend: totalReports ? 'up' : 'down',
      change: totalReports ? '+5' : '0',
    },
  ];

  return res
    .status(200)
    .json(new ApiResponse(200, stats, 'Dashboard stats fetched'));
});

/* ===================== 3. 📊 ANALYTICS ===================== */

const getAnalytics = asyncHandler(async (req, res) => {
  const range = Number(req.query.range) || 7;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - range);

  // Aggregate Posts by Date
  const analytics = await Post.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        value: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const formatted = analytics.map((d) => ({
    date: d._id,
    value: d.value,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, formatted, 'Analytics fetched'));
});

/* ===================== 4. USER MANAGEMENT ===================== */

const getAllUsersAdmin = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'user',
        as: 'userPosts',
      },
    },
    {
      $project: {
        name: 1,
        username: 1,
        email: 1,
        profilePic: 1,
        isVerified: 1,
        isActive: { $ifNull: ['$isActive', true] },
        postsCount: { $size: '$userPosts' },
        followersCount: { $size: { $ifNull: ['$followers', []] } },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 50 },
  ]);

  return res.status(200).json(new ApiResponse(200, users, 'Users fetched'));
});

const deleteUserAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  await Post.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'User deleted successfully'));
});

// --- BAN USER (Toggle) ---
const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.isActive === undefined) user.isActive = true;

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        `User ${user.isActive ? 'activated' : 'suspended'}`,
      ),
    );
});

/* ===================== 5. CONTENT MODERATION ===================== */

const deletePostAdmin = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  await Post.findByIdAndDelete(postId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Post deleted by admin'));
});

const sendUserWarning = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;

  if (!message) {
    throw new ApiError(400, 'Warning message is required');
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Send Email
  const emailSubject = '⚠️ Important Warning regarding your MomentX Account';
  const emailContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d9534f;">Account Warning</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>We are writing to bring to your attention some activity on your account that violates our community guidelines.</p>
      <blockquote style="background: #f9f9f9; border-left: 5px solid #d9534f; padding: 10px; margin: 20px 0;">
        <strong>Admin Message:</strong><br/>
        ${message}
      </blockquote>
      <p>Please review our terms of service. Continued violations may result in account suspension.</p>
      <p>Regards,<br/>MomentX Admin Team</p>
    </div>
  `;

  try {
    await sendEmail(user.email, emailSubject, emailContent);
  } catch (error) {
    throw new ApiError(500, 'Failed to send email');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Warning sent successfully'));
});

/* ===================== 6. CONTENT MANAGEMENT (POSTS & REELS) ===================== */

const getAllContentAdmin = asyncHandler(async (req, res) => {
  const { type = 'posts', page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let content = [];
  let total = 0;

  if (type === 'reels') {
    total = await Reel.countDocuments();
    content = await Reel.find()
      .populate('user', 'username name profilePic isVerified')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
  } else {
    total = await Post.countDocuments();
    content = await Post.find()
      .populate('user', 'username name profilePic isVerified')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
  }

  // ✅ FIX: Map status dynamically based on isHidden
  const formatted = content.map((item) => ({
    _id: item._id,
    type: type === 'reels' ? 'reel' : 'post',
    caption: item.caption,
    image: item.images?.[0] || item.thumbnailUrl || '',
    createdAt: item.createdAt,
    user: item.user,
    likes: item.likes.length,
    comments: 0,
    shares: 0,
    // 👇 Ensure backend sends correct state for UI
    isHidden: item.isHidden || false,
    status: item.isHidden ? 'hidden' : 'published',
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { content: formatted, total, page, pages: Math.ceil(total / limit) },
        'Content fetched',
      ),
    );
});

const deleteContentAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'post' or 'reel'

  if (type === 'reel') {
    await Reel.findByIdAndDelete(id);
  } else {
    await Post.findByIdAndDelete(id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Content deleted successfully'));
});

const toggleHideContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // 'post' or 'reel'

  let content;
  if (type === 'reel') {
    content = await Reel.findById(id);
  } else {
    content = await Post.findById(id);
  }

  if (!content) throw new ApiError(404, 'Content not found');

  // Toggle the hidden status
  content.isHidden = !content.isHidden;
  await content.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        content,
        `Content ${content.isHidden ? 'hidden' : 'visible'}`,
      ),
    );
});

/* ===================== EXPORTS ===================== */

export {
  adminLogin,
  getDashboardStats,
  getAnalytics,
  getAllUsersAdmin,
  banUser,
  deletePostAdmin,
  deleteUserAdmin,
  sendUserWarning,
  getAllContentAdmin,
  deleteContentAdmin,
  toggleHideContent,
};
