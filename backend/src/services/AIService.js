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
        let errorMessage = `AI Service error: ${response.statusText}`;
        
        // Handle different error formats
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(err => {
              if (typeof err === 'object' && err.msg) {
                return err.msg;
              }
              return JSON.stringify(err);
            }).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        }
        
        throw new Error(errorMessage);
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
    try {
      // Transform job data
      let transformedJob;
      try {
        transformedJob = this._transformJobData(jobData);
      } catch (error) {
        throw new Error(`Failed to transform job data: ${error.message}`);
      }

      // Transform interpreter data with error handling
      const transformedInterpreters = [];
      for (let i = 0; i < interpretersData.length; i++) {
        try {
          const transformed = this._transformInterpreterData(interpretersData[i]);
          transformedInterpreters.push(transformed);
        } catch (error) {
          console.error(`Failed to transform interpreter ${i}:`, error);
          // Skip this interpreter but continue with others
          continue;
        }
      }

      if (transformedInterpreters.length === 0) {
        throw new Error("No valid interpreter profiles could be transformed");
      }

    const requestBody = {
        job: transformedJob,
        interpreters: transformedInterpreters,
      max_results: maxResults,
    };

    return await this._request("/api/v1/match/job", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    } catch (error) {
      throw new Error(`AI Service matchJobToInterpreters failed: ${error.message}`);
    }
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
    // Filter out applications without valid interpreter data
    const validApplications = applicationsData.filter((app) => {
      const interpreter = app.interpreter;
      return interpreter && interpreter.id;
    });

    if (validApplications.length === 0) {
      throw new Error("No applications with valid interpreter profiles found");
    }

    const requestBody = {
      job: this._transformJobData(jobData),
      applications: validApplications.map((app) => ({
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
    // Ensure title is always a string (required field)
    const title = String(job.title || "");
    if (!title) {
      throw new Error("Job title is required");
    }

    // Transform required languages - filter out invalid entries
    const requiredLanguages = (job.requiredLanguages || [])
      .map((rl) => {
        const language = String(rl.language?.name || rl.language || "").trim();
        const level = String(rl.level?.name || rl.level || "").trim();
        if (language && level) {
          return { language, level };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries

    // Transform domains - filter out invalid entries
    const domains = (job.domains || [])
      .map((domain) => {
        const domainName = String(
          domain.name || domain.nameVi || domain.domain || domain.domain?.name || ""
        ).trim();
        if (domainName) {
          return {
            domain: domainName,
            importance: domain.importance ? String(domain.importance) : null,
          };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries

    // Transform required certificates - ensure all are strings
    const requiredCertificates = (job.requiredCertificates || [])
      .map((cert) => {
        if (typeof cert === "string") {
          return cert.trim();
        }
        const certName = cert?.certificate?.name || cert?.name || "";
        return String(certName).trim();
      })
      .filter((cert) => cert !== ""); // Remove empty strings

    return {
      id: parseInt(job.id),
      title: title,
      descriptions: job.descriptions || job.description || null,
      responsibility: job.responsibility || null,
      benefits: job.benefits || null,
      min_salary: job.minSalary ? parseFloat(job.minSalary) : null,
      max_salary: job.maxSalary ? parseFloat(job.maxSalary) : null,
      province: job.province ? String(job.province) : null,
      working_mode: job.workingMode?.name || job.workingMode 
        ? String(job.workingMode?.name || job.workingMode) 
        : null,
      required_languages: requiredLanguages,
      domains: domains,
      required_certificates: requiredCertificates,
    };
  }

  /**
   * Transform interpreter profile data to AI service format
   * @private
   */
  _transformInterpreterData(interpreter) {
    if (!interpreter) {
      throw new Error("Interpreter data is required");
    }

    // Handle languages - can be from User.languages relation or profile.languages
    let languages = [];
    try {
      if (interpreter.languages && Array.isArray(interpreter.languages)) {
        languages = interpreter.languages
          .map((lang) => {
        // Handle both object format and array format
        if (typeof lang === "string") {
              const langStr = String(lang).trim();
              if (langStr) {
          return {
                  language: langStr,
            level: "Unknown",
            certified: false,
          };
        }
              return null;
            }
            const language = String(
              lang.language?.name || lang.language || lang.name || ""
            ).trim();
            const level = String(
              lang.level?.name || lang.level || lang.proficiency || "Unknown"
            ).trim();
            if (language) {
              return {
                language: language,
                level: level || "Unknown",
                certified: Boolean(lang.certified),
              };
            }
            return null;
          })
          .filter(Boolean); // Remove null entries
      } else if (interpreter.user?.languages && Array.isArray(interpreter.user.languages)) {
        // Handle case where languages are in user relation
        languages = interpreter.user.languages
          .map((lang) => {
            const language = String(
              lang.language?.name || lang.language || lang.name || ""
            ).trim();
            const level = String(
              lang.level?.name || lang.level || lang.proficiency || "Unknown"
            ).trim();
            if (language) {
        return {
                language: language,
                level: level || "Unknown",
                certified: Boolean(lang.certified),
              };
            }
            return null;
          })
          .filter(Boolean); // Remove null entries
      }
    } catch (error) {
      console.warn("Error transforming languages:", error);
      languages = [];
    }

    // Ensure id is an integer
    const interpreterId = interpreter.id || interpreter.userId;
    if (!interpreterId) {
      throw new Error("Interpreter ID is required");
    }

    return {
      id: parseInt(interpreterId),
      languages: languages,
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
          return specs
            .map((spec) => {
              let specialization = "";
            if (typeof spec === "string") {
                specialization = String(spec).trim();
              } else {
                specialization = String(
                  spec.specialization || spec.name || spec || ""
                ).trim();
              }
              if (specialization) {
              return {
                  specialization: specialization,
                  experience_years:
                    spec.experienceYears || spec.experience_years
                      ? parseInt(spec.experienceYears || spec.experience_years)
                      : null,
            };
              }
              return null;
            })
            .filter(Boolean); // Remove null entries
        } catch (error) {
          return [];
        }
      })(),
      experience_years: interpreter.experience || interpreter.experienceYears || null,
      hourly_rate: interpreter.hourlyRate
        ? parseFloat(interpreter.hourlyRate)
        : null,
      currency: interpreter.currency || "USD",
      certifications: (interpreter.certifications || [])
        .map((cert) => {
          let name = "";
        if (typeof cert === "string") {
            name = String(cert).trim();
          } else {
            name = String(cert.name || cert.certificate?.name || "").trim();
          }
          if (name) {
          return {
              name: name,
              issuer: cert.issuer || cert.issuingOrganization
                ? String(cert.issuer || cert.issuingOrganization)
                : null,
              issue_date: cert.issueDate || cert.issue_date
                ? String(cert.issueDate || cert.issue_date)
                : null,
              expiry_date: cert.expiryDate || cert.expiry_date
                ? String(cert.expiryDate || cert.expiry_date)
                : null,
        };
          }
          return null;
        })
        .filter(Boolean), // Remove null entries
      portfolio: interpreter.portfolio ? String(interpreter.portfolio) : null,
      rating: interpreter.rating ? parseFloat(interpreter.rating) : null,
      completed_jobs: interpreter.completedJobs
        ? parseInt(interpreter.completedJobs)
        : 0,
      availability: interpreter.availability || null,
    };
  }
}

export default new AIService();

