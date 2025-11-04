import React, { useState, useEffect } from "react";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import interpreterService from "../../services/interpreterService";
import { InterpreterModal } from "../../components/InterpreterModal";
import { toast } from "react-toastify";
import styles from "./FindInterpreterPage.module.css";

const FindInterpreterPage = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Specialization keys (language-independent)
  const SPECIALIZATION_KEYS = [
    "medical",
    "legal",
    "business",
    "technical",
    "conference",
    "community",
    "education",
    "government",
    "tourism",
    "media",
    "pharmaceutical",
    "engineering",
    "realEstate",
    "immigration",
    "courtroom",
    "telecommunications",
    "aviation",
    "manufacturing",
    "insurance",
    "scientific",
  ];

  // Get translated label from key
  const getSpecializationLabel = (keyOrLabel) => {
    const options = t("profile.professional.specializationOptions");
    // Check if it's a key
    if (SPECIALIZATION_KEYS.includes(keyOrLabel)) {
      return options[keyOrLabel];
    }
    // Otherwise return as is (custom specialization)
    return keyOrLabel;
  };

  // State
  const [interpreters, setInterpreters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedInterpreterId, setSelectedInterpreterId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [savedInterpreters, setSavedInterpreters] = useState(new Set());

  // Filter options
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableSpecializations, setAvailableSpecializations] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    languages: [],
    minRate: "",
    maxRate: "",
    minExperience: "",
    maxExperience: "",
    specializations: [],
    rating: "",
    location: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
    page: 1,
    limit: 12,
    // Advanced filters
    availability: "", // available, busy, offline
    verificationStatus: "", // verified, unverified
    completedJobs: "", // min completed jobs
    responseTime: "", // fast, medium, slow
    hasPortfolio: false,
    certifications: [], // specific certifications
    workingHours: "", // morning, afternoon, evening, night, flexible
  });

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  // Check authentication
  useEffect(() => {
    if (!user) {
      toast.error("Please login to view interpreters");
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch filter options on mount
  useEffect(() => {
    if (user) {
      fetchFilterOptions();
      fetchSavedInterpreters();
      fetchInterpreters(); // ✅ Fetch interpreters on initial load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch interpreters when filters change
  useEffect(() => {
    if (user) {
      fetchInterpreters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.sortBy, filters.sortOrder, user]);

  const fetchFilterOptions = async () => {
    try {
      const [langsRes, specsRes] = await Promise.all([
        interpreterService.getAvailableLanguages(),
        interpreterService.getAvailableSpecializations(),
      ]);

      setAvailableLanguages(langsRes.data || []);
      setAvailableSpecializations(specsRes.data || []);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const fetchSavedInterpreters = async () => {
    try {
      const response = await interpreterService.getSavedInterpreters(1, 1000);
      const savedList = response.data?.savedInterpreters || [];
      const savedIds = new Set(savedList.map((item) => item.id));
      setSavedInterpreters(savedIds);
    } catch (error) {
      console.error("Error fetching saved interpreters:", error);
      // Don't show error to user, just silently fail
    }
  };

  const fetchInterpreters = async () => {
    setLoading(true);
    try {
      const queryFilters = {
        ...filters,
        languages: filters.languages.join(","),
        specializations: filters.specializations.join(","),
      };

      const response = await interpreterService.getInterpreters(queryFilters);

      setInterpreters(response.data.interpreters || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error("Error fetching interpreters:", error);
      toast.error("Failed to load interpreters");
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

  const handleLanguageToggle = (lang) => {
    const newLanguages = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang];
    setFilters({ ...filters, languages: newLanguages, page: 1 });
  };

  const handleSpecializationToggle = (spec) => {
    const newSpecs = filters.specializations.includes(spec)
      ? filters.specializations.filter((s) => s !== spec)
      : [...filters.specializations, spec];
    setFilters({ ...filters, specializations: newSpecs, page: 1 });
  };

  const handleClearFilters = () => {
    const resetFilters = {
      search: "",
      languages: [],
      minRate: "",
      maxRate: "",
      minExperience: "",
      maxExperience: "",
      specializations: [],
      rating: "",
      location: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
      page: 1,
      limit: 12,
      availability: "",
      verificationStatus: "",
      completedJobs: "",
      responseTime: "",
      hasPortfolio: false,
      certifications: [],
      workingHours: "",
    };

    setFilters(resetFilters);

    // Trigger API call immediately after resetting filters
    setTimeout(() => {
      fetchInterpreters();
    }, 0);
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

  const handleSaveInterpreter = async (interpreterId, event) => {
    event.stopPropagation(); // Prevent opening modal when clicking save button

    try {
      const response = await interpreterService.toggleSaveInterpreter(
        interpreterId
      );

      if (response.success) {
        // Update saved interpreters set
        const newSavedSet = new Set(savedInterpreters);
        if (response.isSaved) {
          newSavedSet.add(interpreterId);
          toast.success(response.message || "Interpreter saved successfully");
        } else {
          newSavedSet.delete(interpreterId);
          toast.success(
            response.message || "Interpreter removed from saved list"
          );
        }
        setSavedInterpreters(newSavedSet);
      }
    } catch (error) {
      console.error("Error saving interpreter:", error);
      if (error.message === "Please login to save interpreters") {
        toast.error("Please login to save interpreters");
        navigate("/login");
      } else {
        toast.error(error.message || "Failed to save interpreter");
      }
    }
  };

  return (
    <MainLayout>
      <div className={styles.findInterpreterPage}>
        {/* Interpreter Modal */}
        {showModal && selectedInterpreterId && (
          <InterpreterModal
            interpreterId={selectedInterpreterId}
            onClose={handleCloseModal}
          />
        )}

        {/* Header with Animated Background */}
        <div className={styles.pageHeader}>
          {/* Animated Background for Header Only */}
          <div className={styles.headerBackground}>
            <div className={styles.headerAnimation}>
              <div className={`${styles.floatingShape} ${styles.shape1}`}></div>
              <div className={`${styles.floatingShape} ${styles.shape2}`}></div>
              <div className={`${styles.floatingShape} ${styles.shape3}`}></div>
              <div className={`${styles.floatingShape} ${styles.shape4}`}></div>
              <div className={`${styles.floatingShape} ${styles.shape5}`}></div>
            </div>
            <div className={styles.headerGradientOverlay}></div>
          </div>

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

            {/* Languages Filter */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.languages")}</label>
              <div className={styles.checkboxGroup}>
                {availableLanguages.slice(0, 10).map((lang) => (
                  <div key={lang} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={filters.languages.includes(lang)}
                      onChange={() => handleLanguageToggle(lang)}
                    />
                    <label htmlFor={`lang-${lang}`}>{lang}</label>
                  </div>
                ))}
              </div>
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
              <label>{t("findInterpreter.filters.experience")}</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  placeholder="Min years"
                  value={filters.minExperience}
                  onChange={(e) =>
                    handleFilterChange("minExperience", e.target.value)
                  }
                  className={styles.rangeInput}
                  min="0"
                  max="50"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max years"
                  value={filters.maxExperience}
                  onChange={(e) =>
                    handleFilterChange("maxExperience", e.target.value)
                  }
                  className={styles.rangeInput}
                  min="0"
                  max="50"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className={styles.filterSection}>
              <label>{t("findInterpreter.filters.minRating")}</label>
              <div className={styles.ratingSlider}>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.rating || 0}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className={styles.slider}
                />
                <div className={styles.ratingValue}>
                  {filters.rating ? <>{filters.rating}+ ⭐</> : "Any"}
                </div>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              className={styles.advancedToggle}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? "▲" : "▼"}{" "}
              {t("findInterpreter.filters.advanced")}
            </button>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <>
                {/* Location */}
                <div className={styles.filterSection}>
                  <label>{t("findInterpreter.filters.location")}</label>
                  <input
                    type="text"
                    placeholder={t(
                      "findInterpreter.filters.locationPlaceholder"
                    )}
                    value={filters.location}
                    onChange={(e) =>
                      handleFilterChange("location", e.target.value)
                    }
                    className={styles.searchInput}
                  />
                </div>

                {/* Specializations */}
                <div className={styles.filterSection}>
                  <label>{t("findInterpreter.filters.specializations")}</label>
                  <div className={styles.checkboxGroup}>
                    {availableSpecializations.slice(0, 8).map((spec) => (
                      <div key={spec} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`spec-${spec}`}
                          checked={filters.specializations.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                        />
                        <label htmlFor={`spec-${spec}`}>{spec}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Availability Status */}
                <div className={styles.filterSection}>
                  <label>🟢 Availability Status</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        name="availability"
                        value=""
                        checked={filters.availability === ""}
                        onChange={(e) =>
                          handleFilterChange("availability", e.target.value)
                        }
                      />
                      <span>All</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        name="availability"
                        value="available"
                        checked={filters.availability === "available"}
                        onChange={(e) =>
                          handleFilterChange("availability", e.target.value)
                        }
                      />
                      <span>🟢 Available Now</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        name="availability"
                        value="busy"
                        checked={filters.availability === "busy"}
                        onChange={(e) =>
                          handleFilterChange("availability", e.target.value)
                        }
                      />
                      <span>🟡 Busy</span>
                    </label>
                  </div>
                </div>

                {/* Verification Status */}
                <div className={styles.filterSection}>
                  <label>✅ Verification</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        name="verification"
                        value=""
                        checked={filters.verificationStatus === ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "verificationStatus",
                            e.target.value
                          )
                        }
                      />
                      <span>All</span>
                    </label>
                    <label className={styles.radioItem}>
                      <input
                        type="radio"
                        name="verification"
                        value="verified"
                        checked={filters.verificationStatus === "verified"}
                        onChange={(e) =>
                          handleFilterChange(
                            "verificationStatus",
                            e.target.value
                          )
                        }
                      />
                      <span>✅ Verified Only</span>
                    </label>
                  </div>
                </div>

                {/* Minimum Completed Jobs */}
                <div className={styles.filterSection}>
                  <label>💼 Minimum Completed Jobs</label>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={filters.completedJobs || 0}
                      onChange={(e) =>
                        handleFilterChange("completedJobs", e.target.value)
                      }
                      className={styles.slider}
                    />
                    <div className={styles.sliderValue}>
                      {filters.completedJobs || 0}+ jobs
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className={styles.filterSection}>
                  <label>⚡ Response Time</label>
                  <select
                    value={filters.responseTime}
                    onChange={(e) =>
                      handleFilterChange("responseTime", e.target.value)
                    }
                    className={styles.selectInput}
                  >
                    <option value="">Any</option>
                    <option value="fast">⚡ Fast ({"<"} 1 hour)</option>
                    <option value="medium">🕐 Medium ({"<"} 4 hours)</option>
                    <option value="slow">🐢 Slow ({"<"} 24 hours)</option>
                  </select>
                </div>

                {/* Working Hours Preference */}
                <div className={styles.filterSection}>
                  <label>🕐 Working Hours</label>
                  <select
                    value={filters.workingHours}
                    onChange={(e) =>
                      handleFilterChange("workingHours", e.target.value)
                    }
                    className={styles.selectInput}
                  >
                    <option value="">Any</option>
                    <option value="morning">🌅 Morning (6AM - 12PM)</option>
                    <option value="afternoon">☀️ Afternoon (12PM - 6PM)</option>
                    <option value="evening">🌆 Evening (6PM - 10PM)</option>
                    <option value="night">🌙 Night (10PM - 6AM)</option>
                    <option value="flexible">🔄 Flexible (24/7)</option>
                  </select>
                </div>

                {/* Has Portfolio */}
                <div className={styles.filterSection}>
                  <label className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      checked={filters.hasPortfolio}
                      onChange={(e) =>
                        handleFilterChange("hasPortfolio", e.target.checked)
                      }
                    />
                    <span>📁 Has Portfolio</span>
                  </label>
                </div>

                {/* Quick Filters - Presets */}
                <div className={styles.filterSection}>
                  <label>⚡ Quick Filters</label>
                  <div className={styles.quickFilters}>
                    <button
                      className={styles.quickFilterBtn}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          rating: "4.5",
                          verificationStatus: "verified",
                          completedJobs: "20",
                        });
                      }}
                    >
                      ⭐ Top Rated
                    </button>
                    <button
                      className={styles.quickFilterBtn}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          availability: "available",
                          responseTime: "fast",
                        });
                      }}
                    >
                      ⚡ Quick Response
                    </button>
                    <button
                      className={styles.quickFilterBtn}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          minExperience: "5",
                          completedJobs: "50",
                          hasPortfolio: true,
                        });
                      }}
                    >
                      💎 Experienced Pro
                    </button>
                    <button
                      className={styles.quickFilterBtn}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          workingHours: "flexible",
                          availability: "available",
                        });
                      }}
                    >
                      🔄 24/7 Available
                    </button>
                  </div>
                </div>
              </>
            )}

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
                  {interpreters.length} {t("findInterpreter.resultsFound")}
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
                          <div className={styles.badge}>⭐ Top Rated</div>
                        )}
                      </div>
                      <h3 className={styles.interpreterName}>
                        {interpreter.fullName}
                      </h3>
                      <div className={styles.ratingRow}>
                        <span className={styles.rating}>
                          ⭐{" "}
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
                        <span className={styles.icon}>💼</span>
                        <span>
                          {interpreter.profile?.experience || 0} years
                          experience
                        </span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.icon}>💰</span>
                        <span>
                          $
                          {Number(interpreter.profile?.hourlyRate || 0).toFixed(
                            2
                          )}
                          /hr
                        </span>
                      </div>

                      <div className={styles.infoRow}>
                        <span className={styles.icon}>📍</span>
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
                                    {getSpecializationLabel(spec)}
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
                            ? styles.saved
                            : ""
                        }`}
                        onClick={(e) =>
                          handleSaveInterpreter(interpreter.id, e)
                        }
                        title={
                          savedInterpreters.has(interpreter.id)
                            ? "Remove from saved"
                            : "Save interpreter"
                        }
                      >
                        {savedInterpreters.has(interpreter.id)
                          ? "Saved"
                          : "Save"}
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
