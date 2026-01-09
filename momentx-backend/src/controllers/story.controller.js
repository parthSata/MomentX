import { Story } from "../models/story.model.js";
import {
  uploadInCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

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
      // ✅ Populate viewers details (so we can show the list in frontend)
      .populate("viewers.user", "username avatar displayName profilePic")
      .sort({ createdAt: -1 });

    const currentUserId = req.user?._id?.toString();

    const formattedStories = stories.map((story) => {
      const storyObj = story.toObject();
      return {
        ...storyObj,
        // ✅ Fix check logic for object array
        isViewed: currentUserId
          ? storyObj.viewers.some(
              (v) => v.user?._id.toString() === currentUserId
            )
          : false,
        // We keep the viewers array now because we need it for the UI
        viewers: storyObj.viewers,
      };
    });

    res.status(200).json({ success: true, data: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ message: "Story not found" });

    const alreadyViewed = story.viewers.some(
      (v) => v.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      const newViewerEntry = {
        user: userId,
        viewedAt: new Date(),
      };

      story.viewers.push(newViewerEntry);
      await story.save();

      // ✅ SOCKET DATA PREP
      const viewerDataForSocket = {
        user: {
          _id: req.user._id.toString(), // Ensure string ID
          username: req.user.username,
          displayName: req.user.displayName,
          avatar: req.user.avatar || req.user.profilePic || "",
          profilePic: req.user.avatar || req.user.profilePic || "",
        },
        viewedAt: newViewerEntry.viewedAt,
      };

      if (req.io) {
        req.io.to(story.user.toString()).emit("story_view_updated", {
          storyId: story._id.toString(), // Ensure string ID
          newViewer: viewerDataForSocket,
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("View Story Error:", error);
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
