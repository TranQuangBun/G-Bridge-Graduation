import express from "express";
import {
  getJobs,
  getJobById,
  createJob,
  applyForJob,
  toggleSaveJob,
  getSavedJobs,
  getMyApplications,
  getWorkingModes,
  getDomains,
  getLevels,
} from "../controllers/jobController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Lookup data routes (public) - MUST be BEFORE /:id route
router.get("/lookup/working-modes", getWorkingModes);
router.get("/lookup/domains", getDomains);
router.get("/lookup/levels", getLevels);

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected routes (requires authentication)
router.post("/:jobId/apply", authRequired, applyForJob);
router.post("/:jobId/save", authRequired, toggleSaveJob);
router.get("/saved/list", authRequired, getSavedJobs);
router.get("/applications/my", authRequired, getMyApplications);

// Admin routes (requires admin role)
router.post("/", authRequired, createJob);

export default router;
