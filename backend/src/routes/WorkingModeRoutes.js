import express from "express";
import {
  getAllWorkingModes,
  getWorkingModeById,
  createWorkingMode,
  updateWorkingMode,
  deleteWorkingMode,
} from "../controllers/WorkingModeController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllWorkingModes);
router.get("/:id", getWorkingModeById);
router.post("/", authRequired, createWorkingMode);
router.put("/:id", authRequired, updateWorkingMode);
router.delete("/:id", authRequired, deleteWorkingMode);

export default router;

