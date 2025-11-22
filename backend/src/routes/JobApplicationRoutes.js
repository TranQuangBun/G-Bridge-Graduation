import express from "express";
import {
  getAllJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
} from "../controllers/JobApplicationController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllJobApplications);
router.get("/:id", authRequired, getJobApplicationById);
router.post("/", authRequired, createJobApplication);
router.put("/:id", authRequired, updateJobApplication);
router.delete("/:id", authRequired, deleteJobApplication);

export default router;

