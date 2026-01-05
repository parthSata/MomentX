import cron from "node-cron";
import { Story } from "../src/models/story.model.js";
import { deleteFromCloudinary } from "../src/utils/cloudinary.js";

// Run every hour: '0 * * * *'
export const initStoryCleanup = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      // Find stories that have expired (expiresAt < now)
      const expiredStories = await Story.find({
        expiresAt: { $lt: new Date() },
      });

      if (expiredStories.length === 0) return;

      for (const story of expiredStories) {
        // 1. Delete from Cloudinary
        if (story.publicId) {
          await deleteFromCloudinary(story.publicId, story.type);
        }

        // 2. Delete from Database
        await story.deleteOne();
      }
    } catch (error) {
      console.error("❌ Story Cleanup Failed:", error);
    }
  });
};
