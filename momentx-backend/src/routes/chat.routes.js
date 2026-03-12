import express from 'express';
import {
  getChats,
  getMessages,
  sendMessage,
  uploadChatMedia, // ✅ Import this
  deleteMessages,
  createChat,
  cleanDuplicateChats,
  deleteChat,
  createGroupChat,
  updateGroupMembers,
  getGroupInfo,
  toggleGroupAdmin,
  updateGroupDetails,
  leaveGroup,
  clearChatMessages,
} from '../controllers/chat.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js'; // ✅ Import Multer

const router = express.Router();

router.use(verifyJWT);

router.route('/').get(getChats).post(createChat); // ✅ Handles creating/fetching a chat by userId
router.route('/:chatId/messages').get(getMessages);
router.route('/send/:receiverId').post(sendMessage);

// ✅ ADD THIS ROUTE TO FIX 404
router.route('/upload').post(upload.single('file'), uploadChatMedia);
router.post('/delete-messages', verifyJWT, deleteMessages);
// ✅ Routes
router.post('/cleanup', verifyJWT, cleanDuplicateChats);
router.route('/group').post(verifyJWT, createGroupChat);
router.route('/group/:chatId/members').patch(verifyJWT, updateGroupMembers);
router.route('/group/:chatId/details').patch(verifyJWT, upload.single('groupAvatar'), updateGroupDetails);
router.route('/group/:chatId').get(verifyJWT, getGroupInfo);
router.route('/group/:chatId/admin').patch(verifyJWT, toggleGroupAdmin);
router.route('/group/:chatId/leave').patch(verifyJWT, leaveGroup);

router.route('/:chatId')
  .delete(verifyJWT, deleteChat);

router.route('/:chatId/messages')
  .delete(verifyJWT, clearChatMessages);


export default router;
