import express from "express";
import {
  register,
  login,
  me,
  updateUserProfile,
  updateInterpreterProfile,
  uploadAvatar,
  toggleActiveStatus,
} from "../controllers/AuthController.js";
import { authRequired } from "../middleware/auth.js";
import { uploadAvatar as uploadAvatarMiddleware } from "../middleware/Upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.put("/profile", authRequired, updateUserProfile);
router.put("/interpreter-profile", authRequired, updateInterpreterProfile);
router.post(
  "/upload-avatar",
  authRequired,
  uploadAvatarMiddleware.single("avatar"),
  uploadAvatar
);
router.put("/toggle-active-status", authRequired, toggleActiveStatus);

export default router;
