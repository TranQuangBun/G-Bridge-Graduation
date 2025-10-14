import express from "express";
import {
  getMyCertifications,
  addCertification,
  updateCertification,
  uploadCertificationImage,
  deleteCertification,
} from "../controllers/certificationController.js";
import { authRequired } from "../middleware/auth.js";
import uploadCertification from "../middleware/uploadCertification.js";

const router = express.Router();

// All routes require authentication
router.get("/", authRequired, getMyCertifications);
router.post("/", authRequired, addCertification);
router.put("/:id", authRequired, updateCertification);
router.post(
  "/:id/upload-image",
  authRequired,
  uploadCertification.single("image"),
  uploadCertificationImage
);
router.delete("/:id", authRequired, deleteCertification);

export default router;
