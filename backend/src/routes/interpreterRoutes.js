import express from "express";
import {
  getInterpreters,
  getInterpreterById,
  getAvailableLanguages,
  getAvailableSpecializations,
  toggleSaveInterpreter,
  getSavedInterpreters,
} from "../controllers/interpreterController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Protected routes for company users
router.get("/", authRequired, getInterpreters); // GET /api/interpreters?search=...&languages=...
router.get("/languages", authRequired, getAvailableLanguages); // GET /api/interpreters/languages
router.get("/specializations", authRequired, getAvailableSpecializations); // GET /api/interpreters/specializations

// Save interpreter routes
router.post("/:interpreterId/save", authRequired, toggleSaveInterpreter); // POST /api/interpreters/:interpreterId/save
router.get("/saved/list", authRequired, getSavedInterpreters); // GET /api/interpreters/saved/list

router.get("/:id", authRequired, getInterpreterById); // GET /api/interpreters/:id

export default router;
