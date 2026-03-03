import Notification from '../models/Notification.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


// GET USER NOTIFICATIONS
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('sender', 'username profilePic')
    // ✅ CRITICAL FIX: Added 'type' and 'videoUrl' so frontend knows if it's a Reel!
    .populate('post', 'images type videoUrl')
    .populate('reel', 'video videoUrl thumbnail image') // ✅ POPULATE REEL MEDIA
    .populate('story', 'url type');

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, 'Notifications fetched'));
});


// MARK ALL AS READ
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Notifications marked as read'));
});

// DELETE SINGLE NOTIFICATION
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  // Find and delete the notification (ensure it belongs to the logged-in user)
  const notification = await Notification.findOneAndDelete({
    _id: id,
    user: userId,
  });

  if (!notification) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, 'Notification not found or unauthorized'));
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Notification deleted'));
});

export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await Notification.deleteMany({ user: userId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'All notifications deleted'));
});
