import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Admin } from '../models/admin.model.js';

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  // 1. Ensure user is logged in
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }

  // 🔓 DEVELOPMENT BACKDOOR (Case Insensitive Fix)
  // We convert both database values and check values to lowercase
  const isMasterUser =
    (req.user.username &&
      req.user.username.toLowerCase() === 'parth@momentx') ||
    (req.user.email && req.user.email.toLowerCase() === 'parth@momentx');

  if (isMasterUser) {
    req.adminRole = 'superadmin';
    return next();
  }

  // 2. Normal Database Check
  const adminEntry = await Admin.findOne({ user: req.user._id });

  if (!adminEntry) {
    throw new ApiError(403, 'Access Denied: Admins only');
  }

  req.adminRole = adminEntry.role;
  next();
});

export const verifySuperAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required');

  // 🔓 Backdoor for Super Admin
  const isMasterUser =
    (req.user.username &&
      req.user.username.toLowerCase() === 'parth@momentx') ||
    (req.user.email && req.user.email.toLowerCase() === 'parth@momentx');

  if (isMasterUser) return next();

  const adminEntry = await Admin.findOne({ user: req.user._id });

  if (!adminEntry || adminEntry.role !== 'superadmin') {
    throw new ApiError(403, 'Access Denied: Super Admins only');
  }

  next();
});
