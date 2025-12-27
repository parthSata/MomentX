import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

// Load env variables
dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadInCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log(
        "❌ Error: No local file path provided to uploadInCloudinary"
      );
      return null;
    }


    // Upload an image
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // Delete local file
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    console.error("❌ Cloudinary Upload Failed Error:", error);
    // Attempt to delete local file if it exists
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

export { uploadInCloudinary };
