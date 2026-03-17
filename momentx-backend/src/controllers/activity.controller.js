import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { Reel } from '../models/reel.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { VisitLog } from '../models/visitLog.model.js';

// --- GET ACTIVITY STATS ---
export const getActivityStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Fetch Basic Counts
  const [totalPosts, totalReels, totalComments, user] = await Promise.all([
    Post.countDocuments({ user: userId }),
    Reel.countDocuments({ user: userId }),
    Comment.countDocuments({ user: userId }),
    User.findById(userId).select('followers following savedPosts'),
  ]);

  const totalContent = totalPosts + totalReels;
  const totalFollowers = user.followers.length;
  const totalSaves = user.savedPosts.length; // Items current user saved (or query how many *others* saved your posts if schema supports)

  // 2. Calculate Total Likes (Aggregating across all user posts & reels)
  const postsLikes = await Post.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } },
  ]);

  const reelsLikes = await Reel.aggregate([
    { $match: { user: userId } },
    { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } },
  ]);

  const totalLikes =
    (postsLikes[0]?.totalLikes || 0) + (reelsLikes[0]?.totalLikes || 0);

  // 3. Weekly Data (Last 7 Days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyActivity = await Post.aggregate([
    { $match: { user: userId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        likes: { $sum: { $size: '$likes' } },
        commentsCount: { $sum: 1 }, // Simplification (ideally join comments)
      },
    },
  ]);

  // Format Weekly Data (Ensure all days present)
  const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formattedWeeklyData = daysMap.map((day, index) => {
    // MongoDB dayOfWeek: 1 (Sun) - 7 (Sat)
    const found = weeklyActivity.find((w) => w._id === index + 1);
    return {
      day,
      likes: found?.likes || 0,
      comments: found?.commentsCount || 0,
      shares: 0, // Placeholder if shares aren't tracked
    };
  });

  // 4. Top Posts (By Likes)
  const topPosts = await Post.find({ user: userId })
    .sort({ likes: -1 })
    .limit(3)
    .select('images caption likes');

  const formattedTopPosts = topPosts.map((p) => ({
    id: p._id,
    image: p.images[0],
    likes: p.likes.length,
    comments: 0, // Ideally requires a separate count query
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          posts: totalContent,
          likes: totalLikes,
          comments: totalComments,
          followers: totalFollowers,
          saves: totalSaves,
        },
        weeklyData: formattedWeeklyData,
        topPosts: formattedTopPosts,
      },
      'Activity stats fetched',
    ),
  );
});

// ✅ NEW: Track Visitor (Called by Frontend on App Mount)
export const trackVisit = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // ⛔ Skip if no user OR if it's the Static SuperAdmin (prevents CastError on 'static-admin-id')
  if (!user || user.isStaticAdmin) {
    return res.status(200).json(new ApiResponse(200, {}, 'No-op'));
  }

  // Optional: Only log once every 30 minutes per user path to avoid spam
  const lastLog = await VisitLog.findOne({ 
    user: user._id, 
    path: req.body.path || '/' 
  }).sort({ createdAt: -1 });

  if (lastLog && (Date.now() - new Date(lastLog.createdAt).getTime() < 30 * 60 * 1000)) {
     return res.status(200).json(new ApiResponse(200, {}, 'Already logged recently'));
  }

  const userAgent = req.headers['user-agent'] || 'unknown';
  let device = 'Desktop';
  if (/mobile/i.test(userAgent)) device = 'Mobile';
  else if (/tablet/i.test(userAgent)) device = 'Tablet';

  const log = await VisitLog.create({
    user: user._id, 
    ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    userAgent,
    device,
    path: req.body.path || '/'
  });

  return res.status(200).json(new ApiResponse(200, log, 'Visit tracked'));
});
