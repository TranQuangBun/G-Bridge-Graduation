import express from "express";
import {
  getAllLanguages,
  getLanguageById,
  createLanguage,
  updateLanguage,
  deleteLanguage,
} from "../controllers/LanguageController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllLanguages);
router.get("/:id", getLanguageById);
router.post("/", authRequired, createLanguage);
router.put("/:id", authRequired, updateLanguage);
router.delete("/:id", authRequired, deleteLanguage);

export default router;
