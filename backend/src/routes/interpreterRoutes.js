import express from "express";
import {
  getInterpreters,
  getInterpreterById,
  getAvailableLanguages,
  getAvailableSpecializations,
} from "../controllers/interpreterController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Protected routes for company users
router.get("/", authRequired, getInterpreters); // GET /api/interpreters?search=...&languages=...
router.get("/languages", authRequired, getAvailableLanguages); // GET /api/interpreters/languages
router.get("/specializations", authRequired, getAvailableSpecializations); // GET /api/interpreters/specializations
router.get("/:id", authRequired, getInterpreterById); // GET /api/interpreters/:id

export default router;
