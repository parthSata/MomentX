import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { uploadInCloudinary } from '../utils/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { sendEmail } from '../utils/sendEmail.js';
import { sendNotification } from '../utils/Notification.js';

const cookieOptions = {
  httpOnly: true,
  secure: true, // Always true for Render/HTTPS
  sameSite: 'None', // Always None for cross-domain (Vercel -> Render)
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, 
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // We return the user instance too, so we can save it later in the controller
    return { accessToken, refreshToken, user };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token',
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  if (
    !name?.trim() ||
    !username?.trim() ||
    !email?.trim() ||
    !password?.trim()
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(400, 'User already exists');
  }

  const userData = {
    name: name.trim(),
    username: username.trim(),
    email: email.trim(),
    password,
    profilePic: '',
  };

  if (req.files?.profilePic?.length > 0) {
    const uploadResult = await uploadInCloudinary(req.files.profilePic[0].path);
    if (uploadResult) userData.profilePic = uploadResult.secure_url;
  }

  const newUser = new User(userData);
  await newUser.save();

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    newUser._id,
  );

  const loggedInUser = await User.findById(newUser._id).select(
    '-password -refreshToken',
  );

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(201, 'User registered successfully', {
        user: loggedInUser,
        accessToken,
      }),
    );
});

const sendRegistrationOTP = asyncHandler(async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    throw new ApiError(400, 'Email and Username are required');
  }

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { username: username.toLowerCase().trim() }],
  });

  if (existingUser && existingUser.isVerified) {
    throw new ApiError(400, 'User already exists and is verified.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  const message = `Welcome to MomentX! Your verification code is: ${otp}. It expires in 15 minutes.`;
  
  // ✅ Attempt sending email BEFORE committing major DB changes to prevent orphan records on timeout
  const isSent = await sendEmail(email.trim(), 'Verify your MomentX Account', message);

  if (!isSent) {
    throw new ApiError(500, 'Email service unreachable. Please try again in a few minutes.');
  }

  if (existingUser) {
    existingUser.emailOTP = otp;
    existingUser.emailOTPExpires = otpExpiry;
    await existingUser.save({ validateBeforeSave: false });
  } else {
    await User.create({
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: "TEMP_PWD_" + Math.random().toString(36).slice(-8),
      emailOTP: otp,
      emailOTPExpires: otpExpiry,
      isVerified: false,
      name: username
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, 'OTP sent successfully.'));
});

// --- 2. VERIFY & REGISTER (Step 2) ---
const verifyOTPAndRegister = asyncHandler(async (req, res) => {
  const { name, username, email, password, otp, phone } = req.body;

  if (!otp || !email) throw new ApiError(400, 'OTP and Email are required');

  // Verify OTP from database
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    emailOTP: otp,
    emailOTPExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Finalize Registration
  user.name = name;
  user.username = username.toLowerCase().trim();
  user.password = password; // Will be hashed by pre-save hook
  user.phone = phone;
  user.isVerified = true;
  user.emailOTP = undefined;
  user.emailOTPExpires = undefined;

  if (req.files?.profilePic?.length > 0) {
    const uploadResult = await uploadInCloudinary(req.files.profilePic[0].path);
    if (uploadResult) user.profilePic = uploadResult.secure_url;
  }

  await user.save();

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );

  return res
    .status(201)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(201, 'User verified and registered successfully', {
        user: loggedInUser,
        accessToken,
      }),
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, 'Email and password required');

  // Support login via email or username
  const sanitizedInput = email.toLowerCase().trim();
  const user = await User.findOne({ 
    $or: [{ email: sanitizedInput }, { username: sanitizedInput }]
  }).select('+password');

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id,
  );

  user.isOnline = true;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  );

  return res
    .status(200)
    .cookie('accessToken', accessToken, cookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, 'Login successful', {
        user: loggedInUser,
        accessToken,
      }),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (userId) {
    await User.findByIdAndUpdate(userId, {
      $set: {
        isOnline: false,
        lastSeen: new Date(),
        refreshToken: undefined,
      },
    });
  }

  return res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .clearCookie('refreshToken', cookieOptions)
    .json(new ApiResponse(200, 'Logged out successfully', {}));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request: No token');
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decoded._id);
    if (!user) throw new ApiError(401, 'Invalid refresh token');

    // Security Check: Ensure the token matches what is in the DB
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    // ✅ THE FIX: Generate NEW Access Token, but REUSE the OLD Refresh Token
    // This stops the "race condition" where the token changes while other requests are pending.
    const accessToken = user.generateAccessToken();
    const newRefreshToken = incomingRefreshToken;

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      path: '/',
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, {
        ...options,
        maxAge: 24 * 60 * 60 * 1000,
      }) // 1 Day
      .cookie('refreshToken', newRefreshToken, {
        ...options,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }) // 30 Days
      .json(
        new ApiResponse(200, 'Access token refreshed', {
          accessToken,
          refreshToken: newRefreshToken,
        }),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const searchUser = asyncHandler(async (req, res) => {
  // ✅ FIX: Extract either 'query' or 'username' from req.query
  const searchQuery = req.query.query || req.query.username;
  const currentUserId = req.user._id;

  if (!searchQuery || searchQuery.trim() === '') {
    return res.status(200).json(new ApiResponse(200, [], 'No query provided'));
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: currentUserId } }, // Exclude self
      {
        $or: [
          { username: { $regex: searchQuery.trim(), $options: 'i' } },
          { name: { $regex: searchQuery.trim(), $options: 'i' } },
        ],
      },
    ],
  })
    .select('name username profilePic isVerified isOnline') // ✅ Added isOnline for chat UI
    .limit(10);

  return res
    .status(200)
    .json(new ApiResponse(200, users, 'Users fetched successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, bio, website } = req.body;

  // 2. Validate mandatory fields
  if (!name?.trim() || !username?.trim()) {
    throw new ApiError(400, 'Name and Username are required');
  }

  const userId = req.user?._id;

  // 3. Check for unique username (if it's being changed)
  const existingUser = await User.findOne({
    username: username.toLowerCase().trim(),
    _id: { $ne: userId }, // Exclude current user
  });

  if (existingUser) {
    throw new ApiError(409, 'Username already taken');
  }

  // 4. Prepare Update Object
  const updateData = {
    name: name.trim(),
    username: username.toLowerCase().trim(),
    bio: bio || '',
    website: website || '',
  };

  // 5. Handle File Upload
  // Since route uses upload.fields([{ name: "profilePic" }])
  // The file will be in req.files.profilePic[0]
  if (req.files && req.files.profilePic && req.files.profilePic.length > 0) {
    const localFilePath = req.files.profilePic[0].path;

    const avatar = await uploadInCloudinary(localFilePath);

    if (!avatar) {
      throw new ApiError(500, 'Error uploading image');
    }

    updateData.profilePic = avatar.secure_url;
  }

  // 6. Update Database
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }, // Return updated doc
  ).select('-password -refreshToken');

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, 'Profile updated successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, 'User not authenticated');
  }

  const userData = await User.findById(user._id).select(
    '-password -refreshToken',
  );
  if (!userData) {
    throw new ApiError(404, 'User not found');
  }

  const postsCount = await Post.countDocuments({ user: user._id });

  // Filter out duplicates and self-references
  const cleanFollowers = [...new Set((userData.followers || []).map(id => id.toString()))]
    .filter(id => id !== userData._id.toString());
  const cleanFollowing = [...new Set((userData.following || []).map(id => id.toString()))]
    .filter(id => id !== userData._id.toString());

  const validFollowersDocs = await User.find({ _id: { $in: cleanFollowers } }).select('_id');
  const validFollowingDocs = await User.find({ _id: { $in: cleanFollowing } }).select('_id');

  const validFollowersIds = validFollowersDocs.map(doc => doc._id.toString());
  const validFollowingIds = validFollowingDocs.map(doc => doc._id.toString());

  const userResponse = {
    _id: userData._id.toString(),
    username: userData.username,
    email: userData.email,
    name: userData.name, 
    bio: userData.bio || '', 
    website: userData.website || '', 
    profilePic: userData.profilePic || '',
    status: userData.status,
    isOnline: userData.isOnline,
    followers: validFollowersIds,
    following: validFollowingIds,
    posts: userData.posts,
    postsCount: postsCount,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, 'User fetched successfully', { user: userResponse }),
    );
});

const getAllUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('_id username profilePic isOnline name')
    .limit(20)
    .lean();

  const formattedUsers = users.map((user) => ({
    ...user,
    _id: user._id.toString(),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, 'Users fetched successfully', formattedUsers));
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Validation
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // 2. CHECK: Does the account exist in MongoDB?
  const user = await User.findOne({ email });

  if (!user) {
    // 🚨 USER DOES NOT EXIST
    // We throw a 404 so the Frontend knows to show "Account not found"
    throw new ApiError(404, 'Account does not exist. Please Sign up.');
  }

  // 3. Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 4. Save to DB
  user.resetPasswordOTP = otp;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
  await user.save({ validateBeforeSave: false });

  // 5. CHECK: Does the email address actually exist / can receive mail?
  const message = `Your Password Reset OTP is: ${otp}. It expires in 15 minutes.`;

  try {
    const isSent = await sendEmail(
      user.email,
      'Password Reset Request',
      message,
    );

    if (!isSent) {
      // If sendEmail returned false (internal logic)
      throw new Error('Email sending failed internally');
    }
  } catch (error) {
    // 🚨 EMAIL SENDING FAILED
    // If Nodemailer fails (e.g., invalid domain "gmaillll.com"), we catch it here

    // Clean up the DB (remove the OTP since user didn't get it)
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Throw specific error to Frontend
    throw new ApiError(
      400,
      'Failed to send email. The address might be invalid or unreachable.',
    );
  }

  // 6. Success
  return res
    .status(200)
    .json(new ApiResponse(200, 'OTP sent successfully. Check your inbox.', {}));
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }

  const user = await User.findOne({
    email,
    resetPasswordOTP: otp,
    resetPasswordExpires: { $gt: Date.now() }, // Check if expiry time is in the future
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Update Password
  // Note: Your pre('save') hook in the model will automatically hash this password!
  user.password = newPassword;

  // Clear OTP fields
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Password reset successfully. You can now login.',
        {},
      ),
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // 1. Extract data (Frontend sends 'name', not 'displayName')
  const { name, username, bio, website } = req.body;

  // 2. Validate essential data
  if (!name || !username) {
    throw new ApiError(400, 'Name and Username are required');
  }

  const userId = req.user?._id;

  // 3. Check if Username is taken (if changed)
  // We check if a user exists with this username AND it is NOT the current user
  const existingUser = await User.findOne({
    username: username.toLowerCase(),
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new ApiError(409, 'Username already taken');
  }

  // 4. Prepare Update Object
  const updateData = {
    name,
    username: username.toLowerCase(),
    bio: bio || '',
    website: website || '',
  };

  const profileLocalPath = req.file?.path;

  if (profileLocalPath) {
    const avatar = await uploadInCloudinary(profileLocalPath);

    if (!avatar) {
      throw new ApiError(500, 'Error uploading image');
    }

    updateData.profilePic = avatar.secure_url;
  }

  // 6. Update Database
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: updateData,
    },
    { new: true }, // Returns the updated document
  ).select('-password -refreshToken');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Account details updated successfully'));
});

const toggleFollowUser = asyncHandler(async (req, res) => {
  const { id } = req.params; // The ID of the user to follow/unfollow
  const currentUserId = req.user._id;

  if (id === currentUserId.toString()) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const targetUser = await User.findById(id);
  const currentUser = await User.findById(currentUserId);

  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  // Check if already following
  const isFollowing = currentUser.following.includes(id);

  if (isFollowing) {
    // Unfollow logic
    await User.findByIdAndUpdate(currentUserId, { $pull: { following: id } });
    await User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isFollowing: false }, 'Unfollowed successfully'),
      );
  } else {
    // Follow logic
    await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: id } });
    await User.findByIdAndUpdate(id, { $addToSet: { followers: currentUserId } });

    // ✅ SEND NOTIFICATION (New Follower)
    await sendNotification({
      req,
      receiverId: id, // The user being followed
      type: 'follow',
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isFollowing: true }, 'Followed successfully'),
      );
  }
});

// --- 🆕 2. GET USER FOLLOWERS ---
const getUserFollowers = asyncHandler(async (req, res) => {
  const { id } = req.params; // User ID whose followers we want to see

  const user = await User.findById(id).populate(
    'followers',
    'name username profilePic isVerified',
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const validFollowers = user.followers.filter(
    (f) => f._id.toString() !== id.toString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, validFollowers, 'Followers fetched successfully'),
    );
});

// --- 🆕 3. GET USER FOLLOWING ---
const getUserFollowing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).populate(
    'following',
    'name username profilePic isVerified',
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const validFollowing = user.following.filter(
    (f) => f._id.toString() !== id.toString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        validFollowing,
        'Following list fetched successfully',
      ),
    );
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select(
    'name username profilePic isOnline',
  );

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, 'User not found'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User details fetched'));
});

const getUserByUsername = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user?._id;
  const user = await User.findOne({ username }).select(
    '-password -refreshToken',
  );
  if (!user) throw new ApiError(404, 'User not found');

  const postsCount = await Post.countDocuments({ user: user._id });

  // ✅ FIX: Strict ID Filtering and deduplication
  const validFollowers = [...new Set((user.followers || []).map(id => id.toString()))].filter(
    (id) => id !== user._id.toString(),
  );
  const validFollowing = [...new Set((user.following || []).map(id => id.toString()))].filter(
    (id) => id !== user._id.toString(),
  );

  const activeFollowersCount = await User.countDocuments({ _id: { $in: validFollowers } });
  const activeFollowingCount = await User.countDocuments({ _id: { $in: validFollowing } });

  const userProfile = {
    _id: user._id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    website: user.website,
    profilePic: user.profilePic,
    isVerified: user.isVerified,
    followersCount: activeFollowersCount, // ✅ Added Clean Count
    followingCount: activeFollowingCount, // ✅ Added Clean Count
    postsCount,
    isFollowing: validFollowers.some(
      (id) => id.toString() === currentUserId?.toString(),
    ),
  };
  return res
    .status(200)
    .json(new ApiResponse(200, userProfile, 'Fetched Profile'));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Both current and new passwords are required');
  }

  const user = await User.findById(req.user._id).select('+password');

  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, 'Invalid current password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;
  const currentUser = await User.findById(currentUserId).select('following');
  const excludeIds = [
    ...(currentUser.following || []).map((id) => id.toString()),
    currentUserId.toString(),
  ];

  const suggestions = await User.aggregate([
    {
      $match: {
        _id: { $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)) },
        $or: [{ isHidden: false }, { isHidden: { $exists: false } }],
      },
    },
    { $sample: { size: 10 } },
    {
      $project: {
        _id: 1,
        username: 1,
        displayName: '$name',
        avatar: '$profilePic',
        isVerified: 1,
        followersCount: { $size: { $ifNull: ['$followers', []] } },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, suggestions, 'Suggestions fetched'));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  searchUser,
  refreshToken,
  updateProfile,
  getAllUsers,
  changeCurrentPassword,
  forgotPassword,
  resetPassword,
  updateAccountDetails,
  toggleFollowUser,
  getUserFollowers,
  getUserFollowing,
  getUserById,
  getUserByUsername,
  verifyOTPAndRegister,
  sendRegistrationOTP,
  getSuggestedUsers,
};
