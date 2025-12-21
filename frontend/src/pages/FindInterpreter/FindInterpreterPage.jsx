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
import toastService from "../../services/toastService";
import styles from "./FindInterpreterPage.module.css";
import {
  FaStar,
  FaBriefcase,
  FaDollarSign,
  FaMapMarkerAlt,
  FaBookmark,
  FaRegBookmark,
  FaInfoCircle,
  FaLanguage,
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
  const [showAIResults, setShowAIResults] = useState(false);

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


  // Load saved interpreters function
  const loadSavedInterpreters = useCallback(async () => {
    try {
      const result = await savedInterpreterService.getAllSavedInterpreters();

      if (result.success && result.data && Array.isArray(result.data)) {
        const savedIds = new Set(result.data.map((item) => item.id));
        setSavedInterpreters(savedIds);
      } else {
        setSavedInterpreters(new Set());
      }
    } catch (error) {
      console.error("Error loading saved interpreters:", error);
      setSavedInterpreters(new Set());
    }
  }, []);

  // Check authentication
  useEffect(() => {
    if (!user) {
      toastService.error(t("findInterpreter.errors.loginRequired"));
      navigate("/login");
    }
  }, [user, navigate, t]);

  // Fetch AI recommended interpreters (only when user clicks button)
  const handleFetchAIRecommended = async () => {
    if (!jobId) {
      toastService.error(t("findInterpreter.errors.jobIdRequired"));
      return;
    }
    
    setLoadingAIRecommended(true);
    setShowAIResults(true); // Show AI results instead of normal list
    try {
      const response = await aiMatchingService.matchJobToInterpreters(jobId, 10);
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
        toastService.success(t("findInterpreter.ai.found").replace("{count}", recommended.length));
      } else {
        toastService.error(t("findInterpreter.errors.aiNotFound"));
        setShowAIResults(false);
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toastService.error(t("findInterpreter.errors.aiRecommendationsFailed"));
      setShowAIResults(false);
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
  
  const fetchInterpreters = async () => {
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

      const response = await interpreterService.getInterpreters(queryFilters);

      // Map interpreterProfile to profile for consistency
      const interpretersWithProfile = (response.data.interpreters || []).map(
        (interpreter) => ({
          ...interpreter,
          profile: interpreter.interpreterProfile || interpreter.profile,
        })
      );


      setInterpreters(interpretersWithProfile);
      setPagination(response.data.pagination || {});

    } catch (error) {
      console.error("Error fetching interpreters:", error);
      toastService.error(t("findInterpreter.errors.loadFailed"));
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
      toastService.success(
        isSaved
          ? t("findInterpreter.saveInterpreter.unsaveSuccess")
          : t("findInterpreter.saveInterpreter.saveSuccess")
      );
    } else {
      console.error(
        `Failed to ${isSaved ? "unsave" : "save"}:`,
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
      toastService.error(result.message || t("findInterpreter.errors.updateSavedFailed"));
    }
  };

  return (
    <MainLayout>
      <div className={styles.findInterpreterPage}>
        {/* AI Button in Toolbar - Only when jobId is provided */}
        {jobId && (
          <div className={styles.aiToolbarSection}>
            <button
              className={`${styles.aiFetchButton} ${showAIResults ? styles.active : ""}`}
              onClick={showAIResults ? () => setShowAIResults(false) : handleFetchAIRecommended}
              disabled={loadingAIRecommended}
            >
              {loadingAIRecommended 
                ? "AI Analyzing..." 
                : showAIResults 
                ? "Show All Interpreters" 
                : "🤖 Get AI Recommendations"
              }
            </button>
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
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
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

            {/* AI Recommended Interpreters - Replaces normal grid when active */}
            {showAIResults && jobId ? (
              <div className={styles.interpreterGrid}>
                {loadingAIRecommended ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>AI is analyzing and finding the best interpreters...</p>
                  </div>
                ) : aiRecommended.length > 0 ? (
                  aiRecommended.map((match) => {
                    const interpreter = match.interpreter;
                    return (
                      <div key={match.id} className={styles.interpreterCard}>
                        <div className={styles.cardHeader}>
                          <div className={styles.avatarContainer}>
                            {interpreter?.avatar ? (
                              <img
                                src={`http://localhost:4000${interpreter.avatar}`}
                                alt={interpreter.fullName}
                                className={styles.avatar}
                              />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {interpreter?.fullName?.charAt(0)?.toUpperCase() || "I"}
                              </div>
                            )}
                            <div className={styles.aiBadge}>AI #{match.match_priority}</div>
                          </div>
                          <h3 className={styles.interpreterName}>
                            {interpreter?.user?.name || interpreter?.fullName || interpreter?.name || "Unknown"}
                          </h3>
                          <div className={styles.ratingRow}>
                            <SuitabilityScoreBadge
                              score={match.suitability_score?.overall_score || 0}
                              level={match.suitability_score?.score_level || "fair"}
                              size="small"
                            />
                          </div>
                        </div>
                        <div className={styles.cardBody}>
                          <p className={styles.aiRecommendation}>
                            {match.suitability_score?.recommendation}
                          </p>
                          <div className={styles.infoRow}>
                            <span className={styles.icon}>
                              <FaLanguage />
                            </span>
                            <span>
                              {interpreter?.languages?.map((l) => l.language || l).join(", ") || 
                               interpreter?.profile?.languages?.map((l) => l.language || l).join(", ") || 
                               "No languages"}
                            </span>
                          </div>
                        </div>
                        <div className={styles.cardActions}>
                          <button
                            className={styles.viewButton}
                            onClick={() => handleViewProfile(match.id)}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyState}>
                    <p>No AI recommendations available</p>
                    <button
                      className={styles.aiFetchButton}
                      onClick={() => setShowAIResults(false)}
                    >
                      Show All Interpreters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Normal Interpreter Grid */
              loading ? (
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
                  <div className={styles.emptyIcon}></div>
                  <h3>{t("findInterpreter.noResults.title")}</h3>
                  <p>{t("findInterpreter.noResults.description")}</p>
                  <button
                    className={styles.clearBtn}
                    onClick={handleClearFilters}
                  >
                    {t("findInterpreter.filters.clearAll")}
                  </button>
                </div>
              )
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
