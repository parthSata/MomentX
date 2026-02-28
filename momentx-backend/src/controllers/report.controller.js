// src/controllers/report.controller.js
import { Report } from '../models/report.model.js';
import { Post } from '../models/post.model.js';
import { Reel } from '../models/reel.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ✅ Create a new report
export const createReport = asyncHandler(async (req, res) => {
  const { targetId, targetType, reason, description } = req.body;
  const userId = req.user._id;

  if (!targetId || !targetType || !reason) {
    throw new ApiError(400, 'Target ID, Target Type, and Reason are required');
  }

  // Optional: Verify the target actually exists before creating the report
  let targetExists = false;
  if (targetType === 'post') {
    // Need to check both Post and Reel since 'post' covers both in UI
    targetExists =
      (await Post.exists({ _id: targetId })) ||
      (await Reel.exists({ _id: targetId }));
  } else if (targetType === 'comment') {
    targetExists = await Comment.exists({ _id: targetId });
  } else if (targetType === 'user') {
    targetExists = await User.exists({ _id: targetId });
  }

  if (!targetExists) {
    throw new ApiError(404, `${targetType} not found`);
  }

  const report = await Report.create({
    reportedBy: userId,
    targetType,
    targetId,
    reason,
    description: description || '',
    status: 'pending',
  });

  return res
    .status(201)
    .json(new ApiResponse(201, report, 'Report submitted successfully'));
});
