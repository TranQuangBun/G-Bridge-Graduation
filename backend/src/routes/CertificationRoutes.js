import express from "express";
import {
  getAllCertifications,
  getCertificationById,
  createCertification,
  updateCertification,
  deleteCertification,
  uploadCertificationImage,
} from "../controllers/CertificationController.js";
import { authRequired } from "../middleware/auth.js";
import { uploadCertification } from "../middleware/Upload.js";

const router = express.Router();

router.get("/", getAllCertifications);
router.get("/:id", getCertificationById);
router.post("/", authRequired, createCertification);
router.put("/:id", authRequired, updateCertification);
router.delete("/:id", authRequired, deleteCertification);
router.post(
  "/:id/upload-image",
  authRequired,
  uploadCertification.single("image"),
  uploadCertificationImage
);

export default router;
