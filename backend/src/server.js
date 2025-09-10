import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 4000;

initDatabase().then(() => {
  app.listen(port, () => console.log(`API running on port ${port}`));
});
