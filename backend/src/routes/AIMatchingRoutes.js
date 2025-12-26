import express from "express";
import {
  matchJobToInterpreters,
  scoreSuitability,
  batchScoreSuitability,
  filterApplications,
  aiServiceHealth,
} from "../controllers/AIMatchingController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Health check (public)
router.get("/health", aiServiceHealth);

// AI Matching endpoints (protected)
router.get("/job/:jobId/match", authRequired, matchJobToInterpreters);
router.get(
  "/score/:jobId/:interpreterId",
  authRequired,
  scoreSuitability
);
router.post(
  "/score/batch",
  authRequired,
  batchScoreSuitability
);
router.get(
  "/filter-applications/:jobId",
  authRequired,
  filterApplications
);

export default router;

