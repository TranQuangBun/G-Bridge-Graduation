/**
 * AI Service Client
 * Handles communication with the AI Matching Service (Python FastAPI)
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:5000";

class AIService {
  constructor() {
    this.baseUrl = AI_SERVICE_URL;
    this.timeout = 120000; // 120 seconds timeout for AI requests (batch scoring can take ~100s)
  }

  /**
   * Make HTTP request to AI service
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `AI Service error: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("AI Service request timeout");
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      return await this._request("/api/v1/health");
    } catch (error) {
      console.error("AI Service health check failed:", error);
      return { status: "unhealthy", error: error.message };
    }
  }

  /**
   * Match a job to multiple interpreters
   * @param {Object} jobData - Job data
   * @param {Array} interpretersData - Array of interpreter profiles
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @returns {Promise<Object>} Matching results
   */
  async matchJobToInterpreters(jobData, interpretersData, maxResults = 10) {
    const requestBody = {
      job: this._transformJobData(jobData),
      interpreters: interpretersData.map((interpreter) =>
        this._transformInterpreterData(interpreter)
      ),
      max_results: maxResults,
    };

    return await this._request("/api/v1/match/job", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Score suitability of a single interpreter for a job
   * @param {Object} jobData - Job data
   * @param {Object} interpreterData - Interpreter profile data
   * @returns {Promise<Object>} Suitability score
   */
  async scoreSuitability(jobData, interpreterData) {
    const requestBody = {
      job: this._transformJobData(jobData),
      interpreter: this._transformInterpreterData(interpreterData),
    };

    return await this._request("/api/v1/score/suitability", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Batch score suitability of one interpreter for multiple jobs
   * @param {Array} jobsData - Array of job data
   * @param {Object} interpreterData - Interpreter profile data
   * @returns {Promise<Object>} Batch suitability scores
   */
  async batchScoreSuitability(jobsData, interpreterData) {
    try {
      if (!Array.isArray(jobsData) || jobsData.length === 0) {
        throw new Error("jobsData must be a non-empty array");
      }
      if (!interpreterData) {
        throw new Error("interpreterData is required");
      }

      const requestBody = {
        jobs: jobsData.map((job) => {
          try {
            return this._transformJobData(job);
          } catch (error) {
            throw new Error(`Failed to transform job ${job?.id}: ${error.message}`);
          }
        }),
        interpreter: (() => {
          try {
            return this._transformInterpreterData(interpreterData);
          } catch (error) {
            throw new Error(`Failed to transform interpreter data: ${error.message}`);
          }
        })(),
      };

      return await this._request("/api/v1/score/batch", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      throw new Error(`AI Service batch scoring failed: ${error.message}`);
    }
  }

  /**
   * Filter and rank job applications
   * @param {Object} jobData - Job data
   * @param {Array} applicationsData - Array of job applications with interpreter profiles
   * @param {number} minScore - Minimum suitability score threshold (default: 50)
   * @param {number} maxResults - Maximum number of results (default: 20)
   * @returns {Promise<Object>} Filtered applications
   */
  async filterApplications(
    jobData,
    applicationsData,
    minScore = 50,
    maxResults = 20
  ) {
    const requestBody = {
      job: this._transformJobData(jobData),
      applications: applicationsData.map((app) => ({
        id: app.id || app.applicationId,
        interpreter_id: app.interpreterId || app.interpreter?.id,
        interpreter: app.interpreter
          ? this._transformInterpreterData(app.interpreter)
          : null,
      })),
      min_score: minScore,
      max_results: maxResults,
    };

    return await this._request("/api/v1/filter/applications", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Transform job data to AI service format
   * @private
   */
  _transformJobData(job) {
    return {
      id: job.id,
      title: job.title || "",
      descriptions: job.descriptions || job.description || null,
      responsibility: job.responsibility || null,
      benefits: job.benefits || null,
      min_salary: job.minSalary ? parseFloat(job.minSalary) : null,
      max_salary: job.maxSalary ? parseFloat(job.maxSalary) : null,
      province: job.province || null,
      working_mode: job.workingMode?.name || job.workingMode || null,
      required_languages: (job.requiredLanguages || []).map((rl) => ({
        language: rl.language?.name || rl.language || "",
        level: rl.level?.name || rl.level || "",
      })),
      domains: (job.domains || []).map((domain) => ({
        domain: domain.name || domain.nameVi || domain.domain || "",
        importance: domain.importance || null,
      })),
      required_certificates: (job.requiredCertificates || []).map(
        (cert) => cert.certificate?.name || cert.name || cert
      ),
    };
  }

  /**
   * Transform interpreter profile data to AI service format
   * @private
   */
  _transformInterpreterData(interpreter) {
    return {
      id: interpreter.id || interpreter.userId,
      languages: (interpreter.languages || []).map((lang) => {
        // Handle both object format and array format
        if (typeof lang === "string") {
          return {
            language: lang,
            level: "Unknown",
            certified: false,
          };
        }
        return {
          language: lang.language?.name || lang.language || lang.name || "",
          level: lang.level?.name || lang.level || lang.proficiency || "Unknown",
          certified: lang.certified || false,
        };
      }),
      specializations: (() => {
        try {
          let specs = interpreter.specializations || [];
          // Handle JSON string format
          if (typeof specs === "string") {
            try {
              specs = JSON.parse(specs);
            } catch {
              specs = specs.trim() ? [specs] : [];
            }
          }
          // Ensure it's an array
          if (!Array.isArray(specs)) {
            specs = [];
          }
          return specs.map((spec) => {
            if (typeof spec === "string") {
              return {
                specialization: spec,
                experience_years: null,
              };
            }
            return {
              specialization: spec.specialization || spec.name || spec,
              experience_years: spec.experienceYears || spec.experience_years || null,
            };
          });
        } catch (error) {
          return [];
        }
      })(),
      experience_years: interpreter.experience || interpreter.experienceYears || null,
      hourly_rate: interpreter.hourlyRate
        ? parseFloat(interpreter.hourlyRate)
        : null,
      currency: interpreter.currency || "USD",
      certifications: (interpreter.certifications || []).map((cert) => {
        if (typeof cert === "string") {
          return {
            name: cert,
            issuer: null,
            issue_date: null,
            expiry_date: null,
          };
        }
        return {
          name: cert.name || cert.certificate?.name || "",
          issuer: cert.issuer || cert.issuingOrganization || null,
          issue_date: cert.issueDate || cert.issue_date || null,
          expiry_date: cert.expiryDate || cert.expiry_date || null,
        };
      }),
      portfolio: interpreter.portfolio || null,
      rating: interpreter.rating ? parseFloat(interpreter.rating) : null,
      completed_jobs: interpreter.completedJobs || 0,
      availability: interpreter.availability || null,
    };
  }
}

export default new AIService();

