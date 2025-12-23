import React, { useState, useEffect, useCallback } from "react";
import { FaSpinner } from "react-icons/fa";
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

  // Handle AI button click
  const handleAIClick = async () => {
    if (showAIResults) {
      // If already showing AI results, hide them
      setShowAIResults(false);
      return;
    }
    
    // If not fetched yet, fetch now
    if (!hasFetchedAI) {
      await fetchAIRankedApplications();
    }
    
    setShowAIResults(true);
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
      {/* Controls */}
      <div className={styles.controls}>
        {/* Filter Controls - Only show when AI results are displayed */}
        {showAIResults && hasFetchedAI && (
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

        {/* AI Button */}
        <button
          className={`${styles.aiButton} ${showAIResults ? styles.active : ""}`}
          onClick={handleAIClick}
          disabled={loading || !jobId || applications.length === 0}
          title={loading ? "AI Analyzing..." : showAIResults ? "Show All Applications" : "Get AI Rankings"}
        >
          {loading ? (
            <FaSpinner className={styles.spinningIcon} />
          ) : showAIResults ? (
            <svg 
              stroke="currentColor" 
              fill="currentColor" 
              strokeWidth="0" 
              viewBox="0 0 512 512" 
              height="1em" 
              width="1em" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"></path>
            </svg>
          ) : (
            <svg 
              stroke="currentColor" 
              fill="currentColor" 
              strokeWidth="0" 
              viewBox="0 0 512 512" 
              height="1em" 
              width="1em" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224 96l16-32 32-16-32-16-16-32-16 32-32 16 32 16 16 32zM80 160l26.66-53.33L160 80l-53.34-26.67L80 0 53.34 53.33 0 80l53.34 26.67L80 160zm352 128l-26.66 53.33L352 368l53.34 26.67L432 448l26.66-53.33L512 368l-53.34-26.67L432 288zm70.62-193.77L417.77 9.38C411.53 3.12 403.34 0 395.15 0c-8.19 0-16.38 3.12-22.63 9.38L9.38 372.52c-12.5 12.5-12.5 32.76 0 45.25l84.85 84.85c6.25 6.25 14.44 9.37 22.62 9.37 8.19 0 16.38-3.12 22.63-9.37l363.14-363.15c12.5-12.48 12.5-32.75 0-45.24zM359.45 203.46l-50.91-50.91 86.6-86.6 50.91 50.91-86.6 86.6z"></path>
            </svg>
          )}
        </button>
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

