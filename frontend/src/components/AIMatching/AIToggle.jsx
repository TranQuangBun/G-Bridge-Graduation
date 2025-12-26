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
 * @param {boolean} requiresSubscription - Whether AI feature requires subscription
 * @param {boolean} hasActiveSubscription - Whether user has active subscription
 * @param {Function} onSubscriptionRequired - Callback when user tries to use AI without subscription
 */
export default function AIToggle({
  value = "all",
  onChange,
  loading = false,
  disabled = false,
  variant = "default",
  aiLabel = "AI",
  allLabel = "All",
  requiresSubscription = false,
  hasActiveSubscription = false,
  onSubscriptionRequired,
}) {
  const handleClick = (option) => {
    if (disabled || loading || value === option) return;
    
    // Check subscription requirement for AI option
    if (option === "ai" && requiresSubscription && !hasActiveSubscription) {
      if (onSubscriptionRequired) {
        onSubscriptionRequired();
      }
      return;
    }
    
    onChange(option);
  };

  // Disable AI button if subscription is required but not active
  const aiDisabled = disabled || loading || (requiresSubscription && !hasActiveSubscription);

  return (
    <div className={`${styles.toggleContainer} ${styles[variant] || ""}`}>
      <button
        type="button"
        className={`${styles.toggleOption} ${value === "ai" ? styles.active : ""} ${loading && value === "ai" ? styles.loading : ""} ${aiDisabled && !hasActiveSubscription ? styles.subscriptionRequired : ""}`}
        onClick={() => handleClick("ai")}
        disabled={aiDisabled}
        title={requiresSubscription && !hasActiveSubscription ? "Đăng ký gói để sử dụng tính năng AI" : ""}
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

