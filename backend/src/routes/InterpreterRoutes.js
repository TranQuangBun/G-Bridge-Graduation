import express from "express";
import {
  getInterpreters,
  getInterpreterByIdHandler,
  getAvailableLanguages,
  getAvailableSpecializations,
  getTopRatedInterpretersHandler,
} from "../controllers/InterpreterController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getInterpreters);
router.get("/languages", authRequired, getAvailableLanguages);
router.get("/specializations", authRequired, getAvailableSpecializations);
router.get("/top-rated", getTopRatedInterpretersHandler); // Public endpoint for homepage
router.get("/:id", authRequired, getInterpreterByIdHandler);

export default router;
