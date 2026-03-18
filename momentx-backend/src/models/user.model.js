import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // <--- ✅ ADDED MISSING IMPORT

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    profilePicThumbnail: { type: String, default: '' },
    website: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    resetPasswordOTP: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailOTP: String,
    emailOTPExpires: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    refreshToken: {
      type: String,
    },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// --- 🛠️ FIX IS HERE ---
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  // Ensure your .env file has ACCESS_TOKEN_SECRET (without VITE_ prefix is standard for backend)
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model('User', userSchema);
