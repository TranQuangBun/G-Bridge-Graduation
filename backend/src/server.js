import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./config/database.js";
import { syncDatabase } from "./models/index.js";
import authRoutes from "./routes/authRoutes.js";
import languageRoutes from "./routes/languageRoutes.js";
import certificationRoutes from "./routes/certificationRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/", (_, res) =>
  res.json({
    status: "ok",
    message: "G-Bridge API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/certifications", certificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

const port = process.env.PORT || 4000;

// Initialize database and start server
async function startServer() {
  try {
    console.log("🔄 Initializing database connection...");
    await initDatabase();

    console.log("🔄 Syncing database models...");
    await syncDatabase(false); // Set to true to force recreate tables

    app.listen(port, () => {
      console.log("\n" + "=".repeat(50));
      console.log(`🚀 G-Bridge API Server running on port ${port}`);
      console.log("=".repeat(50));
      console.log(`📖 Health check: http://localhost:${port}/`);
      console.log(`🔐 Auth API: http://localhost:${port}/api/auth`);
      console.log("=".repeat(50) + "\n");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
