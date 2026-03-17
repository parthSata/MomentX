import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    let token;

    // 🔐 ADMIN ROUTES → ONLY Bearer token
    if (req.originalUrl.startsWith('/api/v1/admin')) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    } else {
      // 👤 USER ROUTES → cookies OR bearer
      token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');
    }

    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new ApiError(500, 'Server Configuration Error');
    }

    const decodedToken = jwt.verify(token, secret);

    // 🔓 STATIC ADMIN (Bypass DB and Ban check)
    if (decodedToken.isStaticAdmin) {
      req.user = {
        _id: decodedToken._id,
        username: 'Parth@MomentX',
        email: 'Parth@MomentX',
        role: 'superadmin',
        isStaticAdmin: true,
      };
      return next();
    }

    // 👤 Normal user flow
    const user = await User.findById(decodedToken._id).select(
      '-password -refreshToken',
    );

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token');
    }

    // 🚫 BAN CHECK
    // If user is suspended AND they are trying to access non-admin routes
    // (We allow admins to access admin routes even if their user profile is weirdly banned, though rare)
    if (
      user.isActive === false &&
      !req.originalUrl.startsWith('/api/v1/admin')
    ) {
      throw new ApiError(
        403,
        // The word "suspended" MUST be here for the frontend check to work
        'Your account has been suspended. Please contact support.',
      );
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid access token');
  }
});

export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw new ApiError(403, 'Forbidden: User role not found.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      );
    }
    next();
  };
};
