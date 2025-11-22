import express from "express";
import {
  getAllSavedInterpreters,
  getSavedInterpreterById,
  createSavedInterpreter,
  deleteSavedInterpreter,
} from "../controllers/SavedInterpreterController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllSavedInterpreters);
router.get("/:userId/:interpreterId", authRequired, getSavedInterpreterById);
router.post("/", authRequired, createSavedInterpreter);
router.delete("/:userId/:interpreterId", authRequired, deleteSavedInterpreter);

export default router;

