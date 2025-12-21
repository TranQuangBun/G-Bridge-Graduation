import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import interpreterService from "../../services/interpreterService";
import savedInterpreterService from "../../services/savedInterpreterService";
import aiMatchingService from "../../services/aiMatchingService";
import { SuitabilityScoreBadge } from "../../components/AIMatching";
import { InterpreterModal } from "../../components/InterpreterModal";
import { toast } from "react-toastify";
import styles from "./FindInterpreterPage.module.css";
import {
  FaStar,
  FaBriefcase,
  FaDollarSign,
  FaMapMarkerAlt,
  FaBookmark,
  FaRegBookmark,
  FaInfoCircle,
} from "react-icons/fa";

const FindInterpreterPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId"); // Optional: if coming from a job context

  // State
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedInterpreterId, setSelectedInterpreterId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedInterpreters, setSavedInterpreters] = useState(new Set());

  // Other input states for custom languages and specializations
  const [otherLanguage, setOtherLanguage] = useState("");
  const [otherSpecialization, setOtherSpecialization] = useState("");

  // AI Recommended interpreters (when jobId is provided)
  const [aiRecommended, setAiRecommended] = useState([]);
  const [loadingAIRecommended, setLoadingAIRecommended] = useState(false);

  // Temporary filters for modal (not applied yet)
  const [tempFilters, setTempFilters] = useState({
    location: "",
    languages: [],
    specializations: [],
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    languages: [],
    minRate: "",
    maxRate: "",
    minExperience: "",
    specializations: [],
    rating: "",
    location: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
    page: 1,
    limit: 12,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  // Debug: Log when interpreters state changes
  useEffect(() => {
    console.log("🔄 Interpreters state updated:", interpreters.length, "items");
    if (interpreters.length > 0) {
      console.log("📋 Sample interpreter:", {
        id: interpreters[0].id,
        name: interpreters[0].fullName,
        experience: interpreters[0].profile?.experience || 0,
      });
    }
  }, [interpreters]);

  // Load saved interpreters function
  const loadSavedInterpreters = useCallback(async () => {
    try {
      const result = await savedInterpreterService.getAllSavedInterpreters();
      console.log("🔄 Loading saved interpreters:", result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const savedIds = new Set(result.data.map((item) => item.id));
        console.log("✅ Saved IDs loaded:", Array.from(savedIds));
        setSavedInterpreters(savedIds);
      } else {
        console.log("⚠️ No saved data or invalid format");
        setSavedInterpreters(new Set());
      }
    } catch (error) {
      console.error("❌ Error loading saved interpreters:", error);
      setSavedInterpreters(new Set());
    }
  }, []);

  // Check authentication
  useEffect(() => {
    if (!user) {
      toast.error("Please login to view interpreters");
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch AI recommended interpreters (only when user clicks button)
  const handleFetchAIRecommended = async () => {
    if (!jobId) {
      toast.error("Job ID is required for AI recommendations");
      return;
    }
    
    setLoadingAIRecommended(true);
    try {
      const response = await aiMatchingService.matchJobToInterpreters(jobId, 5);
      if (response.success && response.data?.matched_interpreters) {
        // Map to interpreter format - need to fetch full interpreter data
        const recommended = [];
        for (const match of response.data.matched_interpreters) {
          try {
            const interpreterRes = await interpreterService.getInterpreterById(match.interpreter_id);
            if (interpreterRes?.data) {
              recommended.push({
                id: match.interpreter_id,
                interpreter: interpreterRes.data,
                suitability_score: match.suitability_score,
                match_priority: match.match_priority,
              });
            }
          } catch (err) {
            console.error(`Error fetching interpreter ${match.interpreter_id}:`, err);
          }
        }
        setAiRecommended(recommended);
      } else {
        toast.error("No AI recommendations available");
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast.error("Failed to fetch AI recommendations");
    } finally {
      setLoadingAIRecommended(false);
    }
  };

  // Load saved interpreters on mount and when page becomes visible
  useEffect(() => {
    if (user) {
      // fetchFilterOptions(); // Commented out due to backend error
      loadSavedInterpreters();
    }

    // Reload saved interpreters when user returns to tab
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log("🔄 Page visible again, reloading saved interpreters");
        loadSavedInterpreters();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loadSavedInterpreters]);

  // Fetch interpreters when filters change
  useEffect(() => {
    if (!user) return;

    console.log("⚡ useEffect triggered, filters changed");

    // Only debounce search input
    if (filters.search !== "") {
      const debounceTimer = setTimeout(() => {
        fetchInterpreters();
      }, 500);
      return () => clearTimeout(debounceTimer);
    } else {
      // Fetch immediately for all other changes
      fetchInterpreters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.sortBy, filters.sortOrder, user]);
  
  // eslint-disable-next-line no-unused-vars
  const fetchInterpreters = async () => {
    console.log("🔍 Fetching interpreters with filters:", filters);
    setLoading(true);
    try {
      // Build query filters and remove empty values
      const queryFilters = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      // Add optional filters only if they have values
      if (filters.search && filters.search.trim()) {
        queryFilters.search = filters.search.trim();
      }
      if (filters.languages && filters.languages.length > 0) {
        queryFilters.languages = filters.languages.join(",");
      }
      if (filters.specializations && filters.specializations.length > 0) {
        queryFilters.specializations = filters.specializations.join(",");
      }
      if (filters.minRate && filters.minRate !== "") {
        queryFilters.minRate = Number(filters.minRate);
      }
      if (filters.maxRate && filters.maxRate !== "") {
        queryFilters.maxRate = Number(filters.maxRate);
      }
      if (filters.minExperience && filters.minExperience !== "") {
        queryFilters.minExperience = Number(filters.minExperience);
      }
      if (filters.rating && filters.rating !== "") {
        queryFilters.rating = Number(filters.rating);
      }
      if (filters.location && filters.location.trim()) {
        queryFilters.location = filters.location.trim();
      }

      console.log("📤 Sending API request with filters:", queryFilters);
      const response = await interpreterService.getInterpreters(queryFilters);
      console.log("📥 Received response:", response);
      console.log(
        "📥 Interpreters count:",
        response.data?.interpreters?.length || 0
      );

      // Map interpreterProfile to profile for consistency
      const interpretersWithProfile = (response.data.interpreters || []).map(
        (interpreter) => ({
          ...interpreter,
          profile: interpreter.interpreterProfile || interpreter.profile,
        })
      );

      console.log("✅ Mapped interpreters:", interpretersWithProfile.length);
      console.log("👤 First interpreter sample:", interpretersWithProfile[0]);

      setInterpreters(interpretersWithProfile);
      setPagination(response.data.pagination || {});

      console.log(
        "✅ State updated - interpreters count:",
        interpretersWithProfile.length
      );
    } catch (error) {
      console.error("❌ Error fetching interpreters:", error);
      toast.error("Failed to load interpreters");
      setInterpreters([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchInterpreters();
  };

  const handleFilterChange = (key, value) => {
    console.log(`🔧 Filter change: ${key} = ${value}`);
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  // Handlers for temporary filters in modal
  const handleTempFilterChange = (key, value) => {
    setTempFilters({ ...tempFilters, [key]: value });
  };

  const handleTempLanguageToggle = (lang) => {
    const newLanguages = tempFilters.languages.includes(lang)
      ? tempFilters.languages.filter((l) => l !== lang)
      : [...tempFilters.languages, lang];
    setTempFilters({ ...tempFilters, languages: newLanguages });
  };

  const handleTempSpecializationToggle = (spec) => {
    const newSpecs = tempFilters.specializations.includes(spec)
      ? tempFilters.specializations.filter((s) => s !== spec)
      : [...tempFilters.specializations, spec];
    setTempFilters({ ...tempFilters, specializations: newSpecs });
  };

  // Apply advanced filters
  const handleApplyAdvancedFilters = () => {
    setFilters({
      ...filters,
      location: tempFilters.location,
      languages: tempFilters.languages,
      specializations: tempFilters.specializations,
      page: 1,
    });
    setShowAdvancedFilters(false);
    // fetchInterpreters will be called by useEffect when filters change
  };

  // Open advanced filters modal and sync temp filters
  const handleOpenAdvancedFilters = () => {
    setTempFilters({
      location: filters.location,
      languages: filters.languages,
      specializations: filters.specializations,
    });
    setShowAdvancedFilters(true);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      languages: [],
      minRate: "",
      maxRate: "",
      minExperience: "",
      specializations: [],
      rating: "",
      location: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
      page: 1,
      limit: 12,
    });
    fetchInterpreters();
  };

  const handleViewProfile = (interpreterId) => {
    setSelectedInterpreterId(interpreterId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInterpreterId(null);
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleSave = async (interpreterId, e) => {
    e.stopPropagation();

    const isSaved = savedInterpreters.has(interpreterId);
    console.log(
      `🔘 Toggle save for interpreter ${interpreterId}, currently saved: ${isSaved}`
    );

    // Optimistic UI update
    setSavedInterpreters((prev) => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.delete(interpreterId);
      } else {
        newSet.add(interpreterId);
      }
      return newSet;
    });

    // Call API
    const result = isSaved
      ? await savedInterpreterService.unsaveInterpreter(interpreterId)
      : await savedInterpreterService.saveInterpreter(interpreterId);

    if (result.success) {
      console.log(`✅ ${isSaved ? "Unsaved" : "Saved"} successfully`);
      toast.success(
        isSaved
          ? "Interpreter removed from saved"
          : "Interpreter saved successfully"
      );
    } else {
      console.error(
        `❌ Failed to ${isSaved ? "unsave" : "save"}:`,
        result.message
      );
      // Rollback on error
      setSavedInterpreters((prev) => {
        const newSet = new Set(prev);
        if (isSaved) {
          newSet.add(interpreterId);
        } else {
          newSet.delete(interpreterId);
        }
        return newSet;
      });
      toast.error(result.message || "Failed to update saved status");
    }
  };

  return (
    <MainLayout>
      <div className={styles.findInterpreterPage}>
        {/* AI Recommended Section - Only when jobId is provided */}
        {jobId && (
          <div className={styles.aiRecommendedSection}>
            <div className={styles.aiSectionHeader}>
              <h2 className={styles.aiSectionTitle}>
                🤖 AI Recommended Interpreters
              </h2>
              <p className={styles.aiSectionSubtitle}>
                Get AI-powered recommendations based on your job requirements
              </p>
              {!loadingAIRecommended && aiRecommended.length === 0 && (
                <button
                  className={styles.aiFetchButton}
                  onClick={handleFetchAIRecommended}
                >
                  Get AI Recommendations
                </button>
              )}
              {loadingAIRecommended && (
                <div className={styles.aiLoading}>
                  <p>AI is analyzing and finding the best interpreters...</p>
                </div>
              )}
            </div>
            {!loadingAIRecommended && aiRecommended.length > 0 && (
            <div className={styles.aiRecommendedGrid}>
              {aiRecommended.map((match) => {
                const interpreter = match.interpreter;
                return (
                  <div key={match.id} className={styles.aiRecommendedCard}>
                    <div className={styles.aiCardHeader}>
                      <div className={styles.aiInterpreterInfo}>
                        <h3 className={styles.aiInterpreterName}>
                          {interpreter?.user?.name || interpreter?.fullName || interpreter?.name || "Unknown"}
                        </h3>
                        <p className={styles.aiInterpreterLanguages}>
                          {interpreter?.languages?.map((l) => l.language || l).join(", ") || 
                           interpreter?.profile?.languages?.map((l) => l.language || l).join(", ") || 
                           "No languages"}
                        </p>
                      </div>
                      <div className={styles.aiScoreSection}>
                        <SuitabilityScoreBadge
                          score={match.suitability_score?.overall_score || 0}
                          level={match.suitability_score?.score_level || "fair"}
                          size="small"
                        />
                        <span className={styles.aiRank}>#{match.match_priority}</span>
                      </div>
                    </div>
                    <p className={styles.aiRecommendation}>
                      {match.suitability_score?.recommendation}
                    </p>
                    <button
                      className={styles.aiViewButton}
                      onClick={() => handleViewProfile(match.id)}
                    >
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Interpreter Modal */}
        {showModal && selectedInterpreterId && (
          <InterpreterModal
            interpreterId={selectedInterpreterId}
            onClose={handleCloseModal}
          />
        )}

        {/* Advanced Filters Modal */}
        {showAdvancedFilters && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowAdvancedFilters(false)}
          >
            <div
              className={styles.advancedFiltersModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{t("findInterpreter.filters.advanced")}</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowAdvancedFilters(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Location */}
                <div className={styles.filterSection}>
                  <label>{t("findInterpreter.filters.location")}</label>
                  <input
                    type="text"
                    placeholder={t(
                      "findInterpreter.filters.locationPlaceholder"
                    )}
                    value={tempFilters.location}
                    onChange={(e) =>
                      handleTempFilterChange("location", e.target.value)
                    }
                    className={styles.searchInput}
                  />
                </div>

                {/* Languages - Multiple Selection */}
                <div className={styles.filterSection}>
                  <label className={styles.labelWithTooltip}>
                    {t("findInterpreter.filters.languages")}
                    <span className={styles.tooltipWrapper}>
                      <FaInfoCircle className={styles.infoIcon} />
                      <span className={styles.tooltip}>
                        {t("findInterpreter.filters.languagesTooltip")}
                      </span>
                    </span>
                  </label>
                  <div className={styles.checkboxGroup}>
                    {[
                      "English",
                      "Vietnamese",
                      "Chinese",
                      "Japanese",
                      "Korean",
                      "French",
                      "German",
                      "Spanish",
                      "Thai",
                      "Russian",
                    ].map((lang) => (
                      <div key={lang} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`lang-${lang}`}
                          checked={tempFilters.languages.includes(lang)}
                          onChange={() => handleTempLanguageToggle(lang)}
                        />
                        <label htmlFor={`lang-${lang}`}>{lang}</label>
                      </div>
                    ))}
                  </div>
                  {/* Other Language Input */}
                  <div className={styles.otherInputWrapper}>
                    <input
                      type="text"
                      placeholder={t(
                        "findInterpreter.filters.otherLanguagePlaceholder"
                      )}
                      value={otherLanguage}
                      onChange={(e) => setOtherLanguage(e.target.value)}
                      className={styles.otherInput}
                    />
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => {
                        if (
                          otherLanguage.trim() &&
                          !tempFilters.languages.includes(otherLanguage.trim())
                        ) {
                          handleTempLanguageToggle(otherLanguage.trim());
                          setOtherLanguage("");
                        }
                      }}
                    >
                      {t("findInterpreter.filters.addButton")}
                    </button>
                  </div>
                </div>

                {/* Specializations */}
                <div className={styles.filterSection}>
                  <label className={styles.labelWithTooltip}>
                    {t("findInterpreter.filters.specializations")}
                    <span className={styles.tooltipWrapper}>
                      <FaInfoCircle className={styles.infoIcon} />
                      <span className={styles.tooltip}>
                        {t("findInterpreter.filters.specializationsTooltip")}
                      </span>
                    </span>
                  </label>
                  <div className={styles.checkboxGroup}>
                    {[
                      "Medical",
                      "Legal",
                      "Business",
                      "Technical",
                      "Educational",
                      "Tourism",
                      "Conference",
                      "Media",
                      "Government",
                      "Finance",
                      "Marketing",
                      "IT & Software",
                    ].map((spec) => (
                      <div key={spec} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`spec-${spec}`}
                          checked={tempFilters.specializations.includes(spec)}
                          onChange={() => handleTempSpecializationToggle(spec)}
                        />
                        <label htmlFor={`spec-${spec}`}>{spec}</label>
                      </div>
                    ))}
                  </div>
                  {/* Other Specialization Input */}
                  <div className={styles.otherInputWrapper}>
                    <input
                      type="text"
                      placeholder={t(
                        "findInterpreter.filters.otherSpecializationPlaceholder"
                      )}
                      value={otherSpecialization}
                      onChange={(e) => setOtherSpecialization(e.target.value)}
                      className={styles.otherInput}
                    />
                    <button
                      type="button"
                      className={styles.addBtn}
                      onClick={() => {
                        if (
                          otherSpecialization.trim() &&
                          !tempFilters.specializations.includes(
                            otherSpecialization.trim()
                          )
                        ) {
                          handleTempSpecializationToggle(
                            otherSpecialization.trim()
                          );
                          setOtherSpecialization("");
                        }
                      }}
                    >
                      {t("findInterpreter.filters.addButton")}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.clearModalBtn}
                  onClick={() => {
                    setTempFilters({
                      location: "",
                      languages: [],
                      specializations: [],
                    });
                  }}
                >
                  {t("findInterpreter.filters.clearAll")}
                </button>
                <button
                  className={styles.applyModalBtn}
                  onClick={handleApplyAdvancedFilters}
                >
                  {t("findInterpreter.filters.apply")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>{t("findInterpreter.title")}</h1>
            <p>{t("findInterpreter.subtitle")}</p>
          </div>
        </div>

        <div className={styles.pageContainer}>
          {/* Sidebar Filters */}
          <aside className={styles.filterSidebar}>
            <div className={styles.filterHeader}>
              <h3>{t("findInterpreter.filters.title")}</h3>
              <button className={styles.clearBtn} onClick={handleClearFilters}>
                {t("findInterpreter.filters.clearAll")}
              </button>
            </div>

            {/* Search */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.search")}</label>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder={t("findInterpreter.filters.searchPlaceholder")}
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className={styles.searchInput}
                />
              </form>
            </div>

            {/* Hourly Rate Filter */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.hourlyRate")}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minRate}
                  onChange={(e) =>
                    handleFilterChange("minRate", e.target.value)
                  }
                  className={styles.rangeInput}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxRate}
                  onChange={(e) =>
                    handleFilterChange("maxRate", e.target.value)
                  }
                  className={styles.rangeInput}
                />
              </div>
            </div>

            {/* Experience Filter */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.minExperience")}</label>
              <select
                value={filters.minExperience}
                onChange={(e) =>
                  handleFilterChange("minExperience", e.target.value)
                }
                className={styles.selectInput}
              >
                <option value="">Any</option>
                <option value="1">1+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.minRating")}</label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange("rating", e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Any</option>
                <option value="4">4+ ⭐</option>
                <option value="4.5">4.5+ ⭐</option>
                <option value="4.8">4.8+ ⭐</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              className={styles.advancedToggle}
              onClick={handleOpenAdvancedFilters}
            >
              {t("findInterpreter.filters.advanced")}
            </button>

            <button className={styles.applyBtn} onClick={fetchInterpreters}>
              {t("findInterpreter.filters.apply")}
            </button>
          </aside>

          {/* Main Content */}
          <main className={styles.mainContent}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
              <div className={styles.resultsInfo}>
                <span>
                  {pagination.total} {t("findInterpreter.resultsFound")}
                </span>
              </div>

              <div className={styles.sortControls}>
                <label>{t("findInterpreter.sortBy")}</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className={styles.sortSelect}
                >
                  <option value="createdAt">
                    {t("findInterpreter.sort.newest")}
                  </option>
                  <option value="rating">
                    {t("findInterpreter.sort.topRated")}
                  </option>
                  <option value="experience">
                    {t("findInterpreter.sort.experience")}
                  </option>
                </select>
              </div>
            </div>

            {/* Interpreter Grid */}
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>{t("common.loading")}</p>
              </div>
            ) : interpreters.length > 0 ? (
              <div className={styles.interpreterGrid}>
                {interpreters.map((interpreter) => (
                  <div key={interpreter.id} className={styles.interpreterCard}>
                    {/* Avatar */}
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarContainer}>
                        {interpreter.avatar ? (
                          <img
                            src={`http://localhost:4000${interpreter.avatar}`}
                            alt={interpreter.fullName}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {interpreter.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        {interpreter.profile?.rating >= 4.5 && (
                          <div className={styles.badge}>
                            <FaStar /> Top Rated
                          </div>
                        )}
                      </div>
                      <h3 className={styles.interpreterName}>
                        {interpreter.fullName}
                      </h3>
                      <div className={styles.ratingRow}>
                        <span className={styles.rating}>
                          <FaStar />{" "}
                          {interpreter.profile?.rating
                            ? Number(interpreter.profile.rating).toFixed(1)
                            : "N/A"}
                        </span>
                        <span className={styles.reviews}>
                          ({interpreter.profile?.totalReviews || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className={styles.cardBody}>
                      <div className={styles.infoRow}>
                        <span className={styles.icon}>
                          <FaBriefcase />
                        </span>
                        <span>
                          {interpreter.profile?.experience || 0} years
                          experience
                        </span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.icon}>
                          <FaDollarSign />
                        </span>
                        <span>
                          $
                          {Number(interpreter.profile?.hourlyRate || 0).toFixed(
                            2
                          )}
                          /hr
                        </span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.icon}>
                          <FaMapMarkerAlt />
                        </span>
                        <span>
                          {interpreter.address || "Location not specified"}
                        </span>
                      </div>

                      {/* Languages */}
                      <div className={styles.languagesSection}>
                        <strong>{t("findInterpreter.card.languages")}:</strong>
                        <div className={styles.tagsList}>
                          {interpreter.languages?.slice(0, 3).map((lang) => (
                            <span key={lang.id} className={styles.tag}>
                              {lang.name}
                            </span>
                          ))}
                          {interpreter.languages?.length > 3 && (
                            <span className={styles.tag}>
                              +{interpreter.languages.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specializations */}
                      {interpreter.profile?.specializations?.length > 0 && (
                        <div className={styles.specializationsSection}>
                          <strong>
                            {t("findInterpreter.card.specializations")}:
                          </strong>
                          <div className={styles.tagsList}>
                            {Array.isArray(
                              interpreter.profile.specializations
                            ) &&
                              interpreter.profile.specializations
                                .slice(0, 2)
                                .map((spec, idx) => (
                                  <span key={idx} className={styles.tag}>
                                    {spec}
                                  </span>
                                ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className={styles.cardFooter}>
                      <button
                        className={`${styles.saveBtn} ${
                          savedInterpreters.has(interpreter.id)
                            ? styles.saveBtnSaved
                            : ""
                        }`}
                        onClick={(e) => handleToggleSave(interpreter.id, e)}
                        title={
                          savedInterpreters.has(interpreter.id)
                            ? "Unsave"
                            : "Save"
                        }
                      >
                        {savedInterpreters.has(interpreter.id) ? (
                          <FaBookmark />
                        ) : (
                          <FaRegBookmark />
                        )}
                      </button>
                      <button
                        className={styles.viewProfileBtn}
                        onClick={() => handleViewProfile(interpreter.id)}
                      >
                        {t("findInterpreter.card.viewProfile")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <h3>{t("findInterpreter.noResults.title")}</h3>
                <p>{t("findInterpreter.noResults.description")}</p>
                <button
                  className={styles.clearBtn}
                  onClick={handleClearFilters}
                >
                  {t("findInterpreter.filters.clearAll")}
                </button>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  ← {t("common.previous")}
                </button>

                <div className={styles.pageNumbers}>
                  {[...Array(pagination.totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      className={`${styles.pageNum} ${
                        pagination.page === idx + 1 ? styles.active : ""
                      }`}
                      onClick={() => handlePageChange(idx + 1)}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  {t("common.next")} →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </MainLayout>
  );
};

export default FindInterpreterPage;
