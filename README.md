# MomentX - Modern Social Media Platform

MomentX is a premium, real-time social media application built with a focus on immersive user experience, dynamic interactions, and robust messaging capabilities.

![MomentX Banner](https://placehold.co/1200x400/6366f1/ffffff?text=MomentX+Social+Media)

## 🚀 Features

### 📱 Social Engagement
- **Dynamic Feed**: Explore posts and interactive content from users you follow.
- **Reels**: Short-form video content with smooth transitions and engagement features.
- **Social Sharing**: Share posts and reels directly into private or group chats.
- **User Discovery**: Search for users and follow system with real-time count updates.

### 💬 Advanced Messaging System
- **Real-time Chat**: Powered by Socket.io for instantaneous communication.
- **Group Chats**: Create and manage groups with advanced admin controls.
- **Media Support**: Send and record images, videos, and voice messages seamlessly.
- **Security**: Message encryption for private and group conversations.
- **Message Management**: 
  - Clear entire chat history.
  - Multi-select and bulk delete messages.
  - Seen receipts (Single/Double check marks).

### 🛠 Group Administration
- **Admin Panel**: Comprehensive controls for group owners.
- **Member Management**: Add, remove, or toggle admin status for participants.
- **Group Identity**: Customizable group names and avatars with Cloudinary integration.
- **Tabs Interface**: Differentiated views for Member lists and Group Settings.

## 💻 Tech Stack

### Frontend
- **React 19 & TypeScript**: Core UI logic and type safety.
- **Vite**: High-performance build tool.
- **Tailwind CSS & Framer Motion**: Sleek, responsive design with premium animations.
- **Shadcn UI (Radix)**: Accessible and beautiful UI components.
- **TanStack Query**: Efficient server-state management.
- **Socket.io-client**: Real-time websocket communication.

### Backend
- **Node.js & Express**: Scalable server-side architecture.
- **MongoDB & Mongoose**: Flexible NoSQL database with advanced aggregation.
- **Socket.io**: Real-time event handling.
- **Cloudinary**: Cloud-based media management and optimization.
- **JWT & Bcrypt**: Secure authentication and password hashing.
- **Nodemailer**: Email services for account recovery and notifications.

## 📂 Project Structure

```text
MomentX/
├── momentx-frontend/       # React application (Vite + TS)
│   ├── src/
│   │   ├── components/     # Reusable UI & Feature components
│   │   ├── hooks/          # Custom React hooks (useChat, etc.)
│   │   ├── pages/          # Main application views
│   │   ├── lib/            # Utilities (Axios, Crypto, etc.)
│   │   └── context/        # Auth and global state
├── momentx-backend/        # Node.js API
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API endpoints
│   │   ├── utils/          # Helpers (AsyncHandler, Cloudinary, etc.)
│   │   └── index.js        # Entry point
```

## 🛠 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Cloudinary credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MomentX
   ```

2. **Backend Setup**
   ```bash
   cd momentx-backend
   npm install
   # Create a .env file based on .env.example
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd momentx-frontend
   npm install
   npm run dev
   ```

## 📄 License
This project is licensed under the ISC License.
