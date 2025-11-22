import express from "express";
import {
  getAllInterpreterProfiles,
  getInterpreterProfileById,
  createInterpreterProfile,
  updateInterpreterProfile,
  deleteInterpreterProfile,
} from "../controllers/InterpreterProfileController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllInterpreterProfiles);
router.get("/:id", getInterpreterProfileById);
router.post("/", authRequired, createInterpreterProfile);
router.put("/:id", authRequired, updateInterpreterProfile);
router.delete("/:id", authRequired, deleteInterpreterProfile);

export default router;

