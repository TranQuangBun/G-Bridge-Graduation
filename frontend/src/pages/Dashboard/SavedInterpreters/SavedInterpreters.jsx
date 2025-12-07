import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBookmark,
  FaMapMarkerAlt,
  FaStar,
  FaCheckCircle,
  FaSortAmountDown,
  FaRegBookmark,
  FaComments,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaEnvelope,
  FaBriefcase,
  FaDollarSign,
} from "react-icons/fa";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { ROUTES } from "../../../constants";
import savedInterpreterService from "../../../services/savedInterpreterService";
import styles from "./SavedInterpreters.module.css";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  {
    id: "applications",
    icon: FaClipboardList,
    labelKey: "applications",
    active: false,
  },
  { id: "savedJobs", icon: FaBookmark, labelKey: "savedJobs", active: false },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  {
    id: "jobApplications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
    active: false,
  },
  {
    id: "savedInterpreters",
    icon: FaBookmark,
    labelKey: "savedInterpreters",
    active: true,
  },
  {
    id: "notifications",
    icon: FaEnvelope,
    labelKey: "notifications",
    active: false,
  },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

const SavedInterpreters = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [savedInterpreters, setSavedInterpreters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [activeMenu, setActiveMenu] = useState("savedInterpreters");

  // Get sidebar menu based on user role
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  useEffect(() => {
    fetchSavedInterpreters();
  }, []);

  const fetchSavedInterpreters = async () => {
    try {
      setLoading(true);
      const result = await savedInterpreterService.getAllSavedInterpreters();

      if (result.success) {
        // Map interpreterProfile to profile for consistency
        const interpretersWithProfile = (result.data || []).map(
          (interpreter) => ({
            ...interpreter,
            profile: interpreter.interpreterProfile || interpreter.profile,
          })
        );
        setSavedInterpreters(interpretersWithProfile);
      } else {
        console.error("Failed to fetch saved interpreters:", result.message);
        setSavedInterpreters([]);
      }
    } catch (error) {
      console.error("Error fetching saved interpreters:", error);
      setSavedInterpreters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveInterpreter = async (interpreterId, e) => {
    e.stopPropagation();
    try {
      const result = await savedInterpreterService.unsaveInterpreter(
        interpreterId
      );

      if (result.success) {
        setSavedInterpreters(
          savedInterpreters.filter(
            (interpreter) => interpreter.id !== interpreterId
          )
        );
      } else {
        console.error("Failed to unsave interpreter:", result.message);
      }
    } catch (error) {
      console.error("Error unsaving interpreter:", error);
    }
  };

  const handleInterpreterClick = (interpreterId) => {
    navigate(`/interpreters/${interpreterId}`);
  };

  const getSortedInterpreters = () => {
    let sorted = [...savedInterpreters];

    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.savedDate) - new Date(b.savedDate));
    } else if (sortBy === "rating") {
      sorted.sort(
        (a, b) => (b.profile?.rating || 0) - (a.profile?.rating || 0)
      );
    } else if (sortBy === "experience") {
      sorted.sort(
        (a, b) => (b.profile?.experience || 0) - (a.profile?.experience || 0)
      );
    }

    return sorted;
  };

  const renderStars = (rating) => {
    const stars = [];
    const ratingNum = parseFloat(rating) || 5.0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={i <= ratingNum ? styles.starFilled : styles.starEmpty}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.dashboardRoot}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                {t("dashboard.pageTitle")}
              </h2>
            </div>
            <nav className={styles.sidebarNav}>
              {SIDEBAR_MENU.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`${styles.menuItem} ${
                      activeMenu === item.id ? styles.menuItemActive : ""
                    }`}
                    onClick={() => {
                      setActiveMenu(item.id);
                      switch (item.id) {
                        case "overview":
                          navigate(ROUTES.DASHBOARD);
                          break;
                        case "applications":
                          navigate(ROUTES.MY_APPLICATIONS);
                          break;
                        case "savedJobs":
                          navigate(ROUTES.SAVED_JOBS);
                          break;
                        case "myJobs":
                          navigate(ROUTES.MY_JOBS);
                          break;
                        case "jobApplications":
                          navigate(ROUTES.JOB_APPLICATIONS);
                          break;
                        case "savedInterpreters":
                          // Stay on current page
                          break;
                        case "notifications":
                          navigate(ROUTES.DASHBOARD + "?section=notifications");
                          break;
                        case "profile":
                          navigate(ROUTES.PROFILE);
                          break;
                        case "settings":
                          navigate(ROUTES.SETTINGS);
                          break;
                        default:
                          break;
                      }
                    }}
                  >
                    <span className={styles.menuIcon}>
                      <IconComponent />
                    </span>
                    <span className={styles.menuLabel}>
                      {t(`dashboard.navigation.${item.labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
          <main className={styles.mainContent}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>{t("common.loading") || "Loading..."}</p>
            </div>
          </main>
        </div>
      </MainLayout>
    );
  }

  const sortedInterpreters = getSortedInterpreters();

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${
                    activeMenu === item.id ? styles.menuItemActive : ""
                  }`}
                  onClick={() => {
                    setActiveMenu(item.id);
                    switch (item.id) {
                      case "overview":
                        navigate(ROUTES.DASHBOARD);
                        break;
                      case "applications":
                        navigate(ROUTES.MY_APPLICATIONS);
                        break;
                      case "savedJobs":
                        navigate(ROUTES.SAVED_JOBS);
                        break;
                      case "myJobs":
                        navigate(ROUTES.MY_JOBS);
                        break;
                      case "jobApplications":
                        navigate(ROUTES.JOB_APPLICATIONS);
                        break;
                      case "savedInterpreters":
                        navigate(ROUTES.SAVED_INTERPRETERS);
                        break;
                      case "notifications":
                        navigate(ROUTES.DASHBOARD + "?tab=notifications");
                        break;
                      case "profile":
                        navigate(ROUTES.PROFILE);
                        break;
                      case "settings":
                        navigate(ROUTES.SETTINGS);
                        break;
                      default:
                        break;
                    }
                  }}
                >
                  <span className={styles.menuIcon}>
                    <IconComponent />
                  </span>
                  <span className={styles.menuLabel}>
                    {t(`dashboard.navigation.${item.labelKey}`)}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
        <main className={styles.mainContent}>
          <header className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>
              {t("savedInterpreters.pageTitle") || "Saved Interpreters"}
            </h1>
            <p className={styles.pageSubtitle}>
              {t("savedInterpreters.subtitle") ||
                "Your favorite interpreters for easy access"}
            </p>
          </header>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterContainer}>
              <div className={styles.filterGroup}>
                <FaSortAmountDown className={styles.filterIcon} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">
                    {t("savedInterpreters.sort.newest") || "Newest First"}
                  </option>
                  <option value="oldest">
                    {t("savedInterpreters.sort.oldest") || "Oldest First"}
                  </option>
                  <option value="rating">
                    {t("savedInterpreters.sort.rating") || "Highest Rating"}
                  </option>
                  <option value="experience">
                    {t("savedInterpreters.sort.experience") ||
                      "Most Experienced"}
                  </option>
                </select>
              </div>
            </div>

            <div className={styles.resultsCount}>
              {sortedInterpreters.length}{" "}
              {t("savedInterpreters.resultsCount") || "interpreters saved"}
            </div>
          </div>

          {/* Content */}
          <div className={styles.contentContainer}>
            {sortedInterpreters.length === 0 ? (
              // Empty State
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FaRegBookmark />
                </div>
                <h2 className={styles.emptyTitle}>
                  {t("savedInterpreters.empty.title") ||
                    "No saved interpreters yet"}
                </h2>
                <p className={styles.emptyDescription}>
                  {t("savedInterpreters.empty.description") ||
                    "Start saving interpreters you'd like to work with"}
                </p>
                <button
                  className={styles.exploreButton}
                  onClick={() => navigate("/find-interpreter")}
                >
                  {t("savedInterpreters.empty.exploreButton") ||
                    "Find Interpreters"}
                </button>
              </div>
            ) : (
              // Interpreters Grid
              <div className={styles.interpretersGrid}>
                {sortedInterpreters.map((interpreter) => (
                  <div
                    key={interpreter.id}
                    className={styles.interpreterCard}
                    onClick={() => handleInterpreterClick(interpreter.id)}
                  >
                    {/* Card Header */}
                    <div className={styles.cardHeader}>
                      <div className={styles.avatarWrapper}>
                        {interpreter.avatar ? (
                          <img
                            src={`http://localhost:4000${interpreter.avatar}`}
                            alt={interpreter.fullName}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {interpreter.fullName?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {interpreter.profile?.rating >= 4.5 && (
                          <div className={styles.verifiedBadge}>
                            <FaCheckCircle />
                          </div>
                        )}
                      </div>
                      <button
                        className={styles.unsaveButton}
                        onClick={(e) =>
                          handleUnsaveInterpreter(interpreter.id, e)
                        }
                        title={
                          t("savedInterpreters.unsave") || "Remove from saved"
                        }
                      >
                        <FaBookmark />
                      </button>
                    </div>

                    {/* Interpreter Info */}
                    <div className={styles.interpreterInfo}>
                      <h3 className={styles.interpreterName}>
                        {interpreter.fullName}
                      </h3>
                      <div className={styles.ratingSection}>
                        <div className={styles.stars}>
                          {renderStars(interpreter.profile?.rating || 0)}
                        </div>
                        <span className={styles.ratingValue}>
                          {parseFloat(interpreter.profile?.rating || 0).toFixed(
                            1
                          )}
                        </span>
                        <span className={styles.reviewsCount}>
                          ({interpreter.profile?.totalReviews || 0})
                        </span>
                      </div>
                    </div>

                    {/* Interpreter Details */}
                    <div className={styles.interpreterDetails}>
                      {interpreter.address && (
                        <div className={styles.detailItem}>
                          <FaMapMarkerAlt className={styles.detailIcon} />
                          <span>{interpreter.address}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <FaBriefcase className={styles.detailIcon} />
                        <span>
                          {interpreter.profile?.experience || 0}{" "}
                          {t("savedInterpreters.yearsExperience") ||
                            "years experience"}
                        </span>
                      </div>
                      {interpreter.profile?.hourlyRate && (
                        <div className={styles.detailItem}>
                          <FaDollarSign className={styles.detailIcon} />
                          <span>
                            ${Number(interpreter.profile.hourlyRate).toFixed(2)}
                            /hr
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {interpreter.languages &&
                      interpreter.languages.length > 0 && (
                        <div className={styles.languagesSection}>
                          <div className={styles.sectionLabel}>
                            {t("savedInterpreters.languages") || "Languages"}
                          </div>
                          <div className={styles.languageTags}>
                            {interpreter.languages
                              .slice(0, 3)
                              .map((lang, index) => (
                                <span
                                  key={index}
                                  className={styles.languageTag}
                                >
                                  {lang.name || lang}
                                </span>
                              ))}
                            {interpreter.languages.length > 3 && (
                              <span className={styles.languageTag}>
                                +{interpreter.languages.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Specializations */}
                    {interpreter.profile?.specializations &&
                      Array.isArray(interpreter.profile.specializations) &&
                      interpreter.profile.specializations.length > 0 && (
                        <div className={styles.specializationsSection}>
                          <div className={styles.sectionLabel}>
                            {t("savedInterpreters.specializations") ||
                              "Specializations"}
                          </div>
                          <div className={styles.specializationTags}>
                            {interpreter.profile.specializations
                              .slice(0, 2)
                              .map((spec, index) => (
                                <span
                                  key={index}
                                  className={styles.specializationTag}
                                >
                                  {spec}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Card Footer */}
                    <div className={styles.cardFooter}>
                      <span className={styles.savedDate}>
                        {t("savedInterpreters.savedOn") || "Saved"}{" "}
                        {new Date(interpreter.savedDate).toLocaleDateString()}
                      </span>
                      <button
                        className={styles.contactButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages?interpreter=${interpreter.id}`);
                        }}
                      >
                        <FaComments />
                        {t("savedInterpreters.contact") || "Contact"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default SavedInterpreters;
