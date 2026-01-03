import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// 1. Ensure uploads directory exists BEFORE upload
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// 3. Upload Endpoint
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded" });
  }

  // ✅ Return Absolute URL
  // This constructs: http://localhost:3000/uploads/file-123.jpg
  const fullUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

  res.send({
    url: fullUrl,
    message: "File uploaded successfully",
  });
});

export default router;
