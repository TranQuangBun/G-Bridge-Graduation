import express from "express";
import {
  getInterpreters,
  getInterpreterByIdHandler,
  getAvailableLanguages,
  getAvailableSpecializations,
} from "../controllers/InterpreterController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getInterpreters);
router.get("/languages", authRequired, getAvailableLanguages);
router.get("/specializations", authRequired, getAvailableSpecializations);
router.get("/:id", authRequired, getInterpreterByIdHandler);

export default router;
