import { Story } from "../models/story.model.js";
import {
  uploadInCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

// @desc    Create a new story
// @route   POST /api/v1/stories
export const createStory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1. Check if file is provided by Multer
    const localFilePath = req.file?.path;
    if (!localFilePath) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 2. Upload to Cloudinary
    console.log("Uploading to Cloudinary...");
    const cloudResponse = await uploadInCloudinary(localFilePath);

    if (!cloudResponse) {
      return res.status(500).json({ message: "Failed to upload to cloud" });
    }

    // 3. Determine Type (image/video)
    const type = cloudResponse.resource_type === "video" ? "video" : "image";

    // 4. Save to DB with Public ID
    const newStory = new Story({
      user: req.user._id,
      type: type,
      url: cloudResponse.secure_url, // Cloud URL
      publicId: cloudResponse.public_id, // ✅ Save Public ID
      viewers: [],
    });

    await newStory.save();
    await newStory.populate("user", "username avatar displayName");

    console.log("✅ Story Created:", newStory._id);
    res.status(201).json({ success: true, data: newStory });
  } catch (error) {
    console.error("❌ Create Story Error:", error);
    res
      .status(500)
      .json({ message: "Failed to create story", error: error.message });
  }
};

// ... keep getStories, viewStory, deleteStory as they were ...
export const getStories = async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate("user", "username avatar displayName")
      .sort({ createdAt: -1 });

    const currentUserId = req.user?._id?.toString();
    const formattedStories = stories.map((story) => ({
      ...story.toObject(),
      isViewed: currentUserId ? story.viewers.includes(currentUserId) : false,
      viewers: undefined,
    }));

    res.status(200).json({ success: true, data: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });

    // Check ownership
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 1. Delete from Cloudinary
    if (story.publicId) {
      await deleteFromCloudinary(story.publicId, story.type); // Pass type (video/image)
    }

    // 2. Delete from DB
    await story.deleteOne();

    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    await Story.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { viewers: req.user._id } },
      { new: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
