import express from "express";
import {
  getAllJobRequiredCertificates,
  getJobRequiredCertificateById,
  createJobRequiredCertificate,
  updateJobRequiredCertificate,
  deleteJobRequiredCertificate,
} from "../controllers/JobRequiredCertificateController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllJobRequiredCertificates);
router.get("/:id", getJobRequiredCertificateById);
router.post("/", authRequired, createJobRequiredCertificate);
router.put("/:id", authRequired, updateJobRequiredCertificate);
router.delete("/:id", authRequired, deleteJobRequiredCertificate);

export default router;
