import { Story } from "../models/story.model.js";
import {
  uploadInCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { sendNotification } from "../utils/Notification.js";

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

    // Check if user already viewed (Avoid duplicates)
    const alreadyViewed = story.viewers.some(
      (v) => v.user.toString() === userId.toString()
    );

    if (!alreadyViewed) {
      const newViewerEntry = {
        user: userId,
        viewedAt: new Date(),
      };

      // 1. Save Viewer to Story Document
      story.viewers.push(newViewerEntry);
      await story.save();

      // 2. Prepare Data for Real-Time View Count (The Eye Icon)
      const viewerDataForSocket = {
        user: {
          _id: req.user._id.toString(),
          username: req.user.username,
          displayName: req.user.displayName,
          avatar: req.user.avatar || req.user.profilePic || "",
          profilePic: req.user.avatar || req.user.profilePic || "",
        },
        viewedAt: newViewerEntry.viewedAt,
      };

      // 3. Emit Real-Time View Update (For the Owner's UI)
      if (req.io) {
        req.io.to(story.user.toString()).emit("story_view_updated", {
          storyId: story._id.toString(),
          newViewer: viewerDataForSocket,
        });
      }

      // 4. ✅ SEND PERSISTENT NOTIFICATION (For the Notification Page)
      await sendNotification({
        req,
        receiverId: story.user, // Notify the Story Owner
        type: "story_view",
        // We pass the story ID separately since we updated the model
        // Note: You might need to update sendNotification utils to accept 'storyId'
        // OR pass it as 'postId' if you want to be lazy, but better to update the utils.
        postId: null,
        commentId: null,
      });

      // *Quick Fix for Utils*: Ensure your sendNotification utils accepts extra fields
      // or simply pass it as a custom object if your utils is flexible.
      // If using the exact code I gave before, update src/utils/notification.js to accept storyId:
      /* // Inside src/utils/notification.js params:
         ... storyId = null ...
         // Inside .create():
         ... story: storyId ...
      */
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

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (story.publicId) {
      await deleteFromCloudinary(story.publicId, story.type);
    }

    await story.deleteOne();

    res.status(200).json({ success: true, message: "Story deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
