import React from "react";
import styles from "./AIToggle.module.css";

/**
 * Professional Toggle Component for switching between AI and All views
 * 
 * @param {string} value - Current active option: "ai" or "all"
 * @param {Function} onChange - Callback when option changes
 * @param {boolean} loading - Whether AI is loading
 * @param {boolean} disabled - Whether toggle is disabled
 * @param {string} variant - Size variant: "default" | "compact" | "large"
 * @param {string} aiLabel - Label for AI option (default: "AI")
 * @param {string} allLabel - Label for All option (default: "All")
 */
export default function AIToggle({
  value = "all",
  onChange,
  loading = false,
  disabled = false,
  variant = "default",
  aiLabel = "AI",
  allLabel = "All",
}) {
  const handleClick = (option) => {
    if (disabled || loading || value === option) return;
    onChange(option);
  };

  return (
    <div className={`${styles.toggleContainer} ${styles[variant] || ""}`}>
      <button
        type="button"
        className={`${styles.toggleOption} ${value === "ai" ? styles.active : ""} ${loading && value === "ai" ? styles.loading : ""}`}
        onClick={() => handleClick("ai")}
        disabled={disabled || loading}
      >
        {loading && value === "ai" ? "" : aiLabel}
      </button>
      <button
        type="button"
        className={`${styles.toggleOption} ${value === "all" ? styles.active : ""}`}
        onClick={() => handleClick("all")}
        disabled={disabled || loading}
      >
        {allLabel}
      </button>
    </div>
  );
}

