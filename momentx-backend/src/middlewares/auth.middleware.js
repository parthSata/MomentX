import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Unauthorized: No access token");

  let decodedInfo;
  try {
    decodedInfo = jwt.verify(token, process.env.VITE_ACCESS_TOKEN_SECRET);
    if (!decodedInfo?._id)
      throw new ApiError(401, "Invalid access token: No user ID");
  } catch (error) {
    throw new ApiError(401, `Invalid access token: ${error.message}`);
  }

  const user = await User.findById(decodedInfo._id).select(
    "-password -refreshToken"
  );
  if (!user) throw new ApiError(401, "Invalid access token: User not found");

  req.user = user;
  next();
});

export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      );
    }
    // If the user's role is allowed, proceed to the next middleware
    next();
  };
};
