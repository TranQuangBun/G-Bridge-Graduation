import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import AIService from "../services/AIService.js";
import { JobService } from "../services/JobService.js";
import { InterpreterProfileService } from "../services/InterpreterProfileService.js";
import { JobApplicationService } from "../services/JobApplicationService.js";

const jobService = new JobService();
const interpreterProfileService = new InterpreterProfileService();
const jobApplicationService = new JobApplicationService();

/**
 * Match a job to multiple interpreters using AI
 * GET /api/ai-match/job/:jobId
 */
export async function matchJobToInterpreters(req, res) {
  try {
    const { jobId } = req.params;
    const { maxResults = 10 } = req.query;

    // Get job with relations
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Get all available interpreters
    const { profiles } = await interpreterProfileService.getAllInterpreterProfiles({
      page: 1,
      limit: 100, // Get more interpreters for matching
      isAvailable: "true",
    });

    if (!profiles || profiles.length === 0) {
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_interpreters: 0,
          matched_interpreters: [],
          processing_time_ms: 0,
        },
        "No interpreters available for matching"
      );
    }

    // Call AI service
    const result = await AIService.matchJobToInterpreters(
      job,
      profiles,
      parseInt(maxResults)
    );

    return sendSuccess(res, result, "Job matched to interpreters successfully");
  } catch (error) {
    logError(error, "Matching job to interpreters");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(
      res,
      "Error matching job to interpreters",
      500,
      error
    );
  }
}

/**
 * Score suitability of a single interpreter for a job
 * GET /api/ai-match/score/:jobId/:interpreterId
 */
export async function scoreSuitability(req, res) {
  try {
    const { jobId, interpreterId } = req.params;

    // Get job and interpreter
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const interpreter = await interpreterProfileService.getInterpreterProfileById(
      interpreterId
    );
    if (!interpreter) {
      return sendError(res, "Interpreter profile not found", 404);
    }

    // Call AI service
    const result = await AIService.scoreSuitability(job, interpreter);

    return sendSuccess(res, result, "Suitability scored successfully");
  } catch (error) {
    logError(error, "Scoring suitability");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error scoring suitability", 500, error);
  }
}

/**
 * Filter and rank job applications using AI
 * GET /api/ai-match/filter-applications/:jobId
 */
export async function filterApplications(req, res) {
  try {
    const { jobId } = req.params;
    const { minScore = 50, maxResults = 20 } = req.query;

    // Get job
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Get all applications for this job with interpreter profiles
    const applicationsData = await jobApplicationService.getApplicationsByJobId(
      jobId
    );

    if (!applicationsData || applicationsData.length === 0) {
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_applications: 0,
          filtered_count: 0,
          filtered_applications: [],
          processing_time_ms: 0,
        },
        "No applications found for this job"
      );
    }

    // Transform applications data for AI service
    const applications = applicationsData.map((app) => ({
      id: app.id,
      interpreterId: app.interpreterId,
      interpreter: app.interpreterProfile || app.interpreter,
    }));

    // Call AI service
    const result = await AIService.filterApplications(
      job,
      applications,
      parseFloat(minScore),
      parseInt(maxResults)
    );

    return sendSuccess(res, result, "Applications filtered successfully");
  } catch (error) {
    logError(error, "Filtering applications");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    return sendError(res, "Error filtering applications", 500, error);
  }
}

/**
 * Health check for AI service
 * GET /api/ai-match/health
 */
export async function aiServiceHealth(req, res) {
  try {
    const health = await AIService.healthCheck();
    if (health.status === "healthy") {
      return sendSuccess(res, health, "AI service is healthy");
    }
    return sendError(res, "AI service is unhealthy", 503, health);
  } catch (error) {
    logError(error, "AI service health check");
    return sendError(res, "Error checking AI service health", 500, error);
  }
}

