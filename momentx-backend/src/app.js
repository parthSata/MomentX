import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { ApiError } from "./utils/ApiError.js";
import { initStoryCleanup } from "../cron/StoryCleanup.js";

// Routes
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import storyRoutes from "./routes/story.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRouter from "./routes/notification.routes.js"; // ✅ Import

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// 2. Handle Socket Connections
io.on("connection", (socket) => {
  socket.on("join_user_room", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

initStoryCleanup();

// Path Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create 'public/temp' Directory
const publicTempDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(publicTempDir)) {
  fs.mkdirSync(publicTempDir, { recursive: true });
}

// Middleware
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

// 3. Attach IO to Request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve Static Files
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => res.status(200).json({ message: "API Running" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/stories", storyRoutes);
app.use("/api/v1/notifications", notificationRouter); // ✅ Use Notification Router

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

// ❌ REMOVED: server.listen(...) from here.
// It is already being called in index.js

export { app, server };
