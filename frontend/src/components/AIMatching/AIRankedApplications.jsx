import React, { useState, useEffect, useCallback } from "react";
import { FaSpinner, FaFilter, FaSort } from "react-icons/fa";
import { SuitabilityScoreBadge, MatchReasonsCard } from "./";
import aiMatchingService from "../../services/aiMatchingService";
import styles from "./AIRankedApplications.module.css";

/**
 * AIRankedApplications Component
 * Displays job applications ranked by AI suitability score
 * 
 * @param {number} jobId - Job ID
 * @param {Array} applications - Original applications array
 * @param {Function} onApplicationClick - Handler for application click
 */
export default function AIRankedApplications({
  jobId,
  applications = [],
  onApplicationClick,
}) {
  const [aiRankedApps, setAiRankedApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("date"); // "ai" | "date" - default to date
  const [filterLevel, setFilterLevel] = useState("all"); // "all" | "excellent" | "good" | "fair"
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [hasFetchedAI, setHasFetchedAI] = useState(false);

  const fetchAIRankedApplications = useCallback(async () => {
    if (!jobId || applications.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await aiMatchingService.filterApplications(jobId, 50, 50);
      if (response.success && response.data) {
        const rankedApps = response.data.filtered_applications || [];
        // Map AI results back to original applications
        const mappedApps = rankedApps.map((ranked) => {
          const original = applications.find(
            (app) => app.id === ranked.application_id || app.interpreterId === ranked.interpreter_id
          );
          return {
            ...original,
            aiScore: ranked.suitability_score,
            aiRank: ranked.rank,
          };
        });
        setAiRankedApps(mappedApps);
        setHasFetchedAI(true);
      }
    } catch (err) {
      console.error("Error fetching AI ranked applications:", err);
      setError("Failed to load AI rankings. Showing default order.");
      // Fallback to original order
      setAiRankedApps(applications);
    } finally {
      setLoading(false);
    }
  }, [jobId, applications]);

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    if (newSortBy === "ai" && !hasFetchedAI) {
      // Only fetch when user clicks AI Ranked button for the first time
      fetchAIRankedApplications();
    } else if (newSortBy === "date") {
      // Sort by date
      const sorted = [...applications].sort(
        (a, b) => new Date(b.applicationDate || b.createdAt) - new Date(a.applicationDate || a.createdAt)
      );
      setAiRankedApps(sorted);
    }
  };

  // Initialize with date-sorted applications
  useEffect(() => {
    if (applications.length > 0 && sortBy === "date" && aiRankedApps.length === 0) {
      const sorted = [...applications].sort(
        (a, b) => new Date(b.applicationDate || b.createdAt) - new Date(a.applicationDate || a.createdAt)
      );
      setAiRankedApps(sorted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

  const getFilteredApps = () => {
    if (filterLevel === "all") return aiRankedApps;
    return aiRankedApps.filter((app) => {
      const level = app.aiScore?.score_level;
      return level === filterLevel;
    });
  };

  const toggleExpand = (appId) => {
    setExpandedAppId(expandedAppId === appId ? null : appId);
  };

  const filteredApps = getFilteredApps();

  return (
    <div className={styles.container}>
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.sortControls}>
          <button
            className={`${styles.sortButton} ${sortBy === "ai" ? styles.active : ""}`}
            onClick={() => handleSortChange("ai")}
            disabled={loading}
          >
            <FaFilter /> 🤖 AI Ranked
          </button>
          <button
            className={`${styles.sortButton} ${sortBy === "date" ? styles.active : ""}`}
            onClick={() => handleSortChange("date")}
          >
            <FaSort /> Date Posted
          </button>
        </div>

        {sortBy === "ai" && (
          <div className={styles.filterControls}>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Scores</option>
              <option value="excellent">Excellent (90+)</option>
              <option value="good">Good (70-89)</option>
              <option value="fair">Fair (50-69)</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <FaSpinner className={styles.spinner} />
          <p>AI is analyzing applications...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      )}

      {/* Applications List */}
      {!loading && (
        <div className={styles.applicationsList}>
          {filteredApps.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No applications found</p>
            </div>
          ) : (
            filteredApps.map((app) => (
              <div key={app.id} className={styles.applicationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.appInfo}>
                    <h3 className={styles.applicantName}>
                      {app.interpreter?.user?.name || app.interpreter?.name || "Unknown"}
                    </h3>
                    <p className={styles.appDate}>
                      Applied: {new Date(app.applicationDate || app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {app.aiScore && (
                    <div className={styles.scoreSection}>
                      <SuitabilityScoreBadge
                        score={app.aiScore.overall_score}
                        level={app.aiScore.score_level}
                        size="small"
                      />
                      {app.aiRank && (
                        <span className={styles.rankBadge}>Rank #{app.aiRank}</span>
                      )}
                    </div>
                  )}
                </div>

                {app.coverLetter && (
                  <div className={styles.coverLetter}>
                    <p>{app.coverLetter.substring(0, 150)}...</p>
                  </div>
                )}

                {/* AI Match Details */}
                {app.aiScore && (
                  <div className={styles.matchDetails}>
                    <button
                      className={styles.toggleButton}
                      onClick={() => toggleExpand(app.id)}
                    >
                      {expandedAppId === app.id ? "Hide" : "Show"} Match Analysis
                    </button>
                    {expandedAppId === app.id && (
                      <div className={styles.matchCardWrapper}>
                        <MatchReasonsCard
                          suitabilityScore={app.aiScore}
                          expandable={false}
                          defaultExpanded={true}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className={styles.cardActions}>
                  {onApplicationClick && (
                    <button
                      className={styles.viewButton}
                      onClick={() => onApplicationClick(app)}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

