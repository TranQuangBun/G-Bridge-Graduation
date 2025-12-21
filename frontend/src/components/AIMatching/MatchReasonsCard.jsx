import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import SuitabilityScoreBadge from "./SuitabilityScoreBadge";
import styles from "./MatchReasonsCard.module.css";

/**
 * MatchReasonsCard Component
 * Displays detailed AI match analysis with reasons, strengths, and weaknesses
 * 
 * @param {Object} suitabilityScore - Suitability score object from AI
 * @param {boolean} expandable - Whether card can be expanded/collapsed
 * @param {boolean} defaultExpanded - Default expanded state
 */
export default function MatchReasonsCard({
  suitabilityScore,
  expandable = true,
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!suitabilityScore) {
    return null;
  }

  const { overall_score, score_level, reasons, strengths, weaknesses, recommendation } =
    suitabilityScore;

  const toggleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header} onClick={toggleExpand}>
        <div className={styles.headerLeft}>
          <SuitabilityScoreBadge score={overall_score} level={score_level} size="medium" />
          <div className={styles.headerText}>
            <h3 className={styles.title}>AI Match Analysis</h3>
            <p className={styles.recommendation}>{recommendation}</p>
          </div>
        </div>
        {expandable && (
          <div className={styles.expandIcon}>
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {(!expandable || isExpanded) && (
        <div className={styles.content}>
          {/* Category Breakdown */}
          {reasons && reasons.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Category Breakdown</h4>
              <div className={styles.reasonsList}>
                {reasons.map((reason, index) => (
                  <div key={index} className={styles.reasonItem}>
                    <div className={styles.reasonHeader}>
                      <span className={styles.reasonCategory}>{reason.category}</span>
                      <span className={styles.reasonScore}>{Math.round(reason.score)}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{
                          width: `${reason.score}%`,
                          backgroundColor:
                            reason.score >= 80
                              ? "#10b981"
                              : reason.score >= 60
                              ? "#3b82f6"
                              : reason.score >= 40
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    <p className={styles.reasonExplanation}>{reason.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths && strengths.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <FaCheckCircle className={styles.strengthIcon} />
                Key Strengths
              </h4>
              <ul className={styles.strengthsList}>
                {strengths.map((strength, index) => (
                  <li key={index} className={styles.strengthItem}>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses && weaknesses.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>
                <FaExclamationTriangle className={styles.weaknessIcon} />
                Potential Gaps
              </h4>
              <ul className={styles.weaknessesList}>
                {weaknesses.map((weakness, index) => (
                  <li key={index} className={styles.weaknessItem}>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

