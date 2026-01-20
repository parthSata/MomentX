import express from "express";
import {
  getChats,
  getMessages,
  sendMessage,
  uploadChatMedia, // ✅ Import this
  deleteMessages,
  createChat,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"; // ✅ Import Multer

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getChats).post(createChat); // ✅ Handles creating/fetching a chat by userId
router.route("/:chatId/messages").get(getMessages);
router.route("/send/:receiverId").post(sendMessage);

// ✅ ADD THIS ROUTE TO FIX 404
router.route("/upload").post(upload.single("file"), uploadChatMedia);
router.post("/delete-messages", verifyJWT, deleteMessages);
// ✅ Routes

export default router;
