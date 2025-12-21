import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { logCriticalError } from "./utils/Errors.js";
import authRoutes from "./routes/AuthRoutes.js";
import languageRoutes from "./routes/LanguageRoutes.js";
import certificationRoutes from "./routes/CertificationRoutes.js";
import interpreterRoutes from "./routes/InterpreterRoutes.js";
import jobRoutes from "./routes/JobRoutes.js";
import paymentRoutes from "./routes/PaymentRoutes.js";
import bookingRoutes from "./routes/BookingRoutes.js";
import organizationRoutes from "./routes/OrganizationRoutes.js";
import domainRoutes from "./routes/DomainRoutes.js";
import workingModeRoutes from "./routes/WorkingModeRoutes.js";
import levelRoutes from "./routes/LevelRoutes.js";
import userRoutes from "./routes/UserRoutes.js";
import jobApplicationRoutes from "./routes/JobApplicationRoutes.js";
import bookingRequestRoutes from "./routes/BookingRequestRoutes.js";
import subscriptionPlanRoutes from "./routes/SubscriptionPlanRoutes.js";
import interpreterProfileRoutes from "./routes/InterpreterProfileRoutes.js";
import clientProfileRoutes from "./routes/ClientProfileRoutes.js";
import savedJobRoutes from "./routes/SavedJobRoutes.js";
import savedInterpreterRoutes from "./routes/SavedInterpreterRoutes.js";
import userSubscriptionRoutes from "./routes/UserSubscriptionRoutes.js";
import paymentWebhookRoutes from "./routes/PaymentWebhookRoutes.js";
import paymentRefundRoutes from "./routes/PaymentRefundRoutes.js";
import jobDomainRoutes from "./routes/JobDomainRoutes.js";
import jobRequiredLanguageRoutes from "./routes/JobRequiredLanguageRoutes.js";
import jobRequiredCertificateRoutes from "./routes/JobRequiredCertificateRoutes.js";
import notificationRoutes from "./routes/NotificationRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";
import aiMatchingRoutes from "./routes/AIMatchingRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = async () => {
  const app = express();

  // Trust proxy for correct IP address in Docker/behind proxy
  app.set("trust proxy", true);

  // CORS configuration - allow multiple origins for development
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3333",
  ].filter(Boolean); // Remove any undefined/null values

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Ensure uploads directories exist
  const uploadsDir = path.join(__dirname, "../uploads");
  const uploadsSubdirs = ["avatars", "certifications", "resumes", "job-documents"];
  uploadsSubdirs.forEach((subdir) => {
    const dirPath = path.join(uploadsDir, subdir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  });
  
  app.use("/uploads", express.static(uploadsDir));

  // Register routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/languages", languageRoutes);
  app.use("/api/certifications", certificationRoutes);
  app.use("/api/organizations", organizationRoutes);
  app.use("/api/domains", domainRoutes);
  app.use("/api/working-modes", workingModeRoutes);
  app.use("/api/levels", levelRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/job-applications", jobApplicationRoutes);
  app.use("/api/interpreters", interpreterRoutes);
  app.use("/api/interpreter-profiles", interpreterProfileRoutes);
  app.use("/api/client-profiles", clientProfileRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/subscription-plans", subscriptionPlanRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/booking-requests", bookingRequestRoutes);
  app.use("/api/saved-jobs", savedJobRoutes);
  app.use("/api/saved-interpreters", savedInterpreterRoutes);
  app.use("/api/user-subscriptions", userSubscriptionRoutes);
  app.use("/api/payment-webhooks", paymentWebhookRoutes);
  app.use("/api/payment-refunds", paymentRefundRoutes);
  app.use("/api/job-domains", jobDomainRoutes);
  app.use("/api/job-required-languages", jobRequiredLanguageRoutes);
  app.use("/api/job-required-certificates", jobRequiredCertificateRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/ai-match", aiMatchingRoutes);

  // Health check endpoint - Check database connection
  app.get("/health", async (_, res) => {
    try {
      const { AppDataSource } = await import("./config/DataSource.js");
      
      // Check if database is initialized and connected
      if (!AppDataSource.isInitialized) {
        return res.status(503).json({
          status: "unhealthy",
          message: "Database not initialized",
          timestamp: new Date().toISOString(),
        });
      }

      // Perform actual database query to ensure connection is working
      await AppDataSource.query("SELECT 1");
      
      return res.status(200).json({
        status: "healthy",
        message: "Server and database are ready",
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          host: AppDataSource.options.host,
          database: AppDataSource.options.database,
        },
      });
    } catch (error) {
      return res.status(503).json({
        status: "unhealthy",
        message: "Database connection failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get("/", (_, res) =>
    res.json({
      status: "ok",
      message: "G-Bridge API Server",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    })
  );

  app.use((err, req, res, next) => {
    if (err.statusCode !== 404 && err.statusCode !== 400) {
      logCriticalError(err, "Unhandled error in request handler");
    }
    res.status(err.statusCode || 500).json({
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  });

  app.use("*", (req, res) => {
    res.status(404).json({
      message: "Route not found",
      path: req.originalUrl,
    });
  });

  return app;
};

export default createApp;

