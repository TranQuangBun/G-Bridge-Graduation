import React, { useState } from "react";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaLock,
  FaStar,
  FaCrown,
  FaCheckCircle,
  FaBell,
  FaBriefcase,
} from "react-icons/fa";
import styles from "./FreemiumAdvancedSearch.module.css";

const FreemiumAdvancedSearch = ({ isVip = false, onSearch, onUpgrade }) => {
  // Demo mode toggle (for testing)
  const [demoIsVip, setDemoIsVip] = useState(isVip);

  // Basic search state
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  // Advanced filters state
  const [salaryRange, setSalaryRange] = useState([1000, 5000]);
  const [experienceLevels, setExperienceLevels] = useState({
    entry: false,
    junior: false,
    mid: false,
    senior: false,
    lead: false,
  });
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  const handleExperienceToggle = (level) => {
    setExperienceLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        keyword,
        location,
        ...(demoIsVip && {
          salaryRange,
          experienceLevels,
          verifiedOnly,
          urgentOnly,
        }),
      });
    }
  };

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      alert("Upgrade to VIP to unlock Advanced Filters!");
    }
  };

  return (
    <div className={styles.searchContainer}>
      {/* Demo Toggle (Remove in production) */}
      <div className={styles.demoToggle}>
        <span className={styles.demoLabel}>Demo Mode:</span>
        <button
          onClick={() => setDemoIsVip(!demoIsVip)}
          className={`${styles.demoSwitch} ${demoIsVip ? styles.active : ""}`}
        >
          <span className={styles.demoSwitchKnob} />
        </button>
        <span className={styles.demoLabel}>
          {demoIsVip ? (
            <span
              style={{
                color: "#fbbf24",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <FaCrown /> VIP User
            </span>
          ) : (
            <span>Free User</span>
          )}
        </span>
      </div>

      {/* VIP Status Banner */}
      {demoIsVip && (
        <div className={styles.vipBanner}>
          <FaCrown className={styles.vipIcon} />
          <span className={styles.vipText}>
            You're using VIP Advanced Filters
          </span>
        </div>
      )}

      {/* Search Title */}
      <h2 className={styles.searchTitle}>Find Your Perfect Match</h2>

      {/* Basic Search Section */}
      <div className={styles.basicSearch}>
        {/* Keyword Input */}
        <div className={styles.inputGroup}>
          <FaBriefcase className={styles.inputIcon} />
          <input
            type="text"
            placeholder="Job Title or Keywords..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Location Input */}
        <div className={styles.inputGroup}>
          <FaMapMarkerAlt className={styles.inputIcon} />
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div
        className={`${styles.advancedSection} ${
          !demoIsVip ? styles.locked : ""
        }`}
      >
        <h3 className={styles.advancedTitle}>
          <FaStar style={{ color: "#fbbf24" }} />
          Advanced Filters
          {!demoIsVip && (
            <span
              style={{
                marginLeft: "auto",
                fontSize: "14px",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <FaCrown /> VIP Only
            </span>
          )}
        </h3>

        {/* Blur Overlay for Free Users */}
        {!demoIsVip && (
          <div className={styles.paywallOverlay}>
            <div className={styles.lockIcon}>
              <FaLock className={styles.lockIconSvg} />
            </div>
            <h4 className={styles.upgradeTitle}>Unlock Advanced Filters</h4>
            <p className={styles.upgradeDesc}>
              Get access to salary range, experience filters, and more premium
              features!
            </p>
            <button
              onClick={handleUpgradeClick}
              className={styles.upgradeButton}
            >
              <FaCrown />
              <span>Upgrade to VIP</span>
            </button>
          </div>
        )}

        {/* Salary Range */}
        <div className={styles.salaryGroup}>
          <label className={styles.salaryLabel}>
            Salary Range ($/month):{" "}
            <span className={styles.salaryValue}>
              ${salaryRange[0]} - ${salaryRange[1]}
            </span>
          </label>
          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={salaryRange[0]}
            onChange={(e) =>
              setSalaryRange([parseInt(e.target.value), salaryRange[1]])
            }
            className={styles.salarySlider}
            disabled={!demoIsVip}
          />
          <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={salaryRange[1]}
            onChange={(e) =>
              setSalaryRange([salaryRange[0], parseInt(e.target.value)])
            }
            className={styles.salarySlider}
            disabled={!demoIsVip}
            style={{ marginTop: "8px" }}
          />
        </div>

        {/* Experience Levels */}
        <div className={styles.experienceGroup}>
          <label className={styles.experienceLabel}>Experience Level</label>
          <div className={styles.experienceGrid}>
            {Object.entries({
              entry: "Entry",
              junior: "Junior",
              mid: "Mid",
              senior: "Senior",
              lead: "Lead",
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleExperienceToggle(key)}
                className={`${styles.experienceChip} ${
                  experienceLevels[key] ? styles.active : ""
                }`}
                disabled={!demoIsVip}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Filters */}
        <div className={styles.toggleGroup}>
          {/* Verified Toggle */}
          <div
            className={`${styles.toggleOption} ${
              verifiedOnly ? styles.active : ""
            }`}
            onClick={() => demoIsVip && setVerifiedOnly(!verifiedOnly)}
          >
            <div className={styles.toggleLabel}>
              <FaCheckCircle />
              <span>Verified Only</span>
            </div>
            <div className={styles.toggleSwitch}>
              <span className={styles.toggleKnob} />
            </div>
          </div>

          {/* Urgent Toggle */}
          <div
            className={`${styles.toggleOption} ${
              urgentOnly ? styles.active : ""
            }`}
            onClick={() => demoIsVip && setUrgentOnly(!urgentOnly)}
          >
            <div className={styles.toggleLabel}>
              <FaBell />
              <span>Urgent Hiring</span>
            </div>
            <div className={styles.toggleSwitch}>
              <span className={styles.toggleKnob} />
            </div>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <button onClick={handleSearch} className={styles.searchButton}>
        <FaSearch />
        <span>Search Jobs</span>
      </button>
    </div>
  );
};

export default FreemiumAdvancedSearch;
