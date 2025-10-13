import express from "express";
import { register, login, me } from "../controllers/authController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);

export default router;
