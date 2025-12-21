import React from "react";
import styles from "./SuitabilityScoreBadge.module.css";

/**
 * SuitabilityScoreBadge Component
 * Displays AI suitability score with visual indicator
 * 
 * @param {number} score - Score from 0-100
 * @param {string} level - "excellent" | "good" | "fair" | "poor"
 * @param {string} size - "small" | "medium" | "large"
 */
export default function SuitabilityScoreBadge({ score, level, size = "medium" }) {
  const getColorClass = () => {
    switch (level) {
      case "excellent":
        return styles.excellent;
      case "good":
        return styles.good;
      case "fair":
        return styles.fair;
      case "poor":
        return styles.poor;
      default:
        return styles.good;
    }
  };

  const getLabel = () => {
    switch (level) {
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "fair":
        return "Fair";
      case "poor":
        return "Poor";
      default:
        return "N/A";
    }
  };

  // Calculate circumference for circular progress
  const radius = size === "small" ? 18 : size === "large" ? 30 : 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`${styles.container} ${styles[size]}`}>
      <div className={styles.circularProgress}>
        <svg className={styles.svg} width={radius * 2 + 8} height={radius * 2 + 8}>
          {/* Background circle */}
          <circle
            className={styles.backgroundCircle}
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <circle
            className={`${styles.progressCircle} ${getColorClass()}`}
            cx={radius + 4}
            cy={radius + 4}
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + 4} ${radius + 4})`}
          />
        </svg>
        <div className={styles.scoreText}>
          <span className={styles.scoreNumber}>{Math.round(score)}</span>
          <span className={styles.scoreLabel}>%</span>
        </div>
      </div>
      <div className={`${styles.badge} ${getColorClass()}`}>
        {getLabel()}
      </div>
    </div>
  );
}

