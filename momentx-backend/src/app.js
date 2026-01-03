import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ApiError } from "./utils/ApiError.js";
import { initStoryCleanup } from "../cron/StoryCleanup.js";

// Routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import storyRoutes from "./routes/story.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const server = http.createServer(app);
initStoryCleanup();
// --- 1. Path Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 2. Create 'public/temp' Directory ---
// This prevents the 500 Error during upload
const publicTempDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(publicTempDir)) {
  fs.mkdirSync(publicTempDir, { recursive: true });
  console.log("✅ Created public/temp directory");
}

// --- 3. Middleware ---
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// --- 4. Serve Static Files (Fixes Broken Images) ---
// Files in 'public/temp' become accessible at 'http://localhost:3000/temp/image.jpg'
app.use(express.static("public"));

// --- 5. Routes ---
app.get("/", (req, res) => res.status(200).json({ message: "API Running" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/stories", storyRoutes);

// Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ success: err.success, message: err.message });
  }
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

export { app, server };
