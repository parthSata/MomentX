import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY, // Fixed typo: usually API_SECRET
});


const uploadInCloudinary = async (localFilePath, resourceType = "auto") => {
  try {
    if (!localFilePath) return null;

    // Upload file
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType, // "video" or "image" or "auto"
      // Optional: Generate a thumbnail automatically for videos
      eager: resourceType === "video" ? [{ width: 300, height: 300, crop: "pad", format: "jpg" }] : undefined,
    });

    // Delete local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return uploadResult;
  } catch (error) {
    console.error("❌ Cloudinary Upload Failed:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("❌ Cloudinary Delete Failed:", error);
    return null;
  }
};

export { uploadInCloudinary, deleteFromCloudinary };
