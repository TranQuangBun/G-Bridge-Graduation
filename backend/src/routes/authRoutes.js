import express from "express";
import {
  register,
  login,
  me,
  updateUserProfile,
  updateInterpreterProfile,
  uploadAvatar,
} from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.put("/profile", authRequired, updateUserProfile);
router.put("/interpreter-profile", authRequired, updateInterpreterProfile);
router.post(
  "/upload-avatar",
  authRequired,
  upload.single("avatar"),
  uploadAvatar
);

export default router;
