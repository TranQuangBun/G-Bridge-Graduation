import express from "express";
import {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel,
} from "../controllers/LevelController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllLevels);
router.get("/:id", getLevelById);
router.post("/", authRequired, createLevel);
router.put("/:id", authRequired, updateLevel);
router.delete("/:id", authRequired, deleteLevel);

export default router;

