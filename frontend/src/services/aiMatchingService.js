import apiClient from "../api/client.js";
import { getErrorMessage } from "../utils/errors.js";

const aiMatchingService = {
  /**
   * Match a job to multiple interpreters using AI
   * @param {number} jobId - Job ID
   * @param {number} maxResults - Maximum number of results (default: 10)
   * @param {boolean} skipAI - If true, only return pre-filtered interpreters without AI scoring (default: false)
   * @returns {Promise<Object>} Matching results
   */
  matchJobToInterpreters: async (jobId, maxResults = 10, skipAI = false) => {
    try {
      const skipAIParam = skipAI ? "&skipAI=true" : "";
      const response = await apiClient.get(
        `/ai-match/job/${jobId}/match?maxResults=${maxResults}${skipAIParam}`
      );
      return response.data;
    } catch (error) {
      console.error("Error matching job to interpreters:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Score suitability of a single interpreter for a job
   * @param {number} jobId - Job ID
   * @param {number} interpreterId - Interpreter ID
   * @returns {Promise<Object>} Suitability score
   */
  scoreSuitability: async (jobId, interpreterId) => {
    try {
      const response = await apiClient.get(
        `/ai-match/score/${jobId}/${interpreterId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error scoring suitability:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Batch score suitability of one interpreter for multiple jobs
   * @param {Array<number>} jobIds - Array of job IDs
   * @param {number} interpreterId - Interpreter ID
   * @returns {Promise<Object>} Batch suitability scores
   */
  batchScoreSuitability: async (jobIds, interpreterId) => {
    try {
      const response = await apiClient.post("/ai-match/score/batch", {
        jobIds,
        interpreterId,
      });
      return response.data;
    } catch (error) {
      console.error("Error batch scoring suitability:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Filter and rank job applications using AI
   * @param {number} jobId - Job ID
   * @param {number} minScore - Minimum suitability score (default: 50)
   * @param {number} maxResults - Maximum number of results (default: 20)
   * @returns {Promise<Object>} Filtered applications
   */
  filterApplications: async (jobId, minScore = 50, maxResults = 20) => {
    try {
      const response = await apiClient.get(
        `/ai-match/filter-applications/${jobId}?minScore=${minScore}&maxResults=${maxResults}`
      );
      return response.data;
    } catch (error) {
      console.error("Error filtering applications:", error);
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * Health check for AI service
   * @returns {Promise<Object>} Health status
   */
  healthCheck: async () => {
    try {
      const response = await apiClient.get("/ai-match/health");
      return response.data;
    } catch (error) {
      console.error("Error checking AI service health:", error);
      throw new Error(getErrorMessage(error));
    }
  },
};

export default aiMatchingService;

