import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants/enums";
import jobService from "../../services/jobService.js";
import interpreterService from "../../services/interpreterService.js";
import aiMatchingService from "../../services/aiMatchingService";
import notificationService from "../../services/notificationService";
import { AIRankedApplications, MatchReasonsCard, SuitabilityScoreBadge, AIToggle } from "../../components/AIMatching";
import { getErrorMessage } from "../../utils/errors";
import toastService from "../../services/toastService";
import styles from "./JobDetailPage.module.css";
import {
  FaMapMarkerAlt,
  FaBullseye,
  FaBriefcase,
  FaStar,
  FaDollarSign,
  FaClock,
  FaTimesCircle,
  FaBookmark,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaCalendarAlt,
  FaCertificate,
  FaLanguage,
  FaCheckCircle,
  FaEdit,
  FaFileAlt,
  FaUserPlus,
  FaEye,
  FaSpinner,
  FaUserCheck,
} from "react-icons/fa";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [applications, setApplications] = useState([]);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applicationActionLoading, setApplicationActionLoading] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState({
    pdfFile: null,
    introduction: "",
    profileLink: "",
  });

  // AI Matching states for client role (recommended interpreters)
  const [aiMatches, setAiMatches] = useState([]);
  const [preFilteredInterpreters, setPreFilteredInterpreters] = useState([]); // Top 10 interpreters before AI
  const [selectedMatchDetails, setSelectedMatchDetails] = useState(null);
  const [loadingAISuggestions, setLoadingAISuggestions] = useState(false);
  const [aiSuggestionsFetched, setAiSuggestionsFetched] = useState(false);
  const [showAIView, setShowAIView] = useState(false); // Toggle between AI and All views
  
  // Connection request states
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [selectedInterpreter, setSelectedInterpreter] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [sendingConnection, setSendingConnection] = useState(false);

  // AI Matching states for interpreter role (suitability score)
  const [interpreterSuitabilityScore, setInterpreterSuitabilityScore] = useState(null);
  const [loadingInterpreterScore, setLoadingInterpreterScore] = useState(false);
  const [interpreterScoreFetched, setInterpreterScoreFetched] = useState(false);

  const hasPremium = user?.isPremium || false;

  const normalizeApplication = useCallback((app) => {
    if (!app) return app;
    const rawStatus =
      app.status || app.statusLabel || app.statusName || app.statusCounts;
    const statusText =
      typeof rawStatus === "string"
        ? rawStatus
        : rawStatus
        ? rawStatus?.name ||
          rawStatus?.code ||
          // stringify object statusCounts to avoid React rendering objects
          JSON.stringify(rawStatus)
        : "pending";
    const coverLetterText =
      typeof app.coverLetter === "string" ? app.coverLetter : "";
    const resumeUrlText =
      typeof app.resumeUrl === "string" ? app.resumeUrl : null;
    return {
      ...app,
      statusText,
      coverLetter: coverLetterText,
      resumeUrl: resumeUrlText,
    };
  }, []);

  // Notification functions
  function showNotification(message, type = "error") {
    setNotification({
      show: true,
      message,
      type,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  }

  function hideNotification() {
    setNotification((prev) => ({ ...prev, show: false }));
  }

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await jobService.getJobById(id);

        if (response && (response.success || response.data)) {
          const jobData = response.data?.job || response.data || {};

          const transformedJob = {
            id: jobData.id,
            title: jobData.title,
            company: jobData.organization?.name || "Company",
            location: jobData.province || jobData.address || "Location TBD",
            commune: jobData.commune || "",
            address: jobData.address || "",
            category:
              jobData.domains?.[0]?.domain?.name ||
              jobData.domains?.[0]?.name ||
              jobData.domains?.[0]?.domain?.nameVi ||
              jobData.domains?.[0]?.nameVi ||
              "General",
            allDomains:
              jobData.domains
                ?.map((d) => {
                  // Handle different data structures
                  if (d.domain?.name) return d.domain.name;
                  if (d.name) return d.name;
                  if (d.domain?.nameVi) return d.domain.nameVi;
                  if (d.nameVi) return d.nameVi;
                  return "";
                })
                .filter(Boolean) || [],
            level: jobData.requiredLanguages?.[0]?.level?.name || "Mid",
            type: jobData.workingMode?.name || "Full-time",
            salary:
              jobData.minSalary && jobData.maxSalary
                ? `$${jobData.minSalary}-${jobData.maxSalary}`
                : jobData.minSalary
                ? `$${jobData.minSalary}+`
                : "Negotiable",
            minSalary: jobData.minSalary,
            maxSalary: jobData.maxSalary,
            salaryType: jobData.salaryType || "NEGOTIABLE",
            quantity: jobData.quantity || 1,
            expirationDate: jobData.expirationDate,
            createdDate: jobData.createdDate || jobData.createdAt,
            statusOpenStop: jobData.statusOpenStop || "open",
            tags: [
              ...(jobData.requiredLanguages?.map(
                (rl) => rl.language?.name || ""
              ) || []),
              ...(jobData.domains?.map((d) => {
                if (d.domain?.name) return d.domain.name;
                if (d.name) return d.name;
                if (d.domain?.nameVi) return d.domain.nameVi;
                if (d.nameVi) return d.nameVi;
                return "";
              }).filter(Boolean) || []),
            ].filter(Boolean),
            desc: jobData.descriptions || "",
            fullDesc: jobData.descriptions || "",
            responsibility: jobData.responsibility || "",
            requirements:
              jobData.requiredLanguages?.map((rl) => ({
                language: rl.language?.name || "",
                level: rl.level?.name || "",
                fullText: `${rl.language?.name || ""} - ${
                  rl.level?.name || ""
                }`,
              })) || [],
            requiredCertificates:
              jobData.requiredCertificates
                ?.map((rc) => rc.certificate?.name || "")
                .filter(Boolean) || [],
            benefits: jobData.benefits
              ? Array.isArray(jobData.benefits)
                ? jobData.benefits
                : [jobData.benefits]
              : [],
            contact: {
              email: jobData.organization?.email || jobData.contactEmail || "",
              phone: jobData.organization?.phone || jobData.contactPhone || "",
              address: jobData.address || jobData.province || "",
            },
            reviewStatus: jobData.reviewStatus || "pending",
            reviewNotes: jobData.reviewNotes || "",
            organization: jobData.organization || null,
            ownerUserId: jobData.organization?.ownerUserId || null,
          };

          setJob(transformedJob);
        } else {
          showNotification("Job not found", "error");
          navigate(ROUTES.FIND_JOB);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        showNotification(error.message || "Error loading job details", "error");
        navigate(ROUTES.FIND_JOB);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id, navigate]);

  // Fetch saved jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!isAuthenticated || !user) {
        setSavedJobIds(new Set());
        return;
      }

      try {
        const response = await jobService.getSavedJobs();
        const savedJobsData = response.data || [];

        if (
          response &&
          response.success !== false &&
          Array.isArray(savedJobsData)
        ) {
          const savedIds = new Set(
            savedJobsData
              .map((saved) => saved.job?.id || saved.id)
              .filter(Boolean)
          );
          setSavedJobIds(savedIds);
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    fetchSavedJobs();
  }, [isAuthenticated, user]);

  // Handle save job
  async function handleSaveJob(e) {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      showNotification(
        t("findJob.errors.loginRequired") ||
          "Vui lòng đăng nhập để lưu việc làm",
        "error"
      );
      return;
    }

    try {
      setSavingJobId(job.id);
      const currentlySaved = savedJobIds.has(job.id);

      const response = await jobService.toggleSaveJob(job.id);

      if (response && response.success !== false) {
        const isSaved =
          response.data?.isSaved ?? response.isSaved ?? !currentlySaved;

        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          if (isSaved) {
            newSet.add(job.id);
          } else {
            newSet.delete(job.id);
          }
          return newSet;
        });

        showNotification(
          isSaved
            ? t("findJob.saveJob.saved") || "Job saved"
            : t("findJob.saveJob.unsaved") || "Job unsaved",
          "success"
        );
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showNotification(
        error.message ||
          t("findJob.errors.saveFailed") ||
          "Unable to save job",
        "error"
      );
    } finally {
      setSavingJobId(null);
    }
  }

  function handleApply() {
    if (!isAuthenticated || !user) {
      showNotification(
        t("findJob.errors.loginRequired") || "Please log in to apply",
        "error"
      );
      return;
    }
    setApplyModalOpen(true);
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setApplicationData((prev) => ({
        ...prev,
        pdfFile: file,
      }));
    } else {
      showNotification(
        t("findJob.applicationModal.pdfOnlyError") || "PDF files only",
        "error"
      );
    }
  }

  async function handleSubmitApplication(e) {
    e.preventDefault();

    // Validate required fields
    if (!applicationData.pdfFile && !applicationData.introduction.trim()) {
      showNotification(
        t("findJob.applicationModal.validationError") ||
          "Please complete all required fields",
        "error"
      );
      return;
    }

    if (!applicationData.pdfFile) {
      showNotification(
        t("findJob.applicationModal.missingCV") || "Please upload your CV",
        "error"
      );
      return;
    }

    if (!applicationData.introduction.trim()) {
      showNotification(
        t("findJob.applicationModal.missingIntro") ||
          "Please enter an introduction",
        "error"
      );
      return;
    }

    try {
      setSubmitting(true);

      const applicationPayload = {
        coverLetter: applicationData.introduction,
        pdfFile: applicationData.pdfFile,
        resumeUrl: applicationData.profileLink || null,
        resumeType: applicationData.pdfFile ? "pdf" : null,
      };

      const response = await jobService.applyForJob(id, applicationPayload);

      if (response && response.success !== false) {
        showNotification(
          t("findJob.applicationModal.successMessage") ||
            "Application submitted successfully!",
          "success"
        );

        setApplyModalOpen(false);
        setApplicationData({
          pdfFile: null,
          introduction: "",
          profileLink: "",
        });

        // Reload job details to update application status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showNotification(
          response.message || "An error occurred while submitting the application",
          "error"
        );
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification(
        error.message ||
          t("findJob.applicationModal.errorMessage") ||
          "Unable to submit the application",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleUpgradeToPremium() {
    navigate(ROUTES.PRICING);
  }

  function handleEditJob() {
    navigate(`${ROUTES.POST_JOB}?edit=${id}`);
  }

  function handleApplicationClick(app) {
    setSelectedApplication(normalizeApplication(app));
    setApplicationModalOpen(true);
    if (app.resumeUrl) {
      setSelectedResumeUrl(app.resumeUrl);
    } else {
      setSelectedResumeUrl(null);
    }
  }

  async function handleApplicationAction(type) {
    if (!selectedApplication?.id) return;
    setApplicationActionLoading(true);
    try {
      const action =
        type === "accept"
          ? jobService.acceptApplication
          : jobService.rejectApplication;
      const response = await action(selectedApplication.id, "");

      if (response && response.success !== false) {
        // Optimistically update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApplication.id
              ? { ...app, status: type === "accept" ? "approved" : "rejected" }
              : app
          )
        );
        setSelectedApplication((prev) =>
          prev
            ? {
                ...prev,
                status: type === "accept" ? "approved" : "rejected",
              }
            : prev
        );
        showNotification(
          type === "accept"
            ? t("applications.accepted") || "Đã chấp nhận ứng viên"
            : t("applications.rejected") || "Đã từ chối ứng viên",
          "success"
        );
      } else {
        showNotification(
          response?.message ||
            t("applications.error") ||
            "Cannot perform action",
          "error"
        );
      }
    } catch (error) {
      console.error("Application action error:", error);
      showNotification(
        getErrorMessage(error) ||
          t("applications.error") ||
          "Cannot perform action",
        "error"
      );
    } finally {
      setApplicationActionLoading(false);
    }
  }


  // Check if current user is the owner of this job (via organization)
  const isJobOwner = user?.role === "client" && job?.organization?.ownerUserId === user?.id;

  // Fetch AI suggested interpreters for client role
  // Fetch pre-filtered interpreters only (without AI)
  const handleFetchPreFilteredInterpreters = async () => {
    if (!job?.id) {
      toastService.error("Job ID is required");
      return;
    }

    if (loadingAISuggestions) {
      console.log("Already loading, skipping...");
      return;
    }

    console.log("Fetching pre-filtered interpreters for job:", job.id);
    setLoadingAISuggestions(true);
    try {
      const response = await aiMatchingService.matchJobToInterpreters(job.id, 10, true); // skipAI = true
      const responseData = response.data || response;
      
      if (response.success && responseData) {
        if (responseData.pre_filtered_interpreters) {
          console.log("✓ Found pre_filtered_interpreters:", responseData.pre_filtered_interpreters.length);
          setPreFilteredInterpreters(responseData.pre_filtered_interpreters);
        }
        toastService.success(`Found ${responseData.pre_filtered_interpreters?.length || 0} pre-filtered interpreters`);
      }
    } catch (error) {
      console.error("Error fetching pre-filtered interpreters:", error);
      toastService.error(getErrorMessage(error) || "Failed to fetch interpreters");
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Fetch AI-matched interpreters (with AI scoring)
  const handleFetchAISuggestions = async () => {
    if (!job?.id) {
      toastService.error("Job ID is required");
      return;
    }

    if (loadingAISuggestions) {
      console.log("Already loading AI suggestions, skipping...");
      return; // Prevent multiple simultaneous requests
    }

    console.log("Fetching AI suggestions for job:", job.id);
    setLoadingAISuggestions(true);
    try {
      const aiResponse = await aiMatchingService.matchJobToInterpreters(job.id, 10, false); // skipAI = false
      console.log("=== AI Response Structure ===");
      console.log("Full response:", aiResponse);
      console.log("Response keys:", Object.keys(aiResponse || {}));
      console.log("aiResponse.data:", aiResponse.data);
      console.log("aiResponse.data keys:", aiResponse.data ? Object.keys(aiResponse.data) : "no data");
      
      // Handle both response structures: {success, data} or direct data
      const responseData = aiResponse.data || aiResponse;
      
      if (aiResponse.success && responseData) {
        // Set AI-matched interpreters
        if (responseData.matched_interpreters) {
          setAiMatches(responseData.matched_interpreters);
          console.log("✓ Set AI matches:", responseData.matched_interpreters.length);
        }
        // Set pre-filtered interpreters (top 10 before AI)
        if (responseData.pre_filtered_interpreters) {
          console.log("✓ Found pre_filtered_interpreters:", responseData.pre_filtered_interpreters.length);
          console.log("✓ Pre-filtered data sample:", responseData.pre_filtered_interpreters[0]);
          setPreFilteredInterpreters(responseData.pre_filtered_interpreters);
          console.log("✓ State updated with", responseData.pre_filtered_interpreters.length, "pre-filtered interpreters");
        } else {
          console.warn("✗ No pre_filtered_interpreters in response");
          console.warn("Available keys in data:", Object.keys(responseData || {}));
          // Try alternative key names
          if (responseData.preFilteredInterpreters) {
            console.log("Found preFilteredInterpreters (camelCase)");
            setPreFilteredInterpreters(responseData.preFilteredInterpreters);
          } else if (responseData.preFiltered) {
            console.log("Found preFiltered");
            setPreFilteredInterpreters(responseData.preFiltered);
          } else {
            // Last resort: check if it's in a nested structure
            console.warn("Checking nested structures...");
            console.warn("Full responseData:", JSON.stringify(responseData, null, 2));
          }
        }
        setAiSuggestionsFetched(true);
        const matchCount = aiResponse.data.matched_interpreters?.length || 0;
        const preFilteredCount = aiResponse.data.pre_filtered_interpreters?.length || aiResponse.data.preFilteredInterpreters?.length || 0;
        toastService.success(`Found ${matchCount} AI-matched interpreters and ${preFilteredCount} pre-filtered interpreters`);
      } else {
        console.log("AI response not successful:", aiResponse);
        toastService.error("No AI suggestions available");
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toastService.error(getErrorMessage(error) || "Failed to fetch AI suggestions");
    } finally {
      setLoadingAISuggestions(false);
    }
  };

  // Fetch AI suitability score for interpreter role
  const handleFetchInterpreterScore = async () => {
    if (!job?.id || !user?.id || user?.role !== "interpreter") {
      return;
    }

    setLoadingInterpreterScore(true);
    try {
      // Get interpreter profile ID
      const interpreterRes = await interpreterService.getInterpreterById(user.id);
      const interpreter = interpreterRes?.data || interpreterRes;
      const profileId = interpreter?.interpreterProfile?.id || interpreter?.profile?.id || user.id;

      const scoreResponse = await aiMatchingService.scoreSuitability(job.id, profileId);
      if (scoreResponse.success && scoreResponse.data?.suitability_score) {
        setInterpreterSuitabilityScore(scoreResponse.data.suitability_score);
        setInterpreterScoreFetched(true);
      } else {
        toastService.error("Unable to calculate suitability score");
      }
    } catch (error) {
      console.error("Error fetching interpreter score:", error);
      toastService.error(getErrorMessage(error) || "Failed to calculate suitability score");
    } finally {
      setLoadingInterpreterScore(false);
    }
  };

  // Handle connection request
  const handleOpenConnectionModal = (interpreter) => {
    setSelectedInterpreter(interpreter);
    setConnectionMessage("");
    setConnectionModalOpen(true);
  };

  const handleCloseConnectionModal = () => {
    setConnectionModalOpen(false);
    setSelectedInterpreter(null);
    setConnectionMessage("");
  };

  const handleSendConnectionRequest = async () => {
    if (!selectedInterpreter) return;

    const interpreterId = selectedInterpreter.interpreter?.id || 
                          selectedInterpreter.id || 
                          selectedInterpreter.userId;
    
    if (!interpreterId) {
      toastService.error("Interpreter ID not found");
      return;
    }

    setSendingConnection(true);
    try {
      await notificationService.sendConnectionRequest(
        interpreterId,
        connectionMessage,
        job?.id || null,
        job?.title || null
      );
      toastService.success("Connection request sent successfully!");
      handleCloseConnectionModal();
    } catch (error) {
      console.error("Error sending connection request:", error);
      toastService.error(getErrorMessage(error) || "Failed to send connection request");
    } finally {
      setSendingConnection(false);
    }
  };

  // Fetch applications for this job if user is owner
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isJobOwner || !job?.id) {
        return;
      }

      try {
        const response = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.applications || [];

        if (response && response.success !== false) {
          setApplications(applicationsData.map((app) => normalizeApplication(app)));
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    fetchApplications();
  }, [isJobOwner, job?.id, normalizeApplication]);

  // Auto-fetch pre-filtered interpreters when job is loaded (for "All" tab)
  useEffect(() => {
    // When job loads and we're in "All" tab (default), fetch pre-filtered interpreters only (no AI)
    if (job?.id && user?.role === "client" && isJobOwner && !showAIView && preFilteredInterpreters.length === 0 && !loadingAISuggestions) {
      console.log("Auto-fetching pre-filtered interpreters for All tab on mount");
      handleFetchPreFilteredInterpreters().catch((error) => {
        console.error("Error in auto-fetch:", error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, user?.role, isJobOwner]);

  // Debug: Log when preFilteredInterpreters changes
  useEffect(() => {
    console.log("preFilteredInterpreters state changed:", preFilteredInterpreters.length, preFilteredInterpreters);
  }, [preFilteredInterpreters]);

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>
            {t("common.loading") || "Loading..."}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className={styles.errorContainer}>
          <div className={styles.error}>
            {t("common.notFound") || "Job not found"}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Notification */}
      {notification.show && (
        <div className={styles.notificationOverlay}>
          <div
            className={`${styles.notification} ${styles[notification.type]}`}
          >
            <div className={styles.notificationContent}>
              <div className={styles.notificationMessage}>
                {notification.message}
              </div>
              <button
                onClick={hideNotification}
                className={styles.notificationClose}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.jobDetailRoot}>
        {/* Job Header */}
        <div className={styles.jobHeader}>
          <div className={styles.logo}>{job.company[0]}</div>
          <div className={styles.jobInfo}>
            <div className={styles.jobTitleRow}>
              <h1 className={styles.jobTitle}>{job.title}</h1>
              {job.reviewStatus && job.reviewStatus !== "approved" && (
                <span
                  className={`${styles.reviewBadge} ${
                    job.reviewStatus === "pending"
                      ? styles.reviewPending
                      : job.reviewStatus === "rejected"
                      ? styles.reviewRejected
                      : ""
                  }`}
                >
                  {job.reviewStatus === "pending" ? (
                    <>
                      <FaClock /> {t("jobDetail.pendingReview")}
                    </>
                  ) : (
                    <>
                      <FaTimesCircle /> {t("jobDetail.rejected")}
                    </>
                  )}
                </span>
              )}
            </div>
            <p className={styles.company}>{job.company}</p>
            <div className={styles.meta}>
              <span>
                <FaMapMarkerAlt /> {job.location}
              </span>
              {job.commune && (
                <span>
                  <FaMapMarkerAlt /> {job.commune}
                </span>
              )}
              <span>
                <FaBullseye /> {job.category}
              </span>
              <span>
                <FaBriefcase /> {job.type}
              </span>
              <span>
                <FaStar /> {job.level}
              </span>
              <span>
                <FaDollarSign /> {job.salary}
              </span>
              {job.quantity > 1 && (
                <span>
                  <FaUsers /> {job.quantity} {t("jobDetail.positions")}
                </span>
              )}
              {job.expirationDate && (
                <span>
                  <FaCalendarAlt /> {t("jobDetail.expires")}:{" "}
                  {new Date(job.expirationDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {isJobOwner && (
              <button className={styles.editBtn} onClick={handleEditJob}>
                <FaEdit /> {t("jobDetail.editJob")}
              </button>
            )}
            {job.reviewNotes && (
              <div className={styles.reviewNotesBanner}>
                <strong>{t("jobDetail.reviewNotes")}:</strong> {job.reviewNotes}
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            {!isJobOwner && (
              <>
                <button className={styles.applyBtn} onClick={handleApply}>
                  {t("common.applyNow") || "Ứng tuyển ngay"}
                </button>
                <button
                  className={`${styles.saveBtn} ${
                    savedJobIds.has(job.id) ? styles.savedBtn : ""
                  }`}
                  onClick={handleSaveJob}
                  disabled={savingJobId === job.id}
                  title={
                    savedJobIds.has(job.id)
                      ? t("findJob.saveJob.unsave") || "Bỏ lưu"
                      : t("findJob.saveJob.save") || "Lưu"
                  }
                >
                  {savingJobId === job.id ? (
                    <>
                      <FaClock /> {t("common.loading") || "Đang xử lý..."}
                    </>
                  ) : savedJobIds.has(job.id) ? (
                    <>
                      <FaBookmark /> {t("findJob.saveJob.saved") || "Đã lưu"}
                    </>
                  ) : (
                    <>
                      <FaBookmark /> {t("common.save")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Job Content */}
        <div className={styles.jobContent}>
          <div className={styles.leftColumn}>
            {isJobOwner && (
              <>
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    {t("jobDetail.jobManagement")}
                  </h2>
                  <div className={styles.ownerInfo}>
                    <p>
                      <strong>{t("jobDetail.status")}:</strong>{" "}
                      {job.statusOpenStop || "open"}
                    </p>
                    <p>
                      <strong>{t("jobDetail.reviewStatus")}:</strong>{" "}
                      {job.reviewStatus || "pending"}
                    </p>
                    {job.reviewNotes && (
                      <div className={styles.reviewNotesBox}>
                        <strong>{t("jobDetail.reviewNotes")}:</strong>
                        <p>{job.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    {t("jobDetail.applications")} ({applications.length})
                  </h2>
                  {applications.length > 0 ? (
                    <AIRankedApplications
                      jobId={job?.id}
                      applications={applications}
                      onApplicationClick={handleApplicationClick}
                    />
                  ) : (
                    <div className={styles.emptyApplications}>
                      <p>{t("jobDetail.noApplications")}</p>
                    </div>
                  )}
                </div>

                {/* AI Recommended Interpreters Section - For Client Role */}
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                      {t("jobDetail.aiRecommendations") || "AI Recommended Interpreters"}
                    </h2>
                  </div>
                  
                  {/* Toggle Section */}
                  <div className={styles.toggleSection}>
                    <AIToggle
                      value={showAIView ? "ai" : "all"}
                      onChange={async (value) => {
                        console.log("Toggle onChange - value:", value, "current showAIView:", showAIView);
                        if (value === "ai") {
                          setShowAIView(true);
                          // When switching to AI tab, fetch AI-matched interpreters
                          if (!aiSuggestionsFetched && !loadingAISuggestions) {
                            console.log("Fetching AI-matched interpreters for AI tab");
                            await handleFetchAISuggestions();
                          }
                        } else {
                          setShowAIView(false);
                          // For "All" tab, fetch pre-filtered interpreters if we don't have them
                          if (preFilteredInterpreters.length === 0 && !loadingAISuggestions) {
                            console.log("Fetching pre-filtered interpreters for All tab");
                            await handleFetchPreFilteredInterpreters();
                          }
                        }
                      }}
                      loading={loadingAISuggestions}
                      disabled={loadingAISuggestions}
                    />
                  </div>

                  {/* Content based on toggle state */}
                  {showAIView ? (
                    <>
                      {loadingAISuggestions ? (
                        <div className={styles.aiLoadingState}>
                          <p>AI is analyzing and finding the best interpreters...</p>
                        </div>
                      ) : aiMatches.length > 0 ? (
                        <div className={styles.aiMatchesList}>
                          {aiMatches.map((match) => (
                            <div
                              key={match.interpreter_id || match.id}
                              className={styles.aiMatchCard}
                            >
                              <div 
                                style={{ flex: 1, cursor: "pointer" }}
                                onClick={() => {
                                  setSelectedMatchDetails(match);
                                }}
                              >
                                <div className={styles.aiMatchHeader}>
                                  <span className={styles.aiMatchName}>
                                    {match.fullName ||
                                      match.name ||
                                      match.interpreter?.fullName ||
                                      match.interpreter?.name ||
                                      match.interpreter?.user?.fullName ||
                                      match.interpreter?.user?.name ||
                                      "Interpreter"}
                                  </span>
                                  {match.suitability_score && (
                                    <SuitabilityScoreBadge
                                      score={match.suitability_score.overall_score}
                                      level={match.suitability_score.score_level}
                                      size="small"
                                    />
                                  )}
                                </div>
                                {match.suitability_score?.recommendation && (
                                  <p className={styles.aiMatchReason}>
                                    {match.suitability_score.recommendation.substring(0, 100)}
                                    {match.suitability_score.recommendation.length > 100 ? "..." : ""}
                                  </p>
                                )}
                              </div>
                              <div style={{ marginTop: "12px", width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {match.suitability_score && (
                                  <button
                                    className={styles.viewDetailsButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedMatchDetails(match);
                                    }}
                                    title={t("common.viewDetails") || "Xem phân tích chi tiết"}
                                    style={{ width: "100%" }}
                                  >
                                    <FaEye /> {t("common.viewDetails") || "Xem phân tích chi tiết"}
                                  </button>
                                )}
                                <button
                                  className={styles.connectButton}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenConnectionModal(match);
                                  }}
                                  title="Connect with this interpreter"
                                  style={{ width: "100%" }}
                                >
                                  <FaUserPlus /> Connect
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : aiSuggestionsFetched && !loadingAISuggestions ? (
                        <div className={styles.noSuggestions}>
                          <p>No AI suggestions available at this time.</p>
                        </div>
                      ) : (
                        <div className={styles.aiPrompt}>
                          <p>Toggle to AI to get AI-powered interpreter suggestions for this job.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {(() => {
                        console.log("=== Rendering All Tab ===");
                        console.log("loadingAISuggestions:", loadingAISuggestions);
                        console.log("preFilteredInterpreters.length:", preFilteredInterpreters.length);
                        console.log("preFilteredInterpreters:", preFilteredInterpreters);
                        console.log("aiSuggestionsFetched:", aiSuggestionsFetched);
                        return null;
                      })()}
                      {loadingAISuggestions ? (
                        <div className={styles.aiLoadingState}>
                          <p>Loading interpreters...</p>
                        </div>
                      ) : preFilteredInterpreters.length > 0 ? (
                        <div className={styles.aiMatchesList}>
                          <p className={styles.sectionSubtitle} style={{ marginBottom: "16px", color: "#6b7280", fontSize: "0.875rem" }}>
                            Top {preFilteredInterpreters.length} interpreters selected before AI analysis
                          </p>
                          {console.log("Rendering preFilteredInterpreters:", preFilteredInterpreters.length, preFilteredInterpreters)}
                          {preFilteredInterpreters.map((interpreter) => {
                            const profile = interpreter.interpreterProfile || interpreter;
                            // Get name from various possible locations (prioritize user.fullName)
                            const name = interpreter.user?.fullName ||
                                        interpreter.user?.name ||
                                        interpreter.fullName || 
                                        interpreter.name || 
                                        profile?.fullName || 
                                        profile?.name ||
                                        "Interpreter";
                            return (
                              <div
                                key={interpreter.id || interpreter.userId}
                                className={styles.aiMatchCard}
                              >
                                <div style={{ flex: 1 }}>
                                  <div className={styles.aiMatchHeader}>
                                    <span className={styles.aiMatchName}>{name}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                                    {profile?.experience && (
                                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                        {profile.experience} years experience
                                      </span>
                                    )}
                                    {profile?.hourlyRate && (
                                      <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                                        ${profile.hourlyRate}/hr
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ marginTop: "12px", width: "100%" }}>
                                  <button
                                    className={styles.connectButton}
                                    onClick={() => handleOpenConnectionModal(interpreter)}
                                    title="Connect with this interpreter"
                                    style={{ width: "100%" }}
                                  >
                                    <FaUserPlus /> Connect
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : aiSuggestionsFetched ? (
                        <div className={styles.aiPrompt}>
                          <p>No pre-filtered interpreters available.</p>
                        </div>
                      ) : (
                        <div className={styles.aiPrompt}>
                          <p>Click toggle to load interpreters for this job.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t("jobDetail.contactInformation")}
              </h2>
              <div className={styles.contactInfo}>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}>
                    <FaEnvelope /> {t("jobDetail.email")}:
                  </span>
                  <span className={styles.contactValue}>
                    {job.contact?.email || "N/A"}
                  </span>
                </div>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}>
                    <FaPhone /> {t("jobDetail.phone")}:
                  </span>
                  <span className={styles.contactValue}>
                    {job.contact?.phone || "N/A"}
                  </span>
                </div>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}>
                    <FaMapMarkerAlt /> {t("jobDetail.address")}:
                  </span>
                  <span className={styles.contactValue}>
                    {job.contact?.address || "N/A"}
                  </span>
                </div>
              </div>

              {(!user || (!hasPremium && !isJobOwner)) && (
                <div className={styles.premiumNotice}>
                  <p>{t("jobDetail.premiumNotice")}</p>
                  <button
                    className={styles.upgradeBtn}
                    onClick={handleUpgradeToPremium}
                  >
                    {t("jobDetail.upgradeToPremium")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t("jobDetail.jobDescription")}
              </h2>
              <p className={styles.description}>
                {job.fullDesc || job.desc || t("jobDetail.noDescription")}
              </p>
            </div>

            {job.responsibility && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("jobDetail.responsibilities")}
                </h2>
                <div
                  className={styles.description}
                  dangerouslySetInnerHTML={{
                    __html: job.responsibility.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t("jobDetail.requiredLanguages")}
              </h2>
              {job.requirements && job.requirements.length > 0 ? (
                <ul className={styles.requirementsList}>
                  {job.requirements.map((req, index) => (
                    <li key={index}>
                      <FaLanguage />{" "}
                      <strong>
                        {req.language || req.fullText?.split(" - ")[0]}
                      </strong>{" "}
                      - {t("jobDetail.level")}:{" "}
                      {req.level || req.fullText?.split(" - ")[1] || "N/A"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("jobDetail.noLanguageRequirements")}</p>
              )}
            </div>

            {job.requiredCertificates &&
              job.requiredCertificates.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    {t("jobDetail.requiredCertificates")}
                  </h2>
                  <ul className={styles.requirementsList}>
                    {job.requiredCertificates.map((cert, index) => (
                      <li key={index}>
                        <FaCertificate /> {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{t("jobDetail.benefits")}</h2>
              <ul className={styles.benefitsList}>
                {job.benefits && job.benefits.length > 0 ? (
                  job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))
                ) : (
                  <li>{t("jobDetail.benefitsDiscussed")}</li>
                )}
              </ul>
            </div>

            {job.allDomains && job.allDomains.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {t("jobDetail.domainsCategories")}
                </h2>
                <div className={styles.tags}>
                  {job.allDomains.map((domain, index) => (
                    <span key={index} className={styles.tag}>
                      <FaBullseye /> {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t("jobDetail.skillsTags")}
              </h2>
              <div className={styles.tags}>
                {job.tags && job.tags.length > 0 ? (
                  job.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span>{t("jobDetail.noTags")}</span>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {t("jobDetail.jobInformation")}
              </h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <FaBriefcase /> {t("jobDetail.workingMode")}:
                  </span>
                  <span className={styles.infoValue}>{job.type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <FaDollarSign /> {t("jobDetail.salaryType")}:
                  </span>
                  <span className={styles.infoValue}>
                    {job.salaryType === "NEGOTIABLE"
                      ? t("jobDetail.negotiable")
                      : job.salaryType === "FIXED"
                      ? t("jobDetail.fixed")
                      : t("jobDetail.range")}
                  </span>
                </div>
                {job.quantity > 1 && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      <FaUsers /> {t("jobDetail.positions")}:
                    </span>
                    <span className={styles.infoValue}>{job.quantity}</span>
                  </div>
                )}
                {job.expirationDate && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      <FaCalendarAlt /> {t("jobDetail.applicationDeadline")}:
                    </span>
                    <span className={styles.infoValue}>
                      {new Date(job.expirationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {job.createdDate && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      <FaClock /> {t("jobDetail.posted")}:
                    </span>
                    <span className={styles.infoValue}>
                      {new Date(job.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>
                    <FaCheckCircle /> {t("jobDetail.status")}:
                  </span>
                  <span className={styles.infoValue}>
                    {job.statusOpenStop === "open"
                      ? t("jobDetail.open")
                      : job.statusOpenStop === "closed"
                      ? t("jobDetail.closed")
                      : t("jobDetail.expired")}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Suitability Score Section - For Interpreter Role */}
            {user?.role === "interpreter" && (
              <div className={styles.section}>
                {loadingInterpreterScore ? (
                  <div className={styles.aiSuitabilityContent}>
                    <div className={styles.aiLoadingState}>
                      <FaSpinner className={styles.spinner} />
                      <p>AI is analyzing your profile against this job...</p>
                    </div>
                  </div>
                ) : interpreterSuitabilityScore ? (
                  <div className={styles.aiSuitabilityContent}>
                    <div className={styles.aiSuitabilityCard}>
                      <div className={styles.aiSuitabilityHeader}>
                        <SuitabilityScoreBadge
                          score={interpreterSuitabilityScore.overall_score}
                          level={interpreterSuitabilityScore.score_level}
                          size="large"
                        />
                        {interpreterSuitabilityScore.recommendation && (
                          <p className={styles.aiRecommendation}>
                            {interpreterSuitabilityScore.recommendation}
                          </p>
                        )}
                      </div>
                      <MatchReasonsCard
                        suitabilityScore={interpreterSuitabilityScore}
                        expandable={true}
                        defaultExpanded={false}
                      />
                    </div>
                  </div>
                ) : interpreterScoreFetched && !loadingInterpreterScore ? (
                  <div className={styles.aiSuitabilityContent}>
                    <div className={styles.aiErrorState}>
                      <p>Unable to calculate suitability score.</p>
                      <button
                        className={styles.aiFetchButton}
                        onClick={handleFetchInterpreterScore}
                      >
                        <FaSpinner /> Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.aiSuitabilityContent}>
                    <div className={styles.aiPromptCard}>
                      <p className={styles.aiPromptText}>
                        {t("jobDetail.aiSuitabilityPrompt") || "Click the button below to see how well your profile matches this job."}
                      </p>
                      <button
                        className={styles.aiFetchButton}
                        onClick={handleFetchInterpreterScore}
                        disabled={loadingInterpreterScore}
                      >
                        <FaUserCheck /> {t("jobDetail.checkSuitability") || "Check My Suitability"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Match Details Modal - For Client Role */}
      {selectedMatchDetails && selectedMatchDetails.suitability_score && (
        <div className={styles.matchDetailsOverlay} onClick={() => setSelectedMatchDetails(null)}>
          <div className={styles.matchDetailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.matchDetailsHeader}>
              <h2>AI Match Analysis</h2>
              <button onClick={() => setSelectedMatchDetails(null)}>×</button>
            </div>
            <div className={styles.matchDetailsContent}>
              <MatchReasonsCard
                suitabilityScore={selectedMatchDetails.suitability_score}
                expandable={false}
                defaultExpanded={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {applicationModalOpen && selectedApplication && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setApplicationModalOpen(false);
            setSelectedApplication(null);
            setSelectedResumeUrl(null);
          }}
        >
          <div className={styles.applicationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.resumeModalHeader}>
              <h2>{t("applications.modal.viewApplication") || "Application Details"}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setApplicationModalOpen(false);
                  setSelectedApplication(null);
                  setSelectedResumeUrl(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.resumeModalBody}>
              <div className={styles.applicationDetails}>
                {/* Applicant Header Card */}
                <div className={styles.applicantHeaderCard}>
                  {(() => {
                    const rawStatus =
                      typeof selectedApplication?.status === "string"
                        ? selectedApplication.status
                        : selectedApplication?.statusText;
                    const statusValue =
                      typeof rawStatus === "string"
                        ? rawStatus
                        : rawStatus
                        ? JSON.stringify(rawStatus)
                        : "pending";
                    const statusKey =
                      typeof rawStatus === "string"
                        ? rawStatus
                        : rawStatus
                        ? "custom-status"
                        : "pending";

                    return (
                      <div className={styles.applicantHeaderContent}>
                        <div className={styles.applicantAvatar}>
                          {(selectedApplication.interpreter?.fullName ||
                            selectedApplication.interpreter?.name ||
                            "U")[0].toUpperCase()}
                        </div>
                        <div className={styles.applicantInfo}>
                          <div className={styles.applicantName}>
                            {selectedApplication.interpreter?.fullName ||
                              selectedApplication.interpreter?.name ||
                              selectedApplication.interpreter?.email ||
                              "Unknown"}
                          </div>
                          <div className={styles.applicantMeta}>
                            <span className={styles.metaItem}>
                              <FaCalendarAlt className={styles.metaIcon} />
                              {new Date(
                                selectedApplication.applicationDate ||
                                  selectedApplication.createdAt
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`${styles.statusBadge} ${
                            styles[statusKey] || ""
                          }`}
                        >
                          {statusValue}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Resume Section */}
                {selectedApplication.resumeUrl && (
                  <div className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                      <FaFileAlt className={styles.cardIcon} />
                      <span className={styles.cardTitle}>
                        {t("applications.resume") || "Resume"}
                      </span>
                    </div>
                    <a
                      href={selectedApplication.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.resumeLink}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t("applications.downloadResume") ||
                        "View/Download Resume"}
                      <FaFileAlt />
                    </a>
                  </div>
                )}

                {/* Cover Letter Section */}
                {selectedApplication.coverLetter && (
                  <div className={styles.infoCard}>
                    <div className={styles.cardHeader}>
                      <FaEnvelope className={styles.cardIcon} />
                      <span className={styles.cardTitle}>
                        {t("applications.coverLetter") || "Cover Letter"}
                      </span>
                    </div>
                    <div className={styles.coverLetterContent}>
                      {typeof selectedApplication.coverLetter === "string"
                        ? selectedApplication.coverLetter
                        : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className={styles.modalActionsRow}>
                {(() => {
                  const rawStatus =
                    typeof selectedApplication?.status === "string"
                      ? selectedApplication.status
                      : selectedApplication?.statusText;
                  const statusValue =
                    typeof rawStatus === "string"
                      ? rawStatus.toLowerCase()
                      : rawStatus
                      ? String(rawStatus).toLowerCase()
                      : "pending";
                  
                  const isApproved = statusValue === "approved" || statusValue === "accepted";
                  const isRejected = statusValue === "rejected";
                  
                  return (
                    <>
                      <button
                        className={styles.rejectBtn}
                        disabled={applicationActionLoading || isRejected}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplicationAction("reject");
                        }}
                      >
                        {applicationActionLoading
                          ? t("common.loading") || "Processing..."
                          : isRejected
                          ? t("applications.rejected") || "Rejected"
                          : t("applications.reject") || "Reject"}
                      </button>
                      <button
                        className={styles.acceptBtn}
                        disabled={applicationActionLoading || isApproved}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplicationAction("accept");
                        }}
                      >
                        {applicationActionLoading
                          ? t("common.loading") || "Processing..."
                          : isApproved
                          ? t("applications.accepted") || "Accepted"
                          : t("applications.accept") || "Accept"}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume View Modal */}
      {resumeModalOpen && selectedResumeUrl && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setResumeModalOpen(false);
            setSelectedResumeUrl(null);
          }}
        >
          <div
            className={styles.resumeModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.resumeModalHeader}>
              <h2>{t("applications.modal.viewResume") || "Xem CV"}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setResumeModalOpen(false);
                  setSelectedResumeUrl(null);
                }}
              >
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
                  <FaFileAlt />{" "}
                  {t("applications.downloadResume") || "Tải xuống"}
                </a>
                <button
                  className={styles.closeResumeBtn}
                  onClick={() => {
                    setResumeModalOpen(false);
                    setSelectedResumeUrl(null);
                  }}
                >
                  {t("common.close") || "Đóng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Job Modal */}
      {applyModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setApplyModalOpen(false)}
        >
          <div
            className={styles.applicationModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setApplyModalOpen(false)}
            >
              ×
            </button>
            <div className={styles.applicationModalHeader}>
              <h2>
                {t("findJob.applicationModal.title") || "Ứng tuyển"} {job.title}
              </h2>
            </div>

            <div className={styles.applicationModalBody}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  {t("findJob.applicationModal.uploadCV") || "Upload CV"}{" "}
                  <span className={styles.required}>
                    {t("findJob.applicationModal.required") || "*"}
                  </span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                />
                {applicationData.pdfFile && (
                  <div className={styles.filePreview}>
                    {t("findJob.applicationModal.fileSelected") ||
                      "File selected:"}{" "}
                    {applicationData.pdfFile.name}
                  </div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  {t("findJob.applicationModal.introduction") ||
                    "Thư giới thiệu"}{" "}
                  <span className={styles.required}>
                    {t("findJob.applicationModal.required") || "*"}
                  </span>
                </label>
                <textarea
                  value={applicationData.introduction}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      introduction: e.target.value,
                    }))
                  }
                  placeholder={
                    t("findJob.applicationModal.introPlaceholder") ||
                    "Giới thiệu bản thân và lý do ứng tuyển..."
                  }
                  className={styles.textArea}
                  rows={5}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  {t("findJob.applicationModal.profileLink") || "Link hồ sơ"}
                </label>
                <input
                  type="url"
                  value={applicationData.profileLink}
                  onChange={(e) =>
                    setApplicationData((prev) => ({
                      ...prev,
                      profileLink: e.target.value,
                    }))
                  }
                  placeholder={
                    t("findJob.applicationModal.profilePlaceholder") ||
                    "https://..."
                  }
                  className={styles.textInput}
                />
              </div>

              <div className={styles.applicationModalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setApplyModalOpen(false)}
                  disabled={submitting}
                >
                  {t("findJob.applicationModal.cancel") || "Hủy"}
                </button>
                <button
                  className={styles.submitBtn}
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                >
                  {submitting
                    ? t("findJob.applicationModal.submitting") || "Đang gửi..."
                    : t("findJob.applicationModal.submit") || "Gửi đơn"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Request Modal */}
      {connectionModalOpen && selectedInterpreter && (
        <div className={styles.connectionModalOverlay} onClick={handleCloseConnectionModal}>
          <div className={styles.connectionModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.connectionModalHeader}>
              <h2>{t("jobDetail.connectWithInterpreter") || "Connect with Interpreter"}</h2>
              <button
                className={styles.connectionModalCloseBtn}
                onClick={handleCloseConnectionModal}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.connectionModalBody}>
              {/* Interpreter Info Section */}
              <div className={styles.interpreterInfoSection}>
                {(() => {
                  // Get interpreter data from various possible structures
                  const interpreterData = selectedInterpreter.interpreter || selectedInterpreter;
                  const userData = interpreterData?.user || interpreterData;
                  const profileData = interpreterData?.interpreterProfile || selectedInterpreter.interpreterProfile;
                  
                  const name = userData?.fullName || 
                               userData?.name ||
                               interpreterData?.fullName || 
                               interpreterData?.name ||
                               selectedInterpreter.fullName ||
                               selectedInterpreter.name ||
                               "Interpreter";
                  
                  const avatar = userData?.avatar || 
                                interpreterData?.avatar || 
                                selectedInterpreter.avatar ||
                                null;
                  
                  return (
                    <div className={styles.interpreterInfoCard}>
                      {avatar ? (
                        <img 
                          src={avatar} 
                          alt={name}
                          className={styles.interpreterAvatar}
                        />
                      ) : (
                        <div className={styles.interpreterAvatarPlaceholder}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={styles.interpreterInfoDetails}>
                        <h3 className={styles.interpreterName}>{name}</h3>
                        {profileData?.rating && (
                          <div className={styles.interpreterRating}>
                            <FaStar style={{ color: "#fbbf24", fontSize: "0.875rem" }} />
                            <span>{parseFloat(profileData.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Message Field */}
              <div className={styles.connectionFormField}>
                <label className={styles.connectionFieldLabel}>
                  {t("jobDetail.message") || "Message"} <span style={{ color: "#9ca3af", fontWeight: "normal" }}>({t("common.optional") || "Optional"})</span>
                </label>
                <textarea
                  value={connectionMessage}
                  onChange={(e) => setConnectionMessage(e.target.value)}
                  placeholder={t("jobDetail.connectionMessagePlaceholder") || "Add a personal message to your connection request..."}
                  rows={5}
                  className={styles.connectionMessageInput}
                />
              </div>
            </div>
            <div className={styles.connectionModalActions}>
              <button
                className={styles.connectionCancelBtn}
                onClick={handleCloseConnectionModal}
                disabled={sendingConnection}
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                className={styles.connectionSubmitBtn}
                onClick={handleSendConnectionRequest}
                disabled={sendingConnection}
              >
                {sendingConnection ? (
                  <>
                    <FaSpinner className={styles.spinner} /> {t("common.sending") || "Sending..."}
                  </>
                ) : (
                  <>
                    <FaEnvelope /> {t("jobDetail.sendRequest") || "Send Request"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
