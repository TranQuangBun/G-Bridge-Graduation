import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError } from "../utils/Response.js";
import AIService from "../services/AIService.js";
import { JobService } from "../services/JobService.js";
import { InterpreterProfileService } from "../services/InterpreterProfileService.js";
import { InterpreterService } from "../services/InterpreterService.js";
import { JobApplicationService } from "../services/JobApplicationService.js";

const jobService = new JobService();
const interpreterProfileService = new InterpreterProfileService();
const interpreterService = new InterpreterService();
const jobApplicationService = new JobApplicationService();

/**
 * Match a job to multiple interpreters using AI
 * GET /api/ai-match/job/:jobId
 */
export async function matchJobToInterpreters(req, res) {
  try {
    const { jobId } = req.params;
    const { maxResults = 10, skipAI = "false" } = req.query;
    const shouldSkipAI = skipAI === "true" || skipAI === true;

    // Get job with relations
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Extract job requirements for scoring (not filtering)
    const jobLanguages = job.requiredLanguages?.map((rl) => rl.language?.name || "").filter(Boolean) || [];
    const jobDomains = job.domains?.map((d) => d.domain?.name || d.name || "").filter(Boolean) || [];
    
    // Build basic filters - try strict first, then fallback to loose
    // This ensures we always have candidates to send to AI
    let filters = {
      page: 1,
      limit: 100, // Get more interpreters for scoring
      isAvailable: "true",
      verificationStatus: "approved", // Only verified interpreters
    };

    // Get interpreters with strict filters first (available + verified only)
    let { interpreters } = await interpreterService.getInterpretersWithFilters(filters);

    // Fallback: if no results with strict filters, try without availability requirement
    if (!interpreters || interpreters.length === 0) {
      filters = {
        page: 1,
        limit: 100,
        verificationStatus: "approved", // Still require verification
        // Remove isAvailable requirement
      };
      const result = await interpreterService.getInterpretersWithFilters(filters);
      interpreters = result.interpreters;
    }

    // Fallback: if still no results, try with only active users
    if (!interpreters || interpreters.length === 0) {
      filters = {
        page: 1,
        limit: 100,
        // Remove all strict requirements, just get active interpreters with profiles
      };
      const result = await interpreterService.getInterpretersWithFilters(filters);
      interpreters = result.interpreters;
    }

    if (!interpreters || interpreters.length === 0) {
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

    // Don't filter out interpreters - score all of them and let AI decide
    // This ensures we have enough candidates even if they don't perfectly match
    let filteredInterpreters = interpreters;

    // Score and rank interpreters based on match criteria
    const scoredInterpreters = filteredInterpreters.map((interpreter) => {
      const profile = interpreter.interpreterProfile || interpreter;
      let score = 0;
      
      // Score based on language match
      if (jobLanguages.length > 0) {
        // Handle both relation format (interpreter.languages) and JSON format (profile.languages)
        let interpreterLanguages = [];
        if (interpreter.languages && Array.isArray(interpreter.languages)) {
          // Relation format from User.languages
          interpreterLanguages = interpreter.languages.map((lang) => 
            lang.language?.name || lang.name || ""
          ).filter(Boolean);
        } else if (profile.languages) {
          // JSON format in profile
          try {
            const langs = Array.isArray(profile.languages) ? profile.languages : 
                         (typeof profile.languages === "string" ? JSON.parse(profile.languages) : []);
            interpreterLanguages = langs.map((lang) => 
              typeof lang === "string" ? lang : (lang.language?.name || lang.name || "")
            ).filter(Boolean);
          } catch (e) {
            interpreterLanguages = [];
          }
        }
        
        const matchingLanguages = jobLanguages.filter((jobLang) =>
          interpreterLanguages.some((interpLang) => 
            interpLang.toLowerCase() === jobLang.toLowerCase()
          )
        );
        score += matchingLanguages.length * 10; // 10 points per matching language
      }
      
      // Score based on domain/specialization match
      if (jobDomains.length > 0) {
        // Handle JSON format specializations
        let specializations = [];
        if (profile.specializations) {
          try {
            specializations = Array.isArray(profile.specializations) 
              ? profile.specializations 
              : (typeof profile.specializations === "string" 
                  ? JSON.parse(profile.specializations) 
                  : []);
          } catch (e) {
            specializations = [];
          }
        }
        
        const matchingDomains = jobDomains.filter((domain) =>
          specializations.some((spec) => {
            const specName = typeof spec === "string" ? spec : spec.specialization || spec.name || "";
            return specName.toLowerCase().includes(domain.toLowerCase()) || 
                   domain.toLowerCase().includes(specName.toLowerCase());
          })
        );
        score += matchingDomains.length * 15; // 15 points per matching domain
      }
      
      // Bonus for rating
      if (profile.rating) {
        score += parseFloat(profile.rating) * 2; // 2 points per rating point
      }
      
      // Bonus for experience
      if (profile.experience) {
        score += parseInt(profile.experience) * 1; // 1 point per year of experience
      }
      
      return { interpreter, score };
    });

    // Sort by score (descending) and take top 10 (or all if less than 10)
    scoredInterpreters.sort((a, b) => b.score - a.score);
    const topCount = Math.min(10, scoredInterpreters.length);
    const topInterpreters = scoredInterpreters.slice(0, topCount).map((item) => item.interpreter);

    // Ensure we have at least some interpreters to send to AI
    // If scoring resulted in empty, use first available interpreters
    if (topInterpreters.length === 0 && interpreters.length > 0) {
      // Fallback: use first available interpreters (up to 10)
      const fallbackCount = Math.min(10, interpreters.length);
      const fallbackInterpreters = interpreters.slice(0, fallbackCount);
      
      // Call AI service with fallback interpreters
      const profiles = await Promise.all(
        fallbackInterpreters.map(async (interpreter) => {
          try {
            const profileId = interpreter.interpreterProfile?.id || interpreter.id;
            if (!profileId) {
              console.warn("No profile ID found for fallback interpreter:", interpreter.id);
              return null;
            }
            const fullProfile = await interpreterProfileService.getInterpreterProfileById(profileId);
            return fullProfile || interpreter.interpreterProfile || interpreter;
          } catch (error) {
            console.error("Error fetching profile for fallback interpreter:", interpreter.id, error);
            return interpreter.interpreterProfile || interpreter;
          }
        })
      );

      // Filter out null profiles
      const validProfiles = profiles.filter(profile => profile !== null && profile !== undefined);
      
      if (validProfiles.length === 0) {
        return sendSuccess(
          res,
          {
            job_id: parseInt(jobId),
            total_interpreters: interpreters.length,
            matched_interpreters: [],
            processing_time_ms: 0,
          },
          "No valid interpreter profiles found for matching"
        );
      }

      const result = await AIService.matchJobToInterpreters(
        job,
        validProfiles,
        parseInt(maxResults)
      );

      return sendSuccess(res, result, "Job matched to interpreters successfully");
    }

    if (topInterpreters.length === 0) {
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_interpreters: interpreters.length,
          matched_interpreters: [],
          processing_time_ms: 0,
        },
        "No interpreters available for matching"
      );
    }

    // Extract profiles for AI service - need to get full profile data
    // Also create a mapping from profile/user ID to interpreter data for later enrichment
    const profiles = await Promise.all(
      topInterpreters.map(async (interpreter) => {
        try {
          const profileId = interpreter.interpreterProfile?.id || interpreter.id;
          if (!profileId) {
            console.warn("No profile ID found for interpreter:", interpreter.id);
            return null;
          }
          const fullProfile = await interpreterProfileService.getInterpreterProfileById(profileId);
          // Attach userId and user reference to profile for mapping later
          if (fullProfile) {
            fullProfile.userId = interpreter.id;
            fullProfile.userIdFromUser = fullProfile.user?.id || interpreter.id;
            fullProfile.user = interpreter; // Keep reference to original User entity
            // Ensure profile.id and user.id are both available for mapping
            console.log("Profile loaded - profile.id:", fullProfile.id, "user.id:", fullProfile.user?.id, "interpreter.id:", interpreter.id);
          }
          return fullProfile || interpreter.interpreterProfile || interpreter;
        } catch (error) {
          console.error("Error fetching profile for interpreter:", interpreter.id, error);
          // Fallback to interpreter data if profile fetch fails
          const fallback = interpreter.interpreterProfile || interpreter;
          if (fallback) {
            fallback.userId = interpreter.id;
            fallback.user = interpreter;
          }
          return fallback;
        }
      })
    );

    // Filter out null profiles
    const validProfiles = profiles.filter(profile => profile !== null && profile !== undefined);
    
    if (validProfiles.length === 0) {
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_interpreters: interpreters.length,
          matched_interpreters: [],
          pre_filtered_interpreters: [],
          processing_time_ms: 0,
        },
        "No valid interpreter profiles found for matching"
      );
    }

    // Transform top interpreters for response (pre-filtered list)
    const preFilteredInterpreters = topInterpreters.map((interpreter) => {
      // interpreter is a User entity with interpreterProfile relation
      const profile = interpreter.interpreterProfile || {};
      return {
        id: interpreter.id,
        userId: interpreter.id,
        fullName: interpreter.fullName || "", // fullName is on User entity, not profile
        name: interpreter.fullName || interpreter.name || "", // Also include name field
        email: interpreter.email || "",
        avatar: interpreter.avatar || null,
        rating: profile.rating || null,
        experience: profile.experience || null,
        hourlyRate: profile.hourlyRate || null,
        specializations: profile.specializations || [],
        languages: interpreter.languages || [],
        user: {
          id: interpreter.id,
          fullName: interpreter.fullName || "",
          name: interpreter.fullName || interpreter.name || "",
          email: interpreter.email || "",
          avatar: interpreter.avatar || null,
        },
        interpreterProfile: {
          id: profile.id,
          rating: profile.rating,
          experience: profile.experience,
          hourlyRate: profile.hourlyRate,
          specializations: profile.specializations,
        },
      };
    });

    // If skipAI is true, only return pre-filtered interpreters without calling AI
    if (shouldSkipAI) {
      console.log("Skipping AI - returning only pre-filtered interpreters:", preFilteredInterpreters.length);
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_interpreters: interpreters.length,
          pre_filtered_interpreters: preFilteredInterpreters,
          matched_interpreters: [], // Empty since we skipped AI
          processing_time_ms: 0,
        },
        "Pre-filtered interpreters fetched successfully (AI skipped)"
      );
    }

    // Call AI service with top 10 filtered interpreters
    const result = await AIService.matchJobToInterpreters(
      job,
      validProfiles,
      parseInt(maxResults)
    );

    // Map AI matched interpreters back to full interpreter data
    // Create a map of interpreter_id (from AI service) to interpreter data for quick lookup
    // AI service uses interpreter.id which could be profile.id or user.id depending on what was sent
    const interpreterMap = new Map();
    
    // Map by user ID (primary)
    topInterpreters.forEach((interpreter) => {
      const profile = interpreter.interpreterProfile || {};
      interpreterMap.set(interpreter.id, {
        id: interpreter.id,
        userId: interpreter.id,
        fullName: interpreter.fullName || "",
        name: interpreter.fullName || interpreter.name || "",
        email: interpreter.email || "",
        avatar: interpreter.avatar || null,
        rating: profile.rating || null,
        experience: profile.experience || null,
        hourlyRate: profile.hourlyRate || null,
        specializations: profile.specializations || [],
        languages: interpreter.languages || [],
        user: {
          id: interpreter.id,
          fullName: interpreter.fullName || "",
          name: interpreter.fullName || interpreter.name || "",
          email: interpreter.email || "",
          avatar: interpreter.avatar || null,
        },
        interpreterProfile: {
          id: profile.id,
          rating: profile.rating,
          experience: profile.experience,
          hourlyRate: profile.hourlyRate,
          specializations: profile.specializations,
        },
      });
    });
    
    // Also map by profile ID and userId from validProfiles
    validProfiles.forEach((profile, index) => {
      const userId = profile.userId || profile.user?.id || topInterpreters[index]?.id;
      if (userId && !interpreterMap.has(userId)) {
        const interpreter = topInterpreters[index] || profile.user;
        if (interpreter) {
          const profileData = interpreter.interpreterProfile || profile;
          interpreterMap.set(userId, {
            id: userId,
            userId: userId,
            fullName: interpreter.fullName || "",
            name: interpreter.fullName || interpreter.name || "",
            email: interpreter.email || "",
            avatar: interpreter.avatar || null,
            rating: profileData.rating || null,
            experience: profileData.experience || null,
            hourlyRate: profileData.hourlyRate || null,
            specializations: profileData.specializations || [],
            languages: interpreter.languages || [],
            user: {
              id: userId,
              fullName: interpreter.fullName || "",
              name: interpreter.fullName || interpreter.name || "",
              email: interpreter.email || "",
              avatar: interpreter.avatar || null,
            },
            interpreterProfile: {
              id: profileData.id || profile.id,
              rating: profileData.rating || null,
              experience: profileData.experience || null,
              hourlyRate: profileData.hourlyRate || null,
              specializations: profileData.specializations || [],
            },
          });
        }
      }
      // Also map by profile ID in case AI service uses profile.id
      if (profile.id) {
        const interpreter = topInterpreters[index] || profile.user;
        if (interpreter && !interpreterMap.has(profile.id)) {
          const profileData = interpreter.interpreterProfile || profile;
          interpreterMap.set(profile.id, {
            id: interpreter.id || userId,
            userId: interpreter.id || userId,
            fullName: interpreter.fullName || "",
            name: interpreter.fullName || interpreter.name || "",
            email: interpreter.email || "",
            avatar: interpreter.avatar || null,
            rating: profileData.rating || null,
            experience: profileData.experience || null,
            hourlyRate: profileData.hourlyRate || null,
            specializations: profileData.specializations || [],
            languages: interpreter.languages || [],
            user: {
              id: interpreter.id || userId,
              fullName: interpreter.fullName || "",
              name: interpreter.fullName || interpreter.name || "",
              email: interpreter.email || "",
              avatar: interpreter.avatar || null,
            },
            interpreterProfile: {
              id: profile.id,
              rating: profileData.rating || null,
              experience: profileData.experience || null,
              hourlyRate: profileData.hourlyRate || null,
              specializations: profileData.specializations || [],
            },
          });
        }
      }
    });

    // Enrich matched_interpreters with full interpreter data
    const enrichedMatchedInterpreters = (result.matched_interpreters || []).map((match) => {
      const interpreterId = match.interpreter_id;
      console.log("Mapping interpreter_id:", interpreterId, "Available keys in map:", Array.from(interpreterMap.keys()));
      
      // Try to find by interpreter_id directly
      let interpreterData = interpreterMap.get(interpreterId);
      
      // If not found, try to find by searching through all entries
      if (!interpreterData) {
        for (const [key, value] of interpreterMap.entries()) {
          if (value.id === interpreterId || value.userId === interpreterId) {
            interpreterData = value;
            break;
          }
        }
      }
      
      if (interpreterData) {
        console.log("Found interpreter data for ID:", interpreterId, "Name:", interpreterData.fullName);
        return {
          ...match,
          interpreter: interpreterData,
          fullName: interpreterData.fullName,
          name: interpreterData.name,
        };
      }
      
      console.warn("Could not find interpreter data for ID:", interpreterId);
      // Fallback if interpreter not found in map
      return {
        ...match,
        interpreter: {
          id: interpreterId,
          fullName: "",
          name: "",
        },
        fullName: "",
        name: "",
      };
    });

    // Add pre-filtered interpreters to response
    // Ensure pre_filtered_interpreters is not overwritten by result
    const responseData = {
      ...result,
      matched_interpreters: enrichedMatchedInterpreters,
      pre_filtered_interpreters: preFilteredInterpreters, // This should override if result has it
    };

    console.log("=== Sending Response ===");
    console.log("pre_filtered_interpreters count:", preFilteredInterpreters.length);
    console.log("matched_interpreters count:", enrichedMatchedInterpreters.length);
    console.log("result keys:", Object.keys(result || {}));
    console.log("responseData keys:", Object.keys(responseData));

    return sendSuccess(
      res,
      responseData,
      "Job matched to interpreters successfully"
    );
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
    // Filter out applications without interpreter profiles
    const applications = applicationsData
      .filter((app) => {
        const interpreter = app.interpreterProfile || app.interpreter;
        return interpreter && interpreter.id;
      })
      .map((app) => ({
        id: app.id,
        interpreterId: app.interpreterId,
        interpreter: app.interpreterProfile || app.interpreter,
      }));

    // If no valid applications after filtering, return empty result
    if (applications.length === 0) {
      return sendSuccess(
        res,
        {
          job_id: parseInt(jobId),
          total_applications: applicationsData.length,
          filtered_count: 0,
          filtered_applications: [],
          processing_time_ms: 0,
        },
        "No applications with valid interpreter profiles found"
      );
    }

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
 * Batch score suitability of one interpreter for multiple jobs
 * POST /api/ai-match/score/batch
 */
export async function batchScoreSuitability(req, res) {
  try {
    const { jobIds, interpreterId } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return sendError(res, "jobIds array is required", 400);
    }

    if (!interpreterId) {
      return sendError(res, "interpreterId is required", 400);
    }

    // Get interpreter profile
    const interpreter = await interpreterProfileService.getInterpreterProfileById(
      interpreterId
    );
    if (!interpreter) {
      return sendError(res, "Interpreter profile not found", 404);
    }

    // Get all jobs
    const jobs = [];
    for (const jobId of jobIds) {
      const job = await jobService.getJobById(jobId);
      if (job) {
        jobs.push(job);
      }
    }

    if (jobs.length === 0) {
      return sendError(res, "No valid jobs found", 404);
    }

    // Call AI service batch endpoint
    try {
      const result = await AIService.batchScoreSuitability(jobs, interpreter);
      return sendSuccess(res, result, "Batch suitability scored successfully");
    } catch (aiError) {
      logError(aiError, "AI Service batch scoring error");
      throw aiError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    logError(error, "Batch scoring suitability");
    if (error.message.includes("not found")) {
      return sendError(res, error.message, 404);
    }
    // Return more detailed error message
    const errorMessage = error.message || "Error batch scoring suitability";
    return sendError(res, errorMessage, 500, error);
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

