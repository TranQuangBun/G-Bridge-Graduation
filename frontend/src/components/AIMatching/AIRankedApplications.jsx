import React, { useState, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";
import { SuitabilityScoreBadge, MatchReasonsCard, AIToggle } from "./";
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
  const [filterLevel, setFilterLevel] = useState("all"); // "all" | "excellent" | "good" | "fair"
  const [selectedAppForAnalysis, setSelectedAppForAnalysis] = useState(null);
  const [hasFetchedAI, setHasFetchedAI] = useState(false);
  const [showAIResults, setShowAIResults] = useState(false);

  const fetchAIRankedApplications = useCallback(async () => {
    if (!jobId || applications.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Sort applications by newest first (applicationDate or createdAt)
      const sortedApps = [...applications].sort((a, b) => {
        const dateA = new Date(a.applicationDate || a.createdAt || 0);
        const dateB = new Date(b.applicationDate || b.createdAt || 0);
        return dateB - dateA; // Newest first
      });

      // Take top 10 newest applications only
      const newest10Apps = sortedApps.slice(0, 10);
      const applicationIds = newest10Apps.map((app) => app.id);

      const response = await aiMatchingService.filterApplications(jobId, 50, 50);
      if (response.success && response.data) {
        const rankedApps = response.data.filtered_applications || [];
        // Map AI results back to original applications (only from top 10)
        const mappedApps = rankedApps
          .filter((ranked) => applicationIds.includes(ranked.application_id))
          .map((ranked) => {
            const original = newest10Apps.find(
              (app) => app.id === ranked.application_id || app.interpreterId === ranked.interpreter_id
            );
            if (!original) return null;
            return {
              ...original,
              aiScore: ranked.suitability_score,
              aiRank: ranked.rank,
            };
          })
          .filter((app) => app !== null)
          .sort((a, b) => {
            // Sort by score from highest to lowest
            return b.aiScore.overall_score - a.aiScore.overall_score;
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

  // Handle toggle change
  const handleToggleChange = async (value) => {
    if (value === "ai") {
      // If not fetched yet, fetch now
      if (!hasFetchedAI) {
        await fetchAIRankedApplications();
      }
      setShowAIResults(true);
    } else {
      setShowAIResults(false);
    }
  };

  const getFilteredApps = () => {
    if (filterLevel === "all") return aiRankedApps;
    return aiRankedApps.filter((app) => {
      const level = app.aiScore?.score_level;
      return level === filterLevel;
    });
  };

  const handleShowMatchAnalysis = (app) => {
    setSelectedAppForAnalysis(app);
  };

  const handleCloseMatchAnalysis = () => {
    setSelectedAppForAnalysis(null);
  };

  const filteredApps = getFilteredApps();

  return (
    <div className={styles.container}>
      {/* Toggle - Full Width */}
      <div className={styles.toggleSection}>
        <AIToggle
          value={showAIResults ? "ai" : "all"}
          onChange={handleToggleChange}
          loading={loading}
          disabled={!jobId || applications.length === 0}
          aiLabel="AI"
          allLabel="All"
        />
      </div>

      {/* Filter Controls - Only show when AI results are displayed, below toggle */}
      {showAIResults && hasFetchedAI && (
        <div className={styles.filterSection}>
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
          {(() => {
            // Show AI ranked apps if AI is active, otherwise show original applications
            const appsToDisplay = showAIResults && hasFetchedAI ? filteredApps : applications;
            
            if (appsToDisplay.length === 0) {
              return (
                <div className={styles.emptyState}>
                  <p>No applications found</p>
                </div>
              );
            }
            
            return appsToDisplay.map((app) => (
              <div key={app.id} className={styles.applicationCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.appInfo}>
                    <h3 className={styles.applicantName}>
                      {app.interpreter?.fullName ||
                        app.interpreter?.name ||
                        app.interpreter?.email ||
                        "Unknown"}
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

                {typeof app.coverLetter === "string" && app.coverLetter && (
                  <div className={styles.coverLetter}>
                    <p>{app.coverLetter.substring(0, 150)}...</p>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.cardActions}>
                  {app.aiScore && (
                    <button
                      className={styles.matchAnalysisButton}
                      onClick={() => handleShowMatchAnalysis(app)}
                    >
                      Show Match Analysis
                    </button>
                  )}
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
            ));
          })()}
        </div>
      )}

      {/* Match Analysis Modal */}
      {selectedAppForAnalysis && selectedAppForAnalysis.aiScore && (
        <div
          className={styles.modalOverlay}
          onClick={handleCloseMatchAnalysis}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>AI Match Analysis</h2>
              <button
                className={styles.modalCloseButton}
                onClick={handleCloseMatchAnalysis}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <MatchReasonsCard
                suitabilityScore={selectedAppForAnalysis.aiScore}
                expandable={false}
                defaultExpanded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

