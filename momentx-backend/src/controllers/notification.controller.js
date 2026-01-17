import Notification from "../models/Notification.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET USER NOTIFICATIONS
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("sender", "username profilePic")
    .populate("post", "images") // Populates post images
    // ✅ CRITICAL FIX: You MUST populate story for the frontend to see it
    .populate("story", "url type");

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, "Notifications fetched"));
});

// MARK ALL AS READ
export const markNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notifications marked as read"));
});
