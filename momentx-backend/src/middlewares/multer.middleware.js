import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Define absolute path to avoid relative path issues
const uploadDir = path.join(process.cwd(), "public", "temp");

// 2. Ensure directory exists synchronously on startup
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize filename to prevent issues with special characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-");
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + safeName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});
