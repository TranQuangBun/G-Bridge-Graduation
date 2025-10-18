import express from "express";
import {
  getMyLanguages,
  addLanguage,
  updateLanguage,
  deleteLanguage,
} from "../controllers/languageController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.get("/", authRequired, getMyLanguages);
router.post("/", authRequired, addLanguage);
router.put("/:id", authRequired, updateLanguage);
router.delete("/:id", authRequired, deleteLanguage);

export default router;
