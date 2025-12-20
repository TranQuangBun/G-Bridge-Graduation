import express from "express";
import {
  register,
  registerAdmin,
  login,
  me,
  updateUserProfile,
  updateInterpreterProfile,
  uploadAvatar,
  uploadBusinessLicense,
  toggleActiveStatus,
  forgotPassword,
  resetPassword,
} from "../controllers/AuthController.js";
import { authRequired } from "../middleware/auth.js";
import {
  uploadAvatar as uploadAvatarMiddleware,
  uploadBusinessLicense as uploadBusinessLicenseMiddleware,
} from "../middleware/Upload.js";

const router = express.Router();

router.post("/register", register);
router.post("/register-admin", registerAdmin);
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
router.post(
  "/upload-business-license",
  authRequired,
  uploadBusinessLicenseMiddleware.single("businessLicense"),
  uploadBusinessLicense
);
router.put("/toggle-active-status", authRequired, toggleActiveStatus);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
