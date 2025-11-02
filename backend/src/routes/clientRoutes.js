import express from "express";
import {
  getClientProfile,
  updateClientProfile,
  uploadBusinessLicense,
  uploadLogo,
  checkProfileCompleteness,
  getVerificationBadge,
} from "../controllers/clientController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Get client profile
router.get("/profile", getClientProfile);

// Update client profile
router.put("/profile", updateClientProfile);

// Upload business license
router.post("/profile/business-license", uploadBusinessLicense);

// Upload company logo
router.post("/profile/logo", uploadLogo);

// Check profile completeness
router.get("/profile/completeness", checkProfileCompleteness);

// Get verification badge (public - for displaying on jobs)
router.get("/:companyId/badge", getVerificationBadge);

export default router;
