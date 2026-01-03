import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // Assuming you have this
import { getCurrentUser } from "../controllers/user.controller.js"; // Reuse user controller

const router = express.Router();

// ✅ Matches frontend: api.get("/auth/me")
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;
