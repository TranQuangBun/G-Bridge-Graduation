import React from "react";
import { FaTimes, FaUser, FaMapMarkerAlt, FaBriefcase } from "react-icons/fa";
import { SuitabilityScoreBadge } from "./";
import styles from "./AIMatchModal.module.css";

/**
 * AIMatchModal Component
 * Modal displaying AI-suggested interpreters or jobs
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Close handler
 * @param {string} title - Modal title
 * @param {Array} matches - Array of match results
 * @param {Function} onViewDetails - Handler for viewing match details
 * @param {Function} onInvite - Handler for inviting (for interpreters)
 * @param {Function} onApply - Handler for applying (for jobs)
 * @param {string} type - "interpreters" | "jobs"
 */
export default function AIMatchModal({
  isOpen,
  onClose,
  title = "AI Suggested Matches",
  matches = [],
  onViewDetails,
  onInvite,
  onApply,
  type = "interpreters",
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {matches.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No matches found</p>
            </div>
          ) : (
            <div className={styles.matchesList}>
              {matches.map((match, index) => {
                const item = type === "interpreters" ? match.interpreter : match.job;
                const score = match.suitability_score || match.suitabilityScore;

                return (
                  <div key={match.interpreter_id || match.job_id || index} className={styles.matchCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardLeft}>
                        {type === "interpreters" ? (
                          <>
                            <div className={styles.avatar}>
                              {item?.user?.avatar ? (
                                <img src={item.user.avatar} alt={item.user.name} />
                              ) : (
                                <FaUser />
                              )}
                            </div>
                            <div className={styles.info}>
                              <h3 className={styles.name}>
                                {item?.user?.name || item?.name || "Unknown"}
                              </h3>
                              <p className={styles.subtitle}>
                                {item?.languages?.map((l) => l.language || l).join(", ") || "No languages"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={styles.jobIcon}>
                              <FaBriefcase />
                            </div>
                            <div className={styles.info}>
                              <h3 className={styles.name}>{item?.title || "Unknown Job"}</h3>
                              <p className={styles.subtitle}>
                                <FaMapMarkerAlt /> {item?.province || item?.location || "Location TBD"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className={styles.cardRight}>
                        <SuitabilityScoreBadge
                          score={score?.overall_score || 0}
                          level={score?.score_level || "fair"}
                          size="medium"
                        />
                        <span className={styles.priority}>#{match.match_priority || index + 1}</span>
                      </div>
                    </div>

                    <div className={styles.cardBody}>
                      {score?.recommendation && (
                        <p className={styles.recommendation}>{score.recommendation}</p>
                      )}
                      {score?.strengths && score.strengths.length > 0 && (
                        <div className={styles.strengths}>
                          <strong>Strengths: </strong>
                          {score.strengths.slice(0, 2).join(", ")}
                        </div>
                      )}
                    </div>

                    <div className={styles.cardActions}>
                      {onViewDetails && (
                        <button
                          className={styles.viewDetailsButton}
                          onClick={() => onViewDetails(match)}
                        >
                          View Match Details
                        </button>
                      )}
                      {type === "interpreters" && onInvite && (
                        <button
                          className={styles.inviteButton}
                          onClick={() => onInvite(match)}
                        >
                          Invite
                        </button>
                      )}
                      {type === "jobs" && onApply && (
                        <button
                          className={styles.applyButton}
                          onClick={() => onApply(match)}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

