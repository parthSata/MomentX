import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { ApiError } from './utils/ApiError.js';
import { initStoryCleanup } from '../cron/storyCleanup.js';
import { User } from './models/user.model.js';

import userRouter from './routes/user.routes.js';
import postRouter from './routes/post.routes.js';
import storyRoutes from './routes/story.routes.js';
import authRoutes from './routes/auth.routes.js';
import notificationRouter from './routes/notification.routes.js';
import chatRouter from './routes/chat.routes.js';
import reelRouter from './routes/reel.routes.js';
import exploreRouter from './routes/explore.routes.js';
import commentRouter from './routes/comment.route.js';
import adminRouter from './routes/admin.routes.js';
import activityRouter from './routes/activity.routes.js';
import reportRouter from './routes/report.routes.js';

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      'https://momentx-live.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  // ────────────────────────────────────────────────
  // 1. User joins their personal room (for private calls / online status)
  // ────────────────────────────────────────────────
  socket.on('join_user_room', async (userId) => {
    try {
      socket.join(userId);
      socket.userId = userId;
      // Mark online
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.broadcast.emit('user_online', userId);

      // ─── Call handlers (unchanged) ───
      socket.on('callUser', ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit('callUser', { signal: signalData, from, name });
      });

      socket.on('answerCall', (data) => {
        io.to(data.to).emit('callAccepted', data.signal);
      });

      socket.on('endCall', ({ to }) => {
        io.to(to).emit('callEnded');
      });
    } catch (e) {
      console.error('Join user room error:', e);
    }
  });

  // ────────────────────────────────────────────────
  // 2. NEW: Join a specific chat room when opening a conversation
  //    Client should emit this when ChatPage mounts
  // ────────────────────────────────────────────────
  socket.on('join_chat', (chatId) => {
    if (!chatId) return;

    socket.join(chatId);
  });

  // ────────────────────────────────────────────────
  // 3. Typing indicators — broadcast to the chat room only (not to self)
  // ────────────────────────────────────────────────
  socket.on('typing', (data) => {
    if (!data.chatId || !data.senderId) return;

    // Send to everyone in the chat room EXCEPT the sender
    socket.to(data.chatId).emit('typing', {
      chatId: data.chatId,
      senderId: data.senderId,
    });
  });

  socket.on('stopTyping', (data) => {
    if (!data.chatId || !data.senderId) return;
    socket.to(data.chatId).emit('stopTyping', {
      chatId: data.chatId,
      senderId: data.senderId,
    });
  });

  // ────────────────────────────────────────────────
  // Disconnect logic (unchanged — good job with multi-tab handling)
  // ────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    if (socket.userId) {
      const matchingSockets = await io.in(socket.userId).fetchSockets();
      const isTrulyDisconnected = matchingSockets.length === 0;

      if (isTrulyDisconnected) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
        socket.broadcast.emit('user_offline', socket.userId);
      } else {
        console.log(
          `User ${socket.userId} still has ${matchingSockets.length} connections`,
        );
      }
    }
  });
});

initStoryCleanup();

// Path Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicTempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(publicTempDir)) {
  fs.mkdirSync(publicTempDir, { recursive: true });
}

// Middleware
app.use(
  cors({
    origin: [
      'https://momentx-live.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Attach IO
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.static('public'));

// Routes
app.get('/', (req, res) => res.status(200).json({ message: 'API Running' }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/stories', storyRoutes);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/chats', chatRouter);
app.use('/api/v1/reels', reelRouter); // ✅ Reel routes
app.use('/api/v1/explore', exploreRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/reports', reportRouter); // ✅ Report routes

// Error Handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json({ success: err.success, message: err.message });
  }
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

export { app, server };
