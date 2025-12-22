import React, { useState, useEffect } from "react";
import styles from "./MyApplicationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService.js";
import messageService from "../../services/messageService.js";
import {
  FaBuilding,
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaCog,
  FaBriefcase,
  FaFileAlt,
  FaEnvelope,
  FaPhone,
  FaCopy,
  FaCheck,
  FaBookmark,
  FaCheckCircle,
  FaHourglass,
  FaTimes,
} from "react-icons/fa";
import JobCompletionWidget from "../../components/JobCompletionWidget/JobCompletionWidget.jsx";

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  {
    id: "applications",
    icon: FaClipboardList,
    labelKey: "applications",
    active: true,
  },
  {
    id: "savedJobs",
    icon: FaBookmark,
    labelKey: "savedJobs",
    active: false,
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

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  {
    id: "jobApplications",
    icon: FaClipboardList,
    labelKey: "jobApplications",
    active: true,
  },
  {
    id: "savedInterpreters",
    icon: FaBookmark,
    labelKey: "savedInterpreters",
    active: false,
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

function MyApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Get sidebar menu based on user role
  const SIDEBAR_MENU =
    user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;

  // Set activeMenu based on user role
  const [activeMenu, setActiveMenu] = useState(
    user?.role === "client" ? "jobApplications" : "applications"
  );

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [processingCompletion, setProcessingCompletion] = useState(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completionModalData, setCompletionModalData] = useState(null);

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await jobService.getMyApplications();

        // Handle response from sendPaginated (data is array directly)
        const applicationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.applications || [];

        if (
          applicationsData.length > 0 ||
          (response && response.success !== false)
        ) {
          const transformedApps = applicationsData.map((app) => {
            // For client: show interpreter info, for interpreter: show job info
            const isClient = user?.role === "client";

            return {
              id: app.id,
              company: isClient
                ? app.interpreter?.fullName ||
                  app.interpreter?.email ||
                  "Interpreter"
                : app.job?.organization?.name || "Company",
              logo: isClient
                ? FaUser
                : app.job?.organization?.logo || FaBuilding,
              position: isClient
                ? app.job?.title || "Job Position"
                : app.job?.title || "Position",
              jobType: app.job?.workingMode?.name || "Full-time",
              workType: app.job?.workingMode?.name || "Remote",
              location: app.job?.province || app.job?.address || "Location TBD",
              salary:
                app.job?.minSalary && app.job?.maxSalary
                  ? `$${app.job.minSalary}-${app.job.maxSalary}`
                  : app.job?.minSalary
                  ? `$${app.job.minSalary}+`
                  : "Negotiable",
              dateApplied:
                app.applicationDate ||
                app.createdAt ||
                new Date().toISOString(),
              status: app.status || "pending",
              description: isClient
                ? app.coverLetter || app.job?.descriptions || ""
                : app.job?.descriptions || "",
              requirements:
                app.job?.requiredLanguages
                  ?.map(
                    (rl) =>
                      `${rl.language?.name || ""} - ${rl.level?.name || ""}`
                  )
                  .filter(Boolean) || [],
              // Additional fields for client view
              interpreter: app.interpreter || null,
              coverLetter: app.coverLetter || "",
              resumeUrl: app.resumeUrl || "",
              // Completion fields
              completionRequestedBy: app.completionRequestedBy || null,
              completionRequestedAt: app.completionRequestedAt || null,
              completedAt: app.completedAt || null,
              jobId: app.jobId || app.job?.id || null,
              interpreterId: app.interpreterId || null,
            };
          });
          setApplications(transformedApps);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      }
    };

    fetchApplications();
  }, [user]);

  // Auto-open application modal if applicationId is passed via navigation state
  useEffect(() => {
    if (location.state?.applicationId && applications.length > 0) {
      const application = applications.find(
        (app) => app.id === location.state.applicationId
      );
      if (application) {
        setSelectedApplication(application);
        // Clear the state to prevent reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, applications]);

  const handleAcceptApplication = async (applicationId) => {
    if (!user || user.role !== "client") return;

    try {
      setProcessingApplication(applicationId);
      await jobService.acceptApplication(applicationId);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: "approved" } : app
        )
      );

      // Update selected application if it's the one being processed
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => ({
          ...prev,
          status: "approved",
        }));
      }

      // Show success message (you can add a toast notification here)
      alert(t("applications.modal.acceptSuccess"));
    } catch (error) {
      console.error("Error accepting application:", error);
      alert(
        t("applications.modal.errorPrefix") +
          (error.message || t("applications.modal.acceptError"))
      );
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!user || user.role !== "client") return;

    const reviewNotes = prompt(t("applications.modal.rejectPrompt"));
    if (reviewNotes === null) return; // User cancelled

    try {
      setProcessingApplication(applicationId);
      await jobService.rejectApplication(applicationId, reviewNotes);

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: "rejected" } : app
        )
      );

      // Update selected application if it's the one being processed
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => ({
          ...prev,
          status: "rejected",
        }));
      }

      // Show success message
      alert(t("applications.modal.rejectSuccess"));
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert(
        t("applications.modal.errorPrefix") +
          (error.message || t("applications.modal.rejectError"))
      );
    } finally {
      setProcessingApplication(null);
    }
  };

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
      case "pending":
        return styles.statusActive;
      case "under review":
        return styles.statusReview;
      case "shortlisted":
        return styles.statusShortlisted;
      case "interview scheduled":
        return styles.statusInterview;
      case "approved":
        return styles.statusApproved;
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

  const filteredApplications = applications
    .filter(
      (app) =>
        selectedStatus === "all" || app.status.toLowerCase() === selectedStatus
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.dateApplied) - new Date(a.dateApplied);
      } else if (sortBy === "oldest") {
        return new Date(a.dateApplied) - new Date(b.dateApplied);
      } else if (sortBy === "company") {
        return a.company.localeCompare(b.company);
      }
      return 0;
    });

  // Helper function to check if application is approved
  const isApplicationApproved = (application) => {
    if (!application || !application.status) return false;
    const status = application.status.toLowerCase();
    return status === "approved" || status === "accepted";
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  const openResumeModal = (resumeUrl) => {
    setSelectedResumeUrl(resumeUrl);
    setResumeModalOpen(true);
  };

  const closeResumeModal = () => {
    setResumeModalOpen(false);
    setSelectedResumeUrl(null);
  };

  const openContactModal = () => {
    setContactModalOpen(true);
  };

  const closeContactModal = () => {
    setContactModalOpen(false);
    setCopiedField(null);
  };

  // Job Completion Handlers
  const handleRequestCompletion = (applicationId) => {
    const application = applications.find((app) => app.id === applicationId);
    setCompletionModalData({
      type: "request",
      applicationId,
      application,
    });
    setCompletionModalOpen(true);
  };

  const confirmRequestCompletion = async (applicationId) => {
    setProcessingCompletion(applicationId);
    try {
      const response = await jobService.requestJobCompletion(applicationId);

      // Update applications list
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                completionRequestedBy:
                  response.data?.completionRequestedBy || user.id,
                completionRequestedAt:
                  response.data?.completionRequestedAt ||
                  new Date().toISOString(),
              }
            : app
        )
      );

      // Update selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => ({
          ...prev,
          completionRequestedBy:
            response.data?.completionRequestedBy || user.id,
          completionRequestedAt:
            response.data?.completionRequestedAt || new Date().toISOString(),
        }));
      }

      alert(
        t("applications.completion.requestSent") ||
          "Yêu cầu hoàn thành đã được gửi!"
      );
    } catch (error) {
      console.error("Error requesting completion:", error);
      alert(
        error.message ||
          t("applications.completion.requestError") ||
          "Không thể gửi yêu cầu"
      );
    } finally {
      setProcessingCompletion(null);
    }
  };

  const handleConfirmCompletion = (applicationId) => {
    const application = applications.find((app) => app.id === applicationId);
    setCompletionModalData({
      type: "confirm",
      applicationId,
      application,
    });
    setCompletionModalOpen(true);
  };

  const confirmCompleteJob = async (applicationId) => {
    setProcessingCompletion(applicationId);
    try {
      const response = await jobService.confirmJobCompletion(applicationId);

      // Update applications list
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                completedAt:
                  response.data?.completedAt || new Date().toISOString(),
                completionRequestedBy: null,
              }
            : app
        )
      );

      // Update selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => ({
          ...prev,
          completedAt: response.data?.completedAt || new Date().toISOString(),
          completionRequestedBy: null,
        }));
      }

      alert(
        t("applications.completion.completed") ||
          "Công việc đã được đánh dấu hoàn thành!"
      );
    } catch (error) {
      console.error("Error confirming completion:", error);
      alert(
        error.message ||
          t("applications.completion.confirmError") ||
          "Không thể xác nhận hoàn thành"
      );
    } finally {
      setProcessingCompletion(null);
    }
  };

  const handleCancelRequest = (applicationId) => {
    const application = applications.find((app) => app.id === applicationId);
    setCompletionModalData({
      type: "cancel",
      applicationId,
      application,
    });
    setCompletionModalOpen(true);
  };

  const confirmCancelRequest = async (applicationId) => {
    setProcessingCompletion(applicationId);
    try {
      await jobService.cancelJobCompletionRequest(applicationId);

      // Update applications list
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                completionRequestedBy: null,
                completionRequestedAt: null,
              }
            : app
        )
      );

      // Update selected application
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) => ({
          ...prev,
          completionRequestedBy: null,
          completionRequestedAt: null,
        }));
      }

      alert(t("applications.completion.cancelled") || "Yêu cầu đã được hủy");
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(
        error.message ||
          t("applications.completion.cancelError") ||
          "Không thể hủy yêu cầu"
      );
    } finally {
      setProcessingCompletion(null);
    }
  };

  const handleCompletionModalConfirm = async () => {
    if (!completionModalData) return;

    setCompletionModalOpen(false);
    const { type, applicationId } = completionModalData;

    try {
      if (type === "request") {
        await confirmRequestCompletion(applicationId);
      } else if (type === "confirm") {
        await confirmCompleteJob(applicationId);
      } else if (type === "cancel") {
        await confirmCancelRequest(applicationId);
      }
    } catch (error) {
      console.error("Completion action error:", error);
    } finally {
      setCompletionModalData(null);
    }
  };

  const handleCompletionModalCancel = () => {
    setCompletionModalOpen(false);
    setCompletionModalData(null);
  };

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert(t("applications.modal.copyError") || "Không thể sao chép");
    }
  };

  const openEmailClient = (email, subject = "") => {
    const subjectText =
      subject ||
      (user?.role === "client"
        ? `Liên hệ về đơn ứng tuyển - ${selectedApplication?.position || ""}`
        : `Liên hệ về công việc - ${selectedApplication?.position || ""}`);
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subjectText
    )}`;
  };

  const openPhoneDialer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleStartConversation = async (application) => {
    if (!isApplicationApproved(application)) {
      alert("Chỉ có thể nhắn tin sau khi đơn ứng tuyển được chấp nhận");
      return;
    }

    try {
      // Create conversation from application
      const response = await messageService.createConversationFromApplication(
        application.id
      );

      if (response && response.data) {
        // Navigate to messages page with conversation ID
        navigate(`${ROUTES.MESSAGES}?conversation=${response.data.id}`);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      const errorMessage = error.message || "Không thể tạo cuộc trò chuyện";
      if (
        errorMessage.includes("approved") ||
        errorMessage.includes("chấp nhận")
      ) {
        alert(errorMessage);
      } else {
        alert("Không thể tạo cuộc trò chuyện. " + errorMessage);
      }
    }
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
                    if (item.id === "overview") {
                      navigate(ROUTES.DASHBOARD);
                    } else if (item.id === "applications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedJobs") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS);
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "savedInterpreters") {
                      navigate(ROUTES.SAVED_INTERPRETERS);
                    } else if (item.id === "notifications") {
                      navigate(ROUTES.DASHBOARD + "?section=notifications");
                    } else if (item.id === "profile") {
                      navigate(ROUTES.PROFILE);
                    } else if (item.id === "settings") {
                      navigate(ROUTES.SETTINGS);
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

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.pageTitle}>
              {user?.role === "client"
                ? t("dashboard.navigation.jobApplications")
                : t("applications.pageTitle")}
            </h1>
            <p className={styles.pageSubtitle}>
              {user?.role === "client"
                ? t("applications.clientSubtitle")
                : t("applications.subtitle")}
            </p>
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
            <div className={styles.applicationsGrid}>
              {filteredApplications.map((application) => {
                const isClient = user?.role === "client";
                return (
                  <div key={application.id} className={styles.applicationCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.companyInfo}>
                        <span className={styles.companyLogo}>
                          {typeof application.logo === "string" ? (
                            application.logo
                          ) : application.logo ? (
                            <application.logo />
                          ) : (
                            <FaBuilding />
                          )}
                        </span>
                        <div>
                          <h3 className={styles.companyName}>
                            {isClient
                              ? application.company
                              : application.company}
                          </h3>
                          <h4 className={styles.position}>
                            {isClient
                              ? application.position
                              : application.position}
                          </h4>
                          {isClient && application.interpreter?.email && (
                            <p className={styles.applicantEmail}>
                              {application.interpreter.email}
                            </p>
                          )}
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
                      {isClient ? (
                        <>
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
                          {application.coverLetter && (
                            <div className={styles.coverLetterPreview}>
                              <strong>
                                {t("applications.modal.coverLetter")}:
                              </strong>
                              <p>
                                {application.coverLetter.substring(0, 100)}...
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
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
                          <div className={styles.salary}>
                            {application.salary}
                          </div>
                        </>
                      )}
                      <div className={styles.dateApplied}>
                        {t("applications.appliedOn")}:{" "}
                        {formatDate(application.dateApplied)}
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      {/* Job Completion Button - Show for approved applications - Top */}
                      {isApplicationApproved(application) && (
                        <>
                          {application.completedAt ? (
                            <div className={styles.completedBadge}>
                              <FaCheckCircle />{" "}
                              {t("applications.completion.completed") ||
                                "Đã hoàn thành"}
                            </div>
                          ) : application.completionRequestedBy ? (
                            application.completionRequestedBy ===
                            parseInt(user?.id) ? (
                              <button
                                className={styles.pendingCompletionBtn}
                                onClick={() =>
                                  handleCancelRequest(application.id)
                                }
                                disabled={
                                  processingCompletion === application.id
                                }
                              >
                                <FaHourglass />{" "}
                                {t("applications.completion.pending") ||
                                  "Chờ xác nhận"}
                              </button>
                            ) : (
                              <button
                                className={styles.confirmCompletionBtn}
                                onClick={() =>
                                  handleConfirmCompletion(application.id)
                                }
                                disabled={
                                  processingCompletion === application.id
                                }
                              >
                                <FaCheckCircle />{" "}
                                {t("applications.completion.confirm") ||
                                  "Xác nhận hoàn thành"}
                              </button>
                            )
                          ) : (
                            <button
                              className={styles.requestCompletionBtn}
                              onClick={() =>
                                handleRequestCompletion(application.id)
                              }
                              disabled={processingCompletion === application.id}
                            >
                              <FaCheckCircle />{" "}
                              {t("applications.completion.request") ||
                                "Hoàn thành công việc"}
                            </button>
                          )}
                        </>
                      )}

                      {/* Resume - Middle */}
                      {isClient ? (
                        <>
                          {application.resumeUrl ? (
                            <button
                              onClick={() =>
                                openResumeModal(application.resumeUrl)
                              }
                              className={styles.viewResumeBtn}
                            >
                              <FaFileAlt /> {t("applications.modal.viewResume")}
                            </button>
                          ) : (
                            <span className={styles.noResumeText}>
                              <FaFileAlt /> {t("applications.noResume")}
                            </span>
                          )}
                        </>
                      ) : (
                        <button className={styles.withdrawBtn}>
                          {t("applications.withdraw")}
                        </button>
                      )}

                      {/* View Details - Bottom */}
                      <button
                        className={styles.viewDetailsBtn}
                        onClick={() => handleViewDetails(application)}
                      >
                        {t("applications.viewDetails")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredApplications.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}></span>
                <h3>{t("applications.noApplications")}</h3>
                <p>
                  {user?.role === "client"
                    ? t("applications.clientNoApplicationsDesc")
                    : t("applications.noApplicationsDesc")}
                </p>
                {user?.role !== "client" && (
                  <button
                    className={styles.findJobsBtn}
                    onClick={() => navigate(ROUTES.FIND_JOB)}
                  >
                    {t("applications.findJobs")}
                  </button>
                )}
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
                <h2>
                  {user?.role === "client"
                    ? selectedApplication.position
                    : selectedApplication.position}
                </h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                {user?.role === "client" ? (
                  <>
                    {/* Client View: Show Interpreter Info */}
                    <div className={styles.companySection}>
                      <span className={styles.modalCompanyLogo}>
                        {typeof selectedApplication.logo === "string" ? (
                          selectedApplication.logo
                        ) : selectedApplication.logo ? (
                          <selectedApplication.logo />
                        ) : (
                          <FaUser />
                        )}
                      </span>
                      <div>
                        <h3>{selectedApplication.company}</h3>
                        {selectedApplication.interpreter?.email && (
                          <p className={styles.modalLocation}>
                            {selectedApplication.interpreter.email}
                          </p>
                        )}
                        {selectedApplication.interpreter?.phone && (
                          <p className={styles.modalLocation}>
                            {selectedApplication.interpreter.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.modalDetails}>
                      <div className={styles.detailGroup}>
                        <strong>{t("applications.modal.jobTitle")}:</strong>
                        <span>{selectedApplication.position}</span>
                      </div>
                      <div className={styles.detailGroup}>
                        <strong>{t("applications.modal.jobType")}:</strong>
                        <span>{selectedApplication.jobType}</span>
                      </div>
                      <div className={styles.detailGroup}>
                        <strong>{t("applications.modal.workType")}:</strong>
                        <span>{selectedApplication.workType}</span>
                      </div>
                      <div className={styles.detailGroup}>
                        <strong>{t("common.location") || "Location"}:</strong>
                        <span>{selectedApplication.location}</span>
                      </div>
                      <div className={styles.detailGroup}>
                        <strong>{t("applications.modal.appliedOn")}:</strong>
                        <span>
                          {formatDate(selectedApplication.dateApplied)}
                        </span>
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

                    {/* Show contact info prominently when accepted */}
                    {isApplicationApproved(selectedApplication) && (
                      <div className={styles.acceptedContactSection}>
                        <h4 className={styles.acceptedContactTitle}>
                          {t("applications.modal.contactApplicant")}
                        </h4>
                        <div className={styles.acceptedContactInfo}>
                          {selectedApplication.interpreter?.email && (
                            <div className={styles.acceptedContactItem}>
                              <FaEnvelope
                                className={styles.acceptedContactIcon}
                              />
                              <span className={styles.acceptedContactLabel}>
                                {t("applications.modal.applicantEmail")}:
                              </span>
                              <span className={styles.acceptedContactValue}>
                                {selectedApplication.interpreter.email}
                              </span>
                              <button
                                className={styles.acceptedContactAction}
                                onClick={() =>
                                  copyToClipboard(
                                    selectedApplication.interpreter.email,
                                    "email-accepted"
                                  )
                                }
                                title={t("applications.modal.copyEmail")}
                              >
                                {copiedField === "email-accepted" ? (
                                  <FaCheck />
                                ) : (
                                  <FaCopy />
                                )}
                              </button>
                              <button
                                className={styles.acceptedContactAction}
                                onClick={() =>
                                  openEmailClient(
                                    selectedApplication.interpreter.email
                                  )
                                }
                                title={t("applications.modal.openEmail")}
                              >
                                <FaEnvelope />
                              </button>
                            </div>
                          )}
                          {selectedApplication.interpreter?.phone && (
                            <div className={styles.acceptedContactItem}>
                              <FaPhone className={styles.acceptedContactIcon} />
                              <span className={styles.acceptedContactLabel}>
                                {t("applications.modal.applicantPhone")}:
                              </span>
                              <span className={styles.acceptedContactValue}>
                                {selectedApplication.interpreter.phone}
                              </span>
                              <button
                                className={styles.acceptedContactAction}
                                onClick={() =>
                                  copyToClipboard(
                                    selectedApplication.interpreter.phone,
                                    "phone-accepted"
                                  )
                                }
                                title={t("applications.modal.copyPhone")}
                              >
                                {copiedField === "phone-accepted" ? (
                                  <FaCheck />
                                ) : (
                                  <FaCopy />
                                )}
                              </button>
                              <button
                                className={styles.acceptedContactAction}
                                onClick={() =>
                                  openPhoneDialer(
                                    selectedApplication.interpreter.phone
                                  )
                                }
                                title={t("applications.modal.call")}
                              >
                                <FaPhone />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedApplication.coverLetter && (
                      <div className={styles.descriptionSection}>
                        <h4>{t("applications.modal.coverLetter")}</h4>
                        <p>{selectedApplication.coverLetter}</p>
                      </div>
                    )}

                    {selectedApplication.resumeUrl && (
                      <div className={styles.resumeSection}>
                        <h4>{t("applications.modal.resume")}</h4>
                        <button
                          onClick={() =>
                            openResumeModal(selectedApplication.resumeUrl)
                          }
                          className={styles.resumeLink}
                        >
                          {t("applications.modal.viewResume")}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Interpreter View: Show Job Info */}
                    <div className={styles.companySection}>
                      <span className={styles.modalCompanyLogo}>
                        {typeof selectedApplication.logo === "string" ? (
                          selectedApplication.logo
                        ) : selectedApplication.logo ? (
                          <selectedApplication.logo />
                        ) : (
                          <FaBuilding />
                        )}
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
                        <span>
                          {formatDate(selectedApplication.dateApplied)}
                        </span>
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
                  </>
                )}
              </div>

              {/* Job Completion Widget - Show for approved applications */}
              {isApplicationApproved(selectedApplication) && (
                <div className={styles.completionWidgetContainer}>
                  <JobCompletionWidget
                    application={selectedApplication}
                    currentUserId={user?.id}
                    onUpdate={(updatedApp) => {
                      // Update the selected application
                      setSelectedApplication((prev) => ({
                        ...prev,
                        ...updatedApp,
                      }));

                      // Update the applications list
                      setApplications((prev) =>
                        prev.map((app) =>
                          app.id === updatedApp.id
                            ? { ...app, ...updatedApp }
                            : app
                        )
                      );
                    }}
                  />
                </div>
              )}

              <div className={styles.modalActions}>
                {user?.role === "client" ? (
                  <>
                    {/* Primary Actions - Only show when not approved/rejected */}
                    {!isApplicationApproved(selectedApplication) &&
                      selectedApplication.status !== "rejected" && (
                        <div className={styles.primaryActions}>
                          <button
                            className={styles.acceptBtn}
                            onClick={() =>
                              handleAcceptApplication(selectedApplication.id)
                            }
                            disabled={
                              processingApplication === selectedApplication.id
                            }
                          >
                            {processingApplication === selectedApplication.id
                              ? t("applications.modal.processing")
                              : t("applications.modal.accept")}
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() =>
                              handleRejectApplication(selectedApplication.id)
                            }
                            disabled={
                              processingApplication === selectedApplication.id
                            }
                          >
                            {processingApplication === selectedApplication.id
                              ? t("applications.modal.processing")
                              : t("applications.modal.reject")}
                          </button>
                        </div>
                      )}

                    {/* Secondary Actions - Show when approved */}
                    {isApplicationApproved(selectedApplication) && (
                      <div className={styles.secondaryActions}>
                        <button
                          className={styles.chatBtn}
                          onClick={() =>
                            handleStartConversation(selectedApplication)
                          }
                          title={t("applications.modal.chatWithApplicant") || "Chat with applicant"}
                        >
                          {t("common.startChat") || "Nhắn tin"}
                        </button>
                        {selectedApplication.resumeUrl && (
                          <button
                            onClick={() =>
                              openResumeModal(selectedApplication.resumeUrl)
                            }
                            className={styles.iconBtn}
                            title={t("applications.modal.viewResume")}
                          >
                            <FaFileAlt />
                          </button>
                        )}
                        <button
                          className={styles.iconBtn}
                          onClick={openContactModal}
                          disabled={
                            !selectedApplication?.interpreter?.email &&
                            !selectedApplication?.interpreter?.phone
                          }
                          title={t("applications.modal.contactApplicant")}
                        >
                          <FaEnvelope />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Interpreter Actions */}
                    {isApplicationApproved(selectedApplication) ? (
                      <div className={styles.secondaryActions}>
                        <button
                          className={styles.chatBtn}
                          onClick={() =>
                            handleStartConversation(selectedApplication)
                          }
                          title={t("applications.modal.chatWithEmployer") || "Chat with employer"}
                        >
                          {t("common.startChat") || "Nhắn tin"}
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={openContactModal}
                          title={t("applications.modal.contactCompany")}
                        >
                          <FaEnvelope />
                        </button>
                      </div>
                    ) : (
                      <button className={styles.withdrawModalBtn}>
                        {t("applications.modal.withdraw")}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resume View Modal */}
        {resumeModalOpen && selectedResumeUrl && (
          <div className={styles.modalOverlay} onClick={closeResumeModal}>
            <div
              className={styles.resumeModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.resumeModalHeader}>
                <h2>{t("applications.modal.viewResume")}</h2>
                <button className={styles.closeBtn} onClick={closeResumeModal}>
                  ×
                </button>
              </div>
              <div className={styles.resumeModalBody}>
                <iframe
                  src={selectedResumeUrl}
                  className={styles.resumeIframe}
                  title="Resume"
                />
                <div className={styles.resumeModalActions}>
                  <a
                    href={selectedResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadResumeBtn}
                  >
                    <FaFileAlt /> {t("applications.downloadResume")}
                  </a>
                  <button
                    className={styles.closeResumeBtn}
                    onClick={closeResumeModal}
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information Modal */}
        {contactModalOpen && selectedApplication && (
          <div className={styles.modalOverlay} onClick={closeContactModal}>
            <div
              className={styles.contactModalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.contactModalHeader}>
                <h2>
                  {user?.role === "client"
                    ? t("applications.modal.contactApplicant")
                    : t("applications.modal.contactCompany")}
                </h2>
                <button className={styles.closeBtn} onClick={closeContactModal}>
                  ×
                </button>
              </div>
              <div className={styles.contactModalBody}>
                {user?.role === "client" ? (
                  <>
                    {/* Client viewing interpreter contact info */}
                    <div className={styles.contactInfoSection}>
                      <h3>
                        {selectedApplication.interpreter?.fullName ||
                          t("applications.modal.applicantName")}
                      </h3>

                      {selectedApplication.interpreter?.email && (
                        <div className={styles.contactItemRow}>
                          <div className={styles.contactItemInfo}>
                            <FaEnvelope className={styles.contactIcon} />
                            <span className={styles.contactLabel}>
                              {t("applications.modal.applicantEmail")}:
                            </span>
                            <span className={styles.contactValue}>
                              {selectedApplication.interpreter.email}
                            </span>
                          </div>
                          <div className={styles.contactItemActions}>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyToClipboard(
                                  selectedApplication.interpreter.email,
                                  "email"
                                )
                              }
                              title={
                                t("applications.modal.copyEmail") ||
                                "Sao chép email"
                              }
                            >
                              {copiedField === "email" ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                            <button
                              className={styles.emailBtn}
                              onClick={() =>
                                openEmailClient(
                                  selectedApplication.interpreter.email
                                )
                              }
                              title={
                                t("applications.modal.openEmail") || "Mở email"
                              }
                            >
                              <FaEnvelope />{" "}
                              {t("applications.modal.sendEmail") || "Gửi email"}
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedApplication.interpreter?.phone && (
                        <div className={styles.contactItemRow}>
                          <div className={styles.contactItemInfo}>
                            <FaPhone className={styles.contactIcon} />
                            <span className={styles.contactLabel}>
                              {t("applications.modal.applicantPhone")}:
                            </span>
                            <span className={styles.contactValue}>
                              {selectedApplication.interpreter.phone}
                            </span>
                          </div>
                          <div className={styles.contactItemActions}>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyToClipboard(
                                  selectedApplication.interpreter.phone,
                                  "phone"
                                )
                              }
                              title={
                                t("applications.modal.copyPhone") ||
                                "Sao chép số điện thoại"
                              }
                            >
                              {copiedField === "phone" ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                            <button
                              className={styles.phoneBtn}
                              onClick={() =>
                                openPhoneDialer(
                                  selectedApplication.interpreter.phone
                                )
                              }
                              title={t("applications.modal.call") || "Gọi điện"}
                            >
                              <FaPhone />{" "}
                              {t("applications.modal.call") || "Gọi"}
                            </button>
                          </div>
                        </div>
                      )}

                      {!selectedApplication.interpreter?.email &&
                        !selectedApplication.interpreter?.phone && (
                          <p className={styles.noContactInfo}>
                            {t("applications.modal.noContactInfo") ||
                              "Ứng viên chưa cung cấp thông tin liên hệ."}
                          </p>
                        )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Interpreter viewing company contact info */}
                    <div className={styles.contactInfoSection}>
                      <h3>{selectedApplication.company}</h3>
                      <p className={styles.contactNote}>
                        {t("applications.modal.contactNote") ||
                          "Vui lòng liên hệ với công ty để biết thêm thông tin về công việc."}
                      </p>
                      {selectedApplication.job?.contactEmail && (
                        <div className={styles.contactItemRow}>
                          <div className={styles.contactItemInfo}>
                            <FaEnvelope className={styles.contactIcon} />
                            <span className={styles.contactLabel}>
                              {t("applications.modal.contactEmail")}:
                            </span>
                            <span className={styles.contactValue}>
                              {selectedApplication.job.contactEmail}
                            </span>
                          </div>
                          <div className={styles.contactItemActions}>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyToClipboard(
                                  selectedApplication.job.contactEmail,
                                  "email"
                                )
                              }
                              title={
                                t("applications.modal.copyEmail") ||
                                "Sao chép email"
                              }
                            >
                              {copiedField === "email" ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                            <button
                              className={styles.emailBtn}
                              onClick={() =>
                                openEmailClient(
                                  selectedApplication.job.contactEmail
                                )
                              }
                              title={
                                t("applications.modal.openEmail") || "Mở email"
                              }
                            >
                              <FaEnvelope />{" "}
                              {t("applications.modal.sendEmail") || "Gửi email"}
                            </button>
                          </div>
                        </div>
                      )}
                      {selectedApplication.job?.contactPhone && (
                        <div className={styles.contactItemRow}>
                          <div className={styles.contactItemInfo}>
                            <FaPhone className={styles.contactIcon} />
                            <span className={styles.contactLabel}>
                              {t("applications.modal.contactPhone")}:
                            </span>
                            <span className={styles.contactValue}>
                              {selectedApplication.job.contactPhone}
                            </span>
                          </div>
                          <div className={styles.contactItemActions}>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyToClipboard(
                                  selectedApplication.job.contactPhone,
                                  "phone"
                                )
                              }
                              title={
                                t("applications.modal.copyPhone") ||
                                "Sao chép số điện thoại"
                              }
                            >
                              {copiedField === "phone" ? (
                                <FaCheck />
                              ) : (
                                <FaCopy />
                              )}
                            </button>
                            <button
                              className={styles.phoneBtn}
                              onClick={() =>
                                openPhoneDialer(
                                  selectedApplication.job.contactPhone
                                )
                              }
                              title={t("applications.modal.call") || "Gọi điện"}
                            >
                              <FaPhone />{" "}
                              {t("applications.modal.call") || "Gọi"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.contactModalActions}>
                <button
                  className={styles.closeContactBtn}
                  onClick={closeContactModal}
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Job Completion Confirmation Modal */}
        {completionModalOpen && completionModalData && (
          <div
            className={styles.modalOverlay}
            onClick={handleCompletionModalCancel}
          >
            <div
              className={styles.completionModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.completionModalHeader}>
                <div className={styles.completionModalIcon}>
                  <FaCheckCircle />
                </div>
                <h3 className={styles.completionModalTitle}>
                  {completionModalData.type === "request" &&
                    (t("applications.completion.modalTitleRequest") ||
                      "Yêu cầu hoàn thành công việc")}
                  {completionModalData.type === "confirm" &&
                    (t("applications.completion.modalTitleConfirm") ||
                      "Xác nhận hoàn thành")}
                  {completionModalData.type === "cancel" &&
                    (t("applications.completion.modalTitleCancel") ||
                      "Hủy yêu cầu")}
                </h3>
              </div>

              <div className={styles.completionModalBody}>
                {completionModalData.application && (
                  <div className={styles.completionJobInfo}>
                    <div className={styles.completionJobHeader}>
                      <span className={styles.completionJobLogo}>
                        {typeof completionModalData.application.logo ===
                        "string" ? (
                          completionModalData.application.logo
                        ) : completionModalData.application.logo ? (
                          <completionModalData.application.logo />
                        ) : (
                          <FaBriefcase />
                        )}
                      </span>
                      <div>
                        <h4 className={styles.completionJobTitle}>
                          {completionModalData.application.position}
                        </h4>
                        <p className={styles.completionJobCompany}>
                          {completionModalData.application.company}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <p className={styles.completionModalMessage}>
                  {completionModalData.type === "request" && (
                    <>
                      {t("applications.completion.modalMessageRequest") ||
                        "Bạn có chắc muốn yêu cầu hoàn thành công việc này? Đối phương sẽ nhận được thông báo để xác nhận."}
                    </>
                  )}
                  {completionModalData.type === "confirm" && (
                    <>
                      {t("applications.completion.modalMessageConfirm") ||
                        "Xác nhận rằng công việc đã được hoàn thành? Cả hai bên sẽ không thể thay đổi sau khi xác nhận."}
                    </>
                  )}
                  {completionModalData.type === "cancel" && (
                    <>
                      {t("applications.completion.modalMessageCancel") ||
                        "Bạn có chắc muốn hủy yêu cầu hoàn thành công việc này?"}
                    </>
                  )}
                </p>
              </div>

              <div className={styles.completionModalActions}>
                <button
                  className={styles.completionCancelBtn}
                  onClick={handleCompletionModalCancel}
                  disabled={
                    processingCompletion === completionModalData.applicationId
                  }
                >
                  {t("common.cancel") || "Hủy"}
                </button>
                <button
                  className={styles.completionConfirmBtn}
                  onClick={handleCompletionModalConfirm}
                  disabled={
                    processingCompletion === completionModalData.applicationId
                  }
                >
                  {processingCompletion ===
                  completionModalData.applicationId ? (
                    <>
                      {t("applications.modal.processing") || "Processing..."}
                    </>
                  ) : (
                    <>
                      {completionModalData.type === "request" && (
                        <>
                          <FaCheckCircle />{" "}
                          {t("applications.completion.sendRequest") ||
                            "Gửi yêu cầu"}
                        </>
                      )}
                      {completionModalData.type === "confirm" && (
                        <>
                          <FaCheckCircle />{" "}
                          {t("applications.completion.confirmBtn") ||
                            "Xác nhận"}
                        </>
                      )}
                      {completionModalData.type === "cancel" && (
                        <>
                          <FaTimes />{" "}
                          {t("applications.completion.cancelBtn") ||
                            "Hủy yêu cầu"}
                        </>
                      )}
                    </>
                  )}
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
