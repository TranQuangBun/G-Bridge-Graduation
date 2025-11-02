import React, { useState, useEffect } from "react";
import styles from "./MyApplicationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import bookingService from "../../services/bookingService";
import { toast } from "react-toastify";
import CompanyInfoModal from "../../components/CompanyInfoModal";
import { InterpreterModal } from "../../components/InterpreterModal";

// Mock data for applications
const MOCK_APPLICATIONS = [
  {
    id: 1,
    company: "GlobalSpeak",
    logo: "🏢",
    position: "Senior English-Vietnamese Conference Interpreter",
    jobType: "Full-time",
    workType: "Remote",
    location: "Ho Chi Minh City",
    salary: "$2,500-3,500",
    dateApplied: "2025-01-10",
    status: "Under Review",
    description:
      "Leading global language services company seeking experienced interpreter for high-level conferences and business meetings.",
    requirements: [
      "5+ years conference interpreting experience",
      "Professional certification",
      "Fluent English and Vietnamese",
    ],
  },
  {
    id: 2,
    company: "MedLingua",
    logo: "🏥",
    position: "Medical Interpreter - Vietnamese",
    jobType: "Part-time",
    workType: "On-site",
    location: "District 1, Ho Chi Minh City",
    salary: "$25-35/hour",
    dateApplied: "2025-01-08",
    status: "Shortlisted",
    description:
      "Healthcare interpretation services for Vietnamese-speaking patients in medical settings.",
    requirements: [
      "Medical terminology knowledge",
      "Healthcare interpreting certification",
      "Compassionate communication skills",
    ],
  },
  {
    id: 3,
    company: "EduBridge",
    logo: "🎓",
    position: "Educational Content Translator",
    jobType: "Contract",
    workType: "Remote",
    location: "Remote",
    salary: "$30-40/hour",
    dateApplied: "2025-01-05",
    status: "Rejected",
    description:
      "Translate educational materials and online courses from English to Vietnamese for K-12 students.",
    requirements: [
      "Education background preferred",
      "Translation experience",
      "Understanding of pedagogical concepts",
    ],
  },
  {
    id: 4,
    company: "TechTranslate",
    logo: "💻",
    position: "Technical Document Translator",
    jobType: "Full-time",
    workType: "Hybrid",
    location: "Hanoi",
    salary: "$2,000-2,800",
    dateApplied: "2025-01-03",
    status: "Interview Scheduled",
    description:
      "Translate technical documentation, software interfaces, and user manuals for technology companies.",
    requirements: [
      "Technical translation experience",
      "Software localization knowledge",
      "CAT tools proficiency",
    ],
  },
  {
    id: 5,
    company: "LegalLingo",
    logo: "⚖️",
    position: "Legal Interpreter",
    jobType: "Part-time",
    workType: "On-site",
    location: "District 3, Ho Chi Minh City",
    salary: "$40-50/hour",
    dateApplied: "2025-01-01",
    status: "Active",
    description:
      "Provide interpretation services for legal proceedings, client meetings, and document review sessions.",
    requirements: [
      "Legal interpreting certification",
      "Court interpreting experience",
      "Confidentiality protocols knowledge",
    ],
  },
];

function MyApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("applications");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] = useState(null);

  // New states for booking requests
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // States for interpreter modal
  const [selectedInterpreterId, setSelectedInterpreterId] = useState(null);
  const [isInterpreterModalOpen, setIsInterpreterModalOpen] = useState(false);

  // States for more actions menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] =
    useState(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // Check if user is company/client role
  const isCompany = user?.role === "client" || user?.role === "company";
  const isInterpreter = user?.role === "interpreter";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openMenuId &&
        !event.target.closest(`.${styles.moreActionsWrapper}`)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuId]);

  // Fetch booking requests when component mounts
  useEffect(() => {
    if (isInterpreter) {
      fetchInterpreterBookings();
    } else if (isCompany) {
      fetchClientBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInterpreter, isCompany]);

  // Fetch booking requests for interpreter (received from companies)
  const fetchInterpreterBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await bookingService.getInterpreterBookings({
        page: 1,
        limit: 50,
      });

      console.log("📥 Interpreter booking requests:", response.data.bookings);
      setBookingRequests(response.data.bookings || []);
    } catch (error) {
      console.error("❌ Error fetching interpreter bookings:", error);
      toast.error("Failed to load booking requests");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch booking requests for company (sent to interpreters)
  const fetchClientBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await bookingService.getClientBookings({
        page: 1,
        limit: 50,
      });

      console.log("📤 Client booking requests:", response.data.bookings);
      setBookingRequests(response.data.bookings || []);
    } catch (error) {
      console.error("❌ Error fetching client bookings:", error);
      toast.error("Failed to load booking requests");
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      toast.success(`Booking ${newStatus} successfully`);
      // Refresh booking list based on user role
      if (isInterpreter) {
        fetchInterpreterBookings();
      } else if (isCompany) {
        fetchClientBookings();
      }
    } catch (error) {
      console.error("❌ Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  };

  const handleCompanyClick = (clientProfile) => {
    setSelectedCompany(clientProfile);
    setIsCompanyModalOpen(true);
  };

  const closeCompanyModal = () => {
    setIsCompanyModalOpen(false);
    setSelectedCompany(null);
  };

  const handleInterpreterClick = (interpreterId) => {
    setSelectedInterpreterId(interpreterId);
    setIsInterpreterModalOpen(true);
  };

  const closeInterpreterModal = () => {
    setIsInterpreterModalOpen(false);
    setSelectedInterpreterId(null);
  };

  const toggleMoreActionsMenu = (bookingId) => {
    setOpenMenuId(openMenuId === bookingId ? null : bookingId);
  };

  // Check if booking can be cancelled (must be at least 1 day before event)
  const canCancelBooking = (booking) => {
    if (!booking) return false;

    const now = new Date();
    let eventDate;

    // Get event date based on duration type
    if (booking.eventDuration === "single") {
      eventDate = new Date(booking.eventDate);
    } else if (booking.eventDuration === "multiple") {
      eventDate = new Date(booking.startDate);
    } else {
      return false;
    }

    // Calculate time difference in milliseconds
    const timeDiff = eventDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    // Must be at least 1 day before event
    return daysDiff >= 1;
  };

  const handleCancelBooking = async (bookingId, booking) => {
    // Check if can cancel
    if (!canCancelBooking(booking)) {
      toast.error(
        "Cannot cancel booking within 24 hours of the event. Please contact support if needed."
      );
      setOpenMenuId(null);
      return;
    }

    try {
      await bookingService.updateBookingStatus(bookingId, "cancelled");
      toast.success("Booking cancelled successfully");
      setOpenMenuId(null);
      if (isInterpreter) {
        fetchInterpreterBookings();
      } else if (isCompany) {
        fetchClientBookings();
      }
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleCompleteBooking = (booking) => {
    // Must rate before completing
    setSelectedBookingForRating(booking);
    setIsRatingModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmitRating = async () => {
    if (!selectedBookingForRating) return;

    try {
      // First submit rating
      // TODO: Add rating API endpoint
      console.log("Submitting rating:", {
        bookingId: selectedBookingForRating.id,
        rating,
        comment: ratingComment,
      });

      // Then mark as completed
      await bookingService.updateBookingStatus(
        selectedBookingForRating.id,
        "completed"
      );

      toast.success("Booking completed and rated successfully");
      setIsRatingModalOpen(false);
      setSelectedBookingForRating(null);
      setRating(5);
      setRatingComment("");

      if (isInterpreter) {
        fetchInterpreterBookings();
      } else if (isCompany) {
        fetchClientBookings();
      }
    } catch (error) {
      console.error("❌ Error completing booking:", error);
      toast.error("Failed to complete booking");
    }
  };

  const handleRateBooking = (booking) => {
    setSelectedBookingForRating(booking);
    setIsRatingModalOpen(true);
    setOpenMenuId(null);
  };

  const closeRatingModal = () => {
    setIsRatingModalOpen(false);
    setSelectedBookingForRating(null);
    setRating(5);
    setRatingComment("");
  };

  const SIDEBAR_MENU = [
    { id: "overview", icon: "📊", labelKey: "overview", active: false },
    {
      id: "applications",
      icon: "📋",
      label: isCompany ? "Job Applications" : null,
      labelKey: isCompany ? null : "applications",
      active: true,
    },
    {
      id: "favorites",
      icon: "❤️",
      label: isCompany ? "Saved Interpreters" : "Saved Jobs",
      active: false,
    },
    { id: "alerts", icon: "🔔", labelKey: "alerts", active: false },
    {
      id: "profile",
      icon: isCompany ? "🏢" : "👤",
      label: isCompany ? "Company Profile" : null,
      labelKey: isCompany ? null : "profile",
      active: false,
    },
    { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return styles.statusActive;
      case "under review":
        return styles.statusReview;
      case "shortlisted":
        return styles.statusShortlisted;
      case "interview scheduled":
        return styles.statusInterview;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return t("applications.status.active");
      case "under review":
        return t("applications.status.underReview");
      case "shortlisted":
        return t("applications.status.shortlisted");
      case "interview scheduled":
        return t("applications.status.interviewScheduled");
      case "rejected":
        return t("applications.status.rejected");
      default:
        return status;
    }
  };

  const filteredApplications = MOCK_APPLICATIONS.filter(
    (app) =>
      selectedStatus === "all" || app.status.toLowerCase() === selectedStatus
  ).sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.dateApplied) - new Date(a.dateApplied);
    } else if (sortBy === "oldest") {
      return new Date(a.dateApplied) - new Date(b.dateApplied);
    } else if (sortBy === "company") {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar - Using exact same structure as DashboardPage */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>{t("dashboard.pageTitle")}</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  } else if (item.id === "favorites") {
                    navigate(ROUTES.SAVED_JOBS);
                  } else if (item.id === "alerts") {
                    navigate(ROUTES.JOB_ALERTS);
                  } else if (item.id === "profile") {
                    // Redirect to Company Profile for clients, regular Profile for interpreters
                    if (isCompany) {
                      navigate(ROUTES.COMPANY_PROFILE);
                    } else {
                      navigate(ROUTES.PROFILE);
                    }
                  }
                  // Add other navigation logic for other menu items when implemented
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>
                  {item.label || t(`dashboard.navigation.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>{t("applications.pageTitle")}</h1>
            <p className={styles.pageSubtitle}>{t("applications.subtitle")}</p>
          </header>

          {/* Controls */}
          <section className={styles.controlsSection}>
            <div className={styles.controls}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.filterByStatus")}:
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">{t("applications.status.all")}</option>
                  <option value="active">
                    {t("applications.status.active")}
                  </option>
                  <option value="under review">
                    {t("applications.status.underReview")}
                  </option>
                  <option value="shortlisted">
                    {t("applications.status.shortlisted")}
                  </option>
                  <option value="interview scheduled">
                    {t("applications.status.interviewScheduled")}
                  </option>
                  <option value="rejected">
                    {t("applications.status.rejected")}
                  </option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  {t("applications.sortBy")}:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="newest">
                    {t("applications.sort.newest")}
                  </option>
                  <option value="oldest">
                    {t("applications.sort.oldest")}
                  </option>
                  <option value="company">
                    {t("applications.sort.company")}
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Applications List */}
          <section className={styles.applicationsSection}>
            {isInterpreter && (
              <div className={styles.bookingRequestsSection}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.modernSectionTitle}>
                    <span className={styles.titleIcon}>📋</span>
                    <span>Booking Requests</span>
                  </h2>
                  <span className={styles.requestCount}>
                    {bookingRequests.length} requests
                  </span>
                </div>
                {loadingBookings ? (
                  <div className={styles.modernLoadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading booking requests...</p>
                  </div>
                ) : bookingRequests.length > 0 ? (
                  <div className={styles.bookingGrid}>
                    {bookingRequests.map((booking) => (
                      <div
                        key={booking.id}
                        className={styles.modernBookingCard}
                      >
                        {/* Card Header with Company Info */}
                        <div className={styles.modernCardHeader}>
                          <div className={styles.companySection}>
                            {booking.client?.clientProfile?.logo ? (
                              <div className={styles.logoWrapper}>
                                <img
                                  src={`http://localhost:4000${booking.client.clientProfile.logo}`}
                                  alt={
                                    booking.client.clientProfile.companyName ||
                                    "Company"
                                  }
                                  className={styles.modernCompanyLogo}
                                />
                              </div>
                            ) : (
                              <div className={styles.logoPlaceholder}>
                                <span>🏢</span>
                              </div>
                            )}
                            <div className={styles.companyDetails}>
                              <h3
                                className={styles.modernCompanyName}
                                onClick={() =>
                                  booking.client?.clientProfile &&
                                  handleCompanyClick(
                                    booking.client.clientProfile
                                  )
                                }
                                style={{
                                  cursor: booking.client?.clientProfile
                                    ? "pointer"
                                    : "default",
                                }}
                              >
                                {booking.client?.clientProfile?.companyName ||
                                  booking.client?.fullName ||
                                  "Client"}
                              </h3>
                              <p className={styles.serviceTypeLabel}>
                                {booking.serviceType === "consecutive" &&
                                  "🎤 Consecutive Interpreting"}
                                {booking.serviceType === "simultaneous" &&
                                  "🎧 Simultaneous Interpreting"}
                                {booking.serviceType === "escort" &&
                                  "🚶 Escort Interpreting"}
                                {booking.serviceType === "online" &&
                                  "💻 Online Interpreting"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`${styles.modernStatusBadge} ${
                              booking.status === "pending"
                                ? styles.statusPending
                                : booking.status === "accepted"
                                ? styles.statusAccepted
                                : booking.status === "rejected"
                                ? styles.statusRejected
                                : booking.status === "completed"
                                ? styles.statusCompleted
                                : styles.statusCancelled
                            }`}
                          >
                            {booking.status === "pending" && "⏳ Pending"}
                            {booking.status === "accepted" && "✓ Accepted"}
                            {booking.status === "rejected" && "✕ Rejected"}
                            {booking.status === "completed" && "✓ Completed"}
                            {booking.status === "cancelled" && "✕ Cancelled"}
                          </div>
                        </div>

                        {/* Card Body with Details */}
                        <div className={styles.modernCardBody}>
                          {/* Date & Time */}
                          <div className={styles.infoSection}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>📅</span>
                                <span>Date & Time</span>
                              </div>
                              <div className={styles.infoValue}>
                                {booking.eventDuration === "single" ? (
                                  <>
                                    <div className={styles.dateValue}>
                                      {booking.eventDate}
                                    </div>
                                    <div className={styles.timeRange}>
                                      {booking.startTime} - {booking.endTime}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={styles.dateValue}>
                                      {booking.startDate} → {booking.endDate}
                                    </div>
                                    <div className={styles.timeRange}>
                                      {booking.timeRequirement === "fullDay" &&
                                        "Full Day (8 hours)"}
                                      {booking.timeRequirement === "halfDay" &&
                                        "Half Day (4 hours)"}
                                      {booking.timeRequirement ===
                                        "eventSchedule" && "Per Event Schedule"}
                                      {booking.timeRequirement === "other" &&
                                        "Other"}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Location */}
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>
                                  {booking.bookingType === "online"
                                    ? "💻"
                                    : "📍"}
                                </span>
                                <span>Location</span>
                              </div>
                              <div className={styles.infoValue}>
                                {booking.bookingType === "online" ? (
                                  <span className={styles.onlineBadge}>
                                    Online Meeting
                                  </span>
                                ) : (
                                  booking.location || "TBD"
                                )}
                              </div>
                            </div>

                            {/* Cost Estimate */}
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>💰</span>
                                <span>Estimated Cost</span>
                              </div>
                              <div className={styles.infoValue}>
                                <div className={styles.costValue}>
                                  ${Number(booking.estimatedCost).toFixed(2)}
                                </div>
                                <div className={styles.hoursValue}>
                                  ({booking.estimatedHours} hours)
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Topic/Description */}
                          <div className={styles.topicSection}>
                            <div className={styles.topicLabel}>
                              <span className={styles.infoIcon}>📝</span>
                              <span>Topic & Details</span>
                            </div>
                            <p className={styles.topicContent}>
                              {booking.topic.length > 150
                                ? `${booking.topic.substring(0, 150)}...`
                                : booking.topic}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer with Actions */}
                        <div className={styles.modernCardFooter}>
                          <div className={styles.requestedTime}>
                            <span className={styles.timeIcon}>🕐</span>
                            <span>
                              Requested {formatDate(booking.createdAt)}
                            </span>
                          </div>
                          <div className={styles.modernCardActions}>
                            {booking.status === "pending" ? (
                              <>
                                <button
                                  className={styles.modernAcceptBtn}
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      booking.id,
                                      "accepted"
                                    )
                                  }
                                >
                                  <span>✓</span>
                                  <span>Accept</span>
                                </button>
                                <button
                                  className={styles.modernRejectBtn}
                                  onClick={() =>
                                    handleUpdateBookingStatus(
                                      booking.id,
                                      "rejected"
                                    )
                                  }
                                >
                                  <span>✕</span>
                                  <span>Decline</span>
                                </button>
                              </>
                            ) : (
                              <div className={styles.moreActionsWrapper}>
                                <button
                                  className={styles.modernMoreActionsBtn}
                                  onClick={() =>
                                    toggleMoreActionsMenu(booking.id)
                                  }
                                >
                                  <span>More Actions</span>
                                </button>
                                {openMenuId === booking.id && (
                                  <div className={styles.moreActionsMenu}>
                                    {booking.status === "accepted" && (
                                      <>
                                        <button
                                          className={styles.menuItem}
                                          onClick={() =>
                                            handleCompleteBooking(booking)
                                          }
                                        >
                                          <span>✓</span>
                                          <span>Complete & Rate</span>
                                        </button>
                                        <button
                                          className={styles.menuItem}
                                          onClick={() =>
                                            handleCancelBooking(
                                              booking.id,
                                              booking
                                            )
                                          }
                                          disabled={!canCancelBooking(booking)}
                                          title={
                                            !canCancelBooking(booking)
                                              ? "Cannot cancel within 24 hours of event"
                                              : ""
                                          }
                                        >
                                          <span>🚫</span>
                                          <span>Cancel</span>
                                        </button>
                                      </>
                                    )}
                                    {booking.status === "completed" && (
                                      <button
                                        className={styles.menuItem}
                                        onClick={() =>
                                          handleRateBooking(booking)
                                        }
                                      >
                                        <span>⭐</span>
                                        <span>Rate Client</span>
                                      </button>
                                    )}
                                    {booking.status === "rejected" && (
                                      <button
                                        className={styles.menuItem}
                                        disabled
                                      >
                                        <span>✕</span>
                                        <span>No Actions Available</span>
                                      </button>
                                    )}
                                    {booking.status === "cancelled" && (
                                      <button
                                        className={styles.menuItem}
                                        disabled
                                      >
                                        <span>🚫</span>
                                        <span>Booking Cancelled</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.modernEmptyState}>
                    <div className={styles.emptyIcon}>📋</div>
                    <h3>No Booking Requests Yet</h3>
                    <p>
                      When companies request your services, they will appear
                      here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Company View - Show Sent Booking Requests */}
            {isCompany && (
              <div className={styles.bookingRequestsSection}>
                <div className={styles.sectionTitleWrapper}>
                  <h2 className={styles.modernSectionTitle}>
                    <span className={styles.titleIcon}>📤</span>
                    <span>Sent Booking Requests</span>
                  </h2>
                  <span className={styles.requestCount}>
                    {bookingRequests.length} requests
                  </span>
                </div>
                {loadingBookings ? (
                  <div className={styles.modernLoadingState}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading booking requests...</p>
                  </div>
                ) : bookingRequests.length > 0 ? (
                  <div className={styles.bookingGrid}>
                    {bookingRequests.map((booking) => (
                      <div
                        key={booking.id}
                        className={styles.modernBookingCard}
                      >
                        {/* Card Header with Interpreter Info */}
                        <div className={styles.modernCardHeader}>
                          <div className={styles.companySection}>
                            {booking.interpreter?.avatar ? (
                              <div className={styles.logoWrapper}>
                                <img
                                  src={`http://localhost:4000${booking.interpreter.avatar}`}
                                  alt={
                                    booking.interpreter.fullName ||
                                    "Interpreter"
                                  }
                                  className={styles.modernCompanyLogo}
                                />
                              </div>
                            ) : (
                              <div className={styles.logoPlaceholder}>
                                <span>👤</span>
                              </div>
                            )}
                            <div className={styles.companyDetails}>
                              <h3
                                className={styles.modernCompanyName}
                                onClick={() =>
                                  booking.interpreter?.id &&
                                  handleInterpreterClick(booking.interpreter.id)
                                }
                                style={{
                                  cursor: booking.interpreter?.id
                                    ? "pointer"
                                    : "default",
                                }}
                              >
                                {booking.interpreter?.fullName || "Interpreter"}
                              </h3>
                              <p className={styles.serviceTypeLabel}>
                                {booking.serviceType === "consecutive" &&
                                  "🎤 Consecutive Interpreting"}
                                {booking.serviceType === "simultaneous" &&
                                  "🎧 Simultaneous Interpreting"}
                                {booking.serviceType === "escort" &&
                                  "🚶 Escort Interpreting"}
                                {booking.serviceType === "online" &&
                                  "💻 Online Interpreting"}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`${styles.modernStatusBadge} ${
                              booking.status === "pending"
                                ? styles.statusPending
                                : booking.status === "accepted"
                                ? styles.statusAccepted
                                : booking.status === "rejected"
                                ? styles.statusRejected
                                : booking.status === "completed"
                                ? styles.statusCompleted
                                : styles.statusCancelled
                            }`}
                          >
                            {booking.status === "pending" && "⏳ Pending"}
                            {booking.status === "accepted" && "✓ Accepted"}
                            {booking.status === "rejected" && "✕ Rejected"}
                            {booking.status === "completed" && "✓ Completed"}
                            {booking.status === "cancelled" && "✕ Cancelled"}
                          </div>
                        </div>

                        {/* Card Body with Details */}
                        <div className={styles.modernCardBody}>
                          {/* Date & Time */}
                          <div className={styles.infoSection}>
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>📅</span>
                                <span>Date & Time</span>
                              </div>
                              <div className={styles.infoValue}>
                                {booking.eventDuration === "single" ? (
                                  <>
                                    <div className={styles.dateValue}>
                                      {booking.eventDate}
                                    </div>
                                    <div className={styles.timeRange}>
                                      {booking.startTime} - {booking.endTime}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={styles.dateValue}>
                                      {booking.startDate} → {booking.endDate}
                                    </div>
                                    <div className={styles.timeRange}>
                                      {booking.timeRequirement === "fullDay" &&
                                        "Full Day (8 hours)"}
                                      {booking.timeRequirement === "halfDay" &&
                                        "Half Day (4 hours)"}
                                      {booking.timeRequirement ===
                                        "eventSchedule" && "Per Event Schedule"}
                                      {booking.timeRequirement === "other" &&
                                        "Other"}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Location */}
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>
                                  {booking.bookingType === "online"
                                    ? "💻"
                                    : "📍"}
                                </span>
                                <span>Location</span>
                              </div>
                              <div className={styles.infoValue}>
                                {booking.bookingType === "online" ? (
                                  <span className={styles.onlineBadge}>
                                    Online Meeting
                                  </span>
                                ) : (
                                  booking.location || "TBD"
                                )}
                              </div>
                            </div>

                            {/* Cost Estimate */}
                            <div className={styles.infoRow}>
                              <div className={styles.infoLabel}>
                                <span className={styles.infoIcon}>💰</span>
                                <span>Estimated Cost</span>
                              </div>
                              <div className={styles.infoValue}>
                                <div className={styles.costValue}>
                                  ${Number(booking.estimatedCost).toFixed(2)}
                                </div>
                                <div className={styles.hoursValue}>
                                  ({booking.estimatedHours} hours)
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Topic/Description */}
                          <div className={styles.topicSection}>
                            <div className={styles.topicLabel}>
                              <span className={styles.infoIcon}>📝</span>
                              <span>Topic & Details</span>
                            </div>
                            <p className={styles.topicContent}>
                              {booking.topic.length > 150
                                ? `${booking.topic.substring(0, 150)}...`
                                : booking.topic}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer with Status Info */}
                        <div className={styles.modernCardFooter}>
                          <div className={styles.requestedTime}>
                            <span className={styles.timeIcon}>🕐</span>
                            <span>Sent {formatDate(booking.createdAt)}</span>
                          </div>
                          <div className={styles.modernCardActions}>
                            {booking.status === "pending" ? (
                              <button
                                className={styles.modernCancelBtn}
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id,
                                    "cancelled"
                                  )
                                }
                              >
                                <span>🚫</span>
                                <span>Cancel Request</span>
                              </button>
                            ) : (
                              <div className={styles.moreActionsWrapper}>
                                <button
                                  className={styles.modernMoreActionsBtn}
                                  onClick={() =>
                                    toggleMoreActionsMenu(booking.id)
                                  }
                                >
                                  <span>More Actions</span>
                                </button>
                                {openMenuId === booking.id && (
                                  <div className={styles.moreActionsMenu}>
                                    {booking.status === "accepted" && (
                                      <>
                                        <button
                                          className={styles.menuItem}
                                          onClick={() =>
                                            handleCompleteBooking(booking)
                                          }
                                        >
                                          <span>✓</span>
                                          <span>Complete & Rate</span>
                                        </button>
                                        <button
                                          className={styles.menuItem}
                                          onClick={() =>
                                            handleCancelBooking(
                                              booking.id,
                                              booking
                                            )
                                          }
                                          disabled={!canCancelBooking(booking)}
                                          title={
                                            !canCancelBooking(booking)
                                              ? "Cannot cancel within 24 hours of event"
                                              : ""
                                          }
                                        >
                                          <span>🚫</span>
                                          <span>Cancel</span>
                                        </button>
                                      </>
                                    )}
                                    {booking.status === "completed" && (
                                      <button
                                        className={styles.menuItem}
                                        onClick={() =>
                                          handleRateBooking(booking)
                                        }
                                      >
                                        <span>⭐</span>
                                        <span>Rate Interpreter</span>
                                      </button>
                                    )}
                                    {booking.status === "rejected" && (
                                      <button
                                        className={styles.menuItem}
                                        disabled
                                      >
                                        <span>✕</span>
                                        <span>Request Declined</span>
                                      </button>
                                    )}
                                    {booking.status === "cancelled" && (
                                      <button
                                        className={styles.menuItem}
                                        disabled
                                      >
                                        <span>🚫</span>
                                        <span>Booking Cancelled</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.modernEmptyState}>
                    <div className={styles.emptyIcon}>📤</div>
                    <h3>No Booking Requests Sent Yet</h3>
                    <p>Start booking interpreters to see your requests here</p>
                  </div>
                )}
              </div>
            )}

            {!isInterpreter && !isCompany && (
              <div className={styles.applicationsGrid}>
                {filteredApplications.map((application) => (
                  <div key={application.id} className={styles.applicationCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.companyInfo}>
                        <span className={styles.companyLogo}>
                          {application.logo}
                        </span>
                        <div>
                          <h3 className={styles.companyName}>
                            {application.company}
                          </h3>
                          <h4 className={styles.position}>
                            {application.position}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={`${styles.status} ${getStatusClass(
                          application.status
                        )}`}
                      >
                        {getStatusText(application.status)}
                      </span>
                    </div>

                    <div className={styles.cardContent}>
                      <div className={styles.jobDetails}>
                        <span className={styles.jobType}>
                          {application.jobType}
                        </span>
                        <span className={styles.workType}>
                          {application.workType}
                        </span>
                        <span className={styles.location}>
                          {application.location}
                        </span>
                      </div>
                      <div className={styles.salary}>{application.salary}</div>
                      <div className={styles.dateApplied}>
                        {t("applications.appliedOn")}:{" "}
                        {formatDate(application.dateApplied)}
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.viewDetailsBtn}
                        onClick={() => handleViewDetails(application)}
                      >
                        {t("applications.viewDetails")}
                      </button>
                      <button className={styles.withdrawBtn}>
                        {t("applications.withdraw")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredApplications.length === 0 && !isInterpreter && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>{t("applications.noApplications")}</h3>
                <p>{t("applications.noApplicationsDesc")}</p>
                <button
                  className={styles.findJobsBtn}
                  onClick={() => navigate(ROUTES.FIND_JOB)}
                >
                  {t("applications.findJobs")}
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Application Details Modal */}
        {selectedApplication && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedApplication.position}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.companySection}>
                  <span className={styles.modalCompanyLogo}>
                    {selectedApplication.logo}
                  </span>
                  <div>
                    <h3>{selectedApplication.company}</h3>
                    <p className={styles.modalLocation}>
                      {selectedApplication.location}
                    </p>
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.jobType")}:</strong>
                    <span>{selectedApplication.jobType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.workType")}:</strong>
                    <span>{selectedApplication.workType}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.salary")}:</strong>
                    <span>{selectedApplication.salary}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.appliedOn")}:</strong>
                    <span>{formatDate(selectedApplication.dateApplied)}</span>
                  </div>
                  <div className={styles.detailGroup}>
                    <strong>{t("applications.modal.status")}:</strong>
                    <span
                      className={`${styles.modalStatus} ${getStatusClass(
                        selectedApplication.status
                      )}`}
                    >
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                </div>

                <div className={styles.descriptionSection}>
                  <h4>{t("applications.modal.description")}</h4>
                  <p>{selectedApplication.description}</p>
                </div>

                <div className={styles.requirementsSection}>
                  <h4>{t("applications.modal.requirements")}</h4>
                  <ul>
                    {selectedApplication.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button className={styles.contactBtn}>
                  {t("applications.modal.contactCompany")}
                </button>
                <button className={styles.withdrawModalBtn}>
                  {t("applications.modal.withdraw")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Company Info Modal */}
        <CompanyInfoModal
          isOpen={isCompanyModalOpen}
          onClose={closeCompanyModal}
          company={selectedCompany}
        />

        {/* Interpreter Modal */}
        {isInterpreterModalOpen && selectedInterpreterId && (
          <InterpreterModal
            interpreterId={selectedInterpreterId}
            onClose={closeInterpreterModal}
          />
        )}

        {/* Rating Modal */}
        {isRatingModalOpen && selectedBookingForRating && (
          <div className={styles.ratingModalOverlay} onClick={closeRatingModal}>
            <div
              className={styles.ratingModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.ratingModalHeader}>
                <h2>
                  {selectedBookingForRating.status === "accepted"
                    ? "Complete & Rate"
                    : "Rate Booking"}
                </h2>
                <button
                  className={styles.ratingCloseBtn}
                  onClick={closeRatingModal}
                >
                  ×
                </button>
              </div>

              <div className={styles.ratingModalBody}>
                <p className={styles.ratingDescription}>
                  {isCompany
                    ? `Rate your experience with ${
                        selectedBookingForRating.interpreter?.fullName ||
                        "the interpreter"
                      }`
                    : `Rate your experience with ${
                        selectedBookingForRating.client?.clientProfile
                          ?.companyName || "the client"
                      }`}
                </p>

                {/* Star Rating */}
                <div className={styles.starRatingWrapper}>
                  <label>Rating:</label>
                  <div className={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`${styles.starBtn} ${
                          star <= rating ? styles.starActive : ""
                        }`}
                        onClick={() => setRating(star)}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <span className={styles.ratingValue}>{rating}/5</span>
                </div>

                {/* Comment */}
                <div className={styles.commentWrapper}>
                  <label>Comment (Optional):</label>
                  <textarea
                    className={styles.commentTextarea}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                  />
                </div>

                {selectedBookingForRating.status === "accepted" && (
                  <div className={styles.completionNote}>
                    <span>⚠️</span>
                    <p>
                      This booking will be marked as <strong>completed</strong>{" "}
                      after you submit this rating.
                    </p>
                  </div>
                )}
              </div>

              <div className={styles.ratingModalFooter}>
                <button
                  className={styles.cancelRatingBtn}
                  onClick={closeRatingModal}
                >
                  Cancel
                </button>
                <button
                  className={styles.submitRatingBtn}
                  onClick={handleSubmitRating}
                >
                  {selectedBookingForRating.status === "accepted"
                    ? "Complete & Submit Rating"
                    : "Submit Rating"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default MyApplicationsPage;
