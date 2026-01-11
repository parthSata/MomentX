import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  markNotificationsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/").get(getNotifications);
router.route("/read").post(markNotificationsRead);

export default router;
