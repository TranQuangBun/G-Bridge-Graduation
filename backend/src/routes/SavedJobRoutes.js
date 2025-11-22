import express from "express";
import {
  getAllSavedJobs,
  getSavedJobById,
  createSavedJob,
  deleteSavedJob,
} from "../controllers/SavedJobController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllSavedJobs);
router.get("/:userId/:jobId", authRequired, getSavedJobById);
router.post("/", authRequired, createSavedJob);
router.delete("/:userId/:jobId", authRequired, deleteSavedJob);

export default router;
