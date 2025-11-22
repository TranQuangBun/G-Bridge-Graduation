import express from "express";
import {
  getAllJobRequiredLanguages,
  getJobRequiredLanguageById,
  createJobRequiredLanguage,
  updateJobRequiredLanguage,
  deleteJobRequiredLanguage,
} from "../controllers/JobRequiredLanguageController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllJobRequiredLanguages);
router.get("/:id", getJobRequiredLanguageById);
router.post("/", authRequired, createJobRequiredLanguage);
router.put("/:id", authRequired, updateJobRequiredLanguage);
router.delete("/:id", authRequired, deleteJobRequiredLanguage);

export default router;
