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

      // Call AI service to match - use interpreter profile ID if available
      const profileId = interpreter?.interpreterProfile?.id || interpreter?.profile?.id || interpreterId;
      const matches = [];
      for (const job of jobs.slice(0, 20)) { // Limit to 20 jobs for performance
        try {
          const scoreRes = await aiMatchingService.scoreSuitability(job.id, profileId);
          if (scoreRes.success && scoreRes.data?.suitability_score) {
            matches.push({
              job,
              suitability_score: scoreRes.data.suitability_score,
            });
          }
        } catch (err) {
          console.error(`Error scoring job ${job.id}:`, err);
        }
      }

      // Sort by score and take top 5
      matches.sort((a, b) => b.suitability_score.overall_score - a.suitability_score.overall_score);
      setSuggestedJobs(matches.slice(0, 5));
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

