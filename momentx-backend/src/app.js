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
import { User } from "./models/user.model.js";

// Routes imports...
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import storyRoutes from "./routes/story.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import chatRouter from "./routes/chat.routes.js";

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
});

// 2. Handle Socket Connections
io.on("connection", (socket) => {
  
  socket.on("join_user_room", async (userId) => {
    try {
      socket.join(userId);
      socket.userId = userId; // Store ID for disconnect logic

      console.log(`User connected: ${userId}`);
      
      // Always mark online immediately on join
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit("user_online", userId);
    } catch (e) {
      console.error("Join Error:", e);
    }
  });

  socket.on("disconnect", async () => {
    // Check if we know who this socket belonged to
    if (socket.userId) {
      // ✅ CRITICAL FIX: Check if user has OTHER active sockets
      // This fetches all socket instances currently in the room 'socket.userId'
      const matchingSockets = await io.in(socket.userId).fetchSockets();
      
      // If the array is empty, it means NO sockets are left for this user
      const isTrulyDisconnected = matchingSockets.length === 0;

      if (isTrulyDisconnected) {
        console.log(`User ${socket.userId} is fully offline (0 connections)`);
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
        socket.broadcast.emit("user_offline", socket.userId);
      } else {
        console.log(`User ${socket.userId} disconnected one socket, but is still Online.`);
      }
    }
  });
});

initStoryCleanup();

// ... (Rest of your middleware and routes remain the same) ...

// Path Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicTempDir = path.join(process.cwd(), "public", "temp");
if (!fs.existsSync(publicTempDir)) {
  fs.mkdirSync(publicTempDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Attach IO
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.static("public"));

// Routes
app.get("/", (req, res) => res.status(200).json({ message: "API Running" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/stories", storyRoutes);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/chats", chatRouter);

// Error Handling
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: err.success, message: err.message });
  }
  res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});

export { app, server };