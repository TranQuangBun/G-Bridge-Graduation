import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSpinner, FaBriefcase, FaMapMarkerAlt, FaDollarSign, FaInfoCircle } from "react-icons/fa";
import { SuitabilityScoreBadge } from "./";
import aiMatchingService from "../../services/aiMatchingService";
import interpreterService from "../../services/interpreterService";
import jobService from "../../services/jobService";
import { ROUTES } from "../../constants/enums";
import styles from "./AISuggestedJobsSection.module.css";

/**
 * AISuggestedJobsSection Component
 * Displays AI-suggested jobs for interpreters based on their profile
 * 
 * @param {number} interpreterId - Interpreter user ID (optional, will fetch if not provided)
 */
export default function AISuggestedJobsSection({ interpreterId, autoFetch = false, compact = false }) {
  const navigate = useNavigate();
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAISuggestions = useCallback(async () => {
    if (!interpreterId) {
      setError("Interpreter ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Get interpreter data
      const interpreterRes = await interpreterService.getInterpreterById(interpreterId);
      const interpreter = interpreterRes?.data || interpreterRes;

      if (!interpreter) {
        throw new Error("Interpreter not found");
      }

      // Get all open jobs
      const jobsRes = await jobService.getJobs({ status: "open", limit: 50 });
      const jobs = jobsRes?.data?.jobs || jobsRes?.data || [];

      if (jobs.length === 0) {
        setSuggestedJobs([]);
        setHasFetched(true);
        return;
      }

      // Sort jobs by newest first (createdAt or createdDate)
      const sortedJobs = [...jobs].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.createdDate || 0);
        const dateB = new Date(b.createdAt || b.createdDate || 0);
        return dateB - dateA; // Newest first
      });

      // Take top 10 newest jobs only
      const jobsToScore = sortedJobs.slice(0, 10);

      // Call AI service to match - use interpreter profile ID if available
      const profileId = interpreter?.interpreterProfile?.id || interpreter?.profile?.id || interpreterId;
      const jobIds = jobsToScore.map((job) => job.id);
      
      try {
        // Use batch scoring instead of individual calls
        const batchRes = await aiMatchingService.batchScoreSuitability(
          jobIds,
          profileId
        );
        
        if (batchRes.success && batchRes.data?.job_scores) {
          // Map scores back to jobs
          const scoreMap = new Map();
          batchRes.data.job_scores.forEach((item) => {
            scoreMap.set(item.job_id, item.suitability_score);
          });
          
          const matches = jobsToScore
            .map((job) => ({
              job,
              suitability_score: scoreMap.get(job.id),
            }))
            .filter((match) => match.suitability_score) // Only include jobs with scores
            .sort(
              (a, b) =>
                b.suitability_score.overall_score -
                a.suitability_score.overall_score
            );
          
          setSuggestedJobs(matches.slice(0, 5));
        }
      } catch (err) {
        console.error("Error batch scoring jobs:", err);
        // Fallback to empty array on error
        setSuggestedJobs([]);
      }
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching AI suggestions:", err);
      setError("Unable to load AI suggestions");
    } finally {
      setLoading(false);
    }
  }, [interpreterId]);

  // Auto-fetch if enabled
  useEffect(() => {
    if (autoFetch && interpreterId && !hasFetched && !loading) {
      fetchAISuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, interpreterId]);

  if (!interpreterId) {
    return null;
  }

  // Compact mode - just return the jobs list without header
  if (compact && suggestedJobs.length > 0) {
    return (
      <div className={styles.jobsList}>
        {suggestedJobs.map((match) => (
          <div key={match.job.id} className={styles.jobCard}>
            <div className={styles.cardHeader}>
              <div className={styles.jobInfo}>
                <h3 className={styles.jobTitle}>
                  {match.job.title}
                  <span className={styles.aiBadge}>AI</span>
                </h3>
                <p className={styles.company}>{match.job.company}</p>
                <div className={styles.meta}>
                  <span>
                    <FaMapMarkerAlt /> {match.job.location}
                  </span>
                  <span>
                    <FaDollarSign /> {match.job.salary}
                  </span>
                </div>
              </div>
              <div className={styles.scoreSection}>
                <SuitabilityScoreBadge
                  score={match.suitability_score.overall_score}
                  level={match.suitability_score.score_level}
                  size="small"
                />
              </div>
            </div>
            <p className={styles.recommendation}>
              {match.suitability_score.recommendation}
            </p>
            <div className={styles.cardActions}>
              <button
                className={styles.viewButton}
                onClick={() => navigate(ROUTES.JOB_DETAIL.replace(":id", match.job.id))}
              >
                View Details
              </button>
              <button
                className={styles.applyButton}
                onClick={() => {
                  navigate(ROUTES.JOB_DETAIL.replace(":id", match.job.id));
                }}
              >
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <FaBriefcase /> Jobs Recommended for You (AI)
        </h2>
        <div className={styles.infoTooltip}>
          <FaInfoCircle />
          <span className={styles.tooltipText}>
            Get AI-powered job recommendations based on your profile
          </span>
        </div>
        {!hasFetched && !loading && (
          <button
            className={styles.fetchButton}
            onClick={fetchAISuggestions}
          >
            🤖 Get AI Recommendations
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <FaSpinner className={styles.spinner} />
          <p>AI is finding the best jobs for you...</p>
        </div>
      )}

      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button
            className={styles.retryButton}
            onClick={fetchAISuggestions}
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && suggestedJobs.length === 0 && hasFetched && (
        <div className={styles.emptyState}>
          <p>No AI recommendations available at this time.</p>
        </div>
      )}

      {!loading && !error && suggestedJobs.length > 0 && (
        <div className={styles.jobsList}>
          {suggestedJobs.map((match) => (
            <div key={match.job.id} className={styles.jobCard}>
              <div className={styles.cardHeader}>
                <div className={styles.jobInfo}>
                  <h3 className={styles.jobTitle}>{match.job.title}</h3>
                  <p className={styles.company}>{match.job.company}</p>
                  <div className={styles.meta}>
                    <span>
                      <FaMapMarkerAlt /> {match.job.location}
                    </span>
                    <span>
                      <FaDollarSign /> {match.job.salary}
                    </span>
                  </div>
                </div>
                <div className={styles.scoreSection}>
                  <SuitabilityScoreBadge
                    score={match.suitability_score.overall_score}
                    level={match.suitability_score.score_level}
                    size="small"
                  />
                </div>
              </div>
              <p className={styles.recommendation}>
                {match.suitability_score.recommendation}
              </p>
              <div className={styles.cardActions}>
                <button
                  className={styles.viewButton}
                  onClick={() => navigate(ROUTES.JOB_DETAIL.replace(":id", match.job.id))}
                >
                  View Details
                </button>
                <button
                  className={styles.applyButton}
                  onClick={() => {
                    navigate(ROUTES.JOB_DETAIL.replace(":id", match.job.id));
                  }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

