import { Story } from "../models/story.model.js";
import { uploadInCloudinary ,deleteFromCloudinary } from "../utils/cloudinary.js";

// @desc    Create multiple stories
// @route   POST /api/v1/stories
export const createStory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ CHANGED: Check for req.files (array) instead of req.file
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }


    const createdStories = [];

    // Process files in parallel for speed
    const uploadPromises = files.map(async (file) => {
      const localFilePath = file.path;

      // 1. Upload to Cloudinary
      const cloudResponse = await uploadInCloudinary(localFilePath);

      if (!cloudResponse) {
        console.error(`Failed to upload file: ${file.originalname}`);
        return null;
      }

      const type = cloudResponse.resource_type === "video" ? "video" : "image";

      // 2. Create DB Entry
      const newStory = new Story({
        user: req.user._id,
        type: type,
        url: cloudResponse.secure_url,
        publicId: cloudResponse.public_id,
        viewers: [],
      });

      await newStory.save();
      return newStory;
    });

    // Wait for all uploads to finish
    const results = await Promise.all(uploadPromises);

    // Filter out any failed uploads (nulls)
    const successfulStories = results.filter((s) => s !== null);

    // Populate user data for the first one (or all) to return to frontend
    if (successfulStories.length > 0) {
      await Story.populate(successfulStories, {
        path: "user",
        select: "username avatar displayName",
      });
    }

    res.status(201).json({ success: true, data: successfulStories });
  } catch (error) {
    console.error("❌ Create Story Error:", error);
    res
      .status(500)
      .json({ message: "Failed to create stories", error: error.message });
  }
};

// ... keep getStories, viewStory, deleteStory as they were ...
export const getStories = async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: new Date() } })
      .populate("user", "username avatar displayName profilePic")
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
