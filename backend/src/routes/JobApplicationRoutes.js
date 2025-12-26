import express from "express";
import {
  getAllJobApplications,
  getJobApplicationById,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  requestJobCompletion,
  confirmJobCompletion,
  cancelJobCompletionRequest,
} from "../controllers/JobApplicationController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllJobApplications);
router.get("/:id", authRequired, getJobApplicationById);
router.post("/", authRequired, createJobApplication);
router.put("/:id", authRequired, updateJobApplication);
router.delete("/:id", authRequired, deleteJobApplication);

// Job completion endpoints
router.post("/:id/request-completion", authRequired, requestJobCompletion);
router.post("/:id/confirm-completion", authRequired, confirmJobCompletion);
router.post("/:id/cancel-completion", authRequired, cancelJobCompletionRequest);

export default router;
