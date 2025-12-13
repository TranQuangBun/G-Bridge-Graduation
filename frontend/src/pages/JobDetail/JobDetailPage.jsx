import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants/enums";
import jobService from "../../services/jobService.js";
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
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaCalendarAlt,
  FaCertificate,
  FaLanguage,
  FaCheckCircle,
  FaEdit,
  FaUser,
  FaCheck,
  FaTimes,
  FaFileAlt,
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
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applicationData, setApplicationData] = useState({
    pdfFile: null,
    introduction: "",
    profileLink: "",
  });

  const hasPremium = user?.isPremium || false;

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
              "General",
            allDomains:
              jobData.domains
                ?.map((d) => d.domain?.name || d.name || "")
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
              ...(jobData.domains?.map((d) => d.domain?.name || d.name || "") ||
                []),
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
            ? t("findJob.saveJob.saved") || "Đã lưu việc làm"
            : t("findJob.saveJob.unsaved") || "Đã bỏ lưu việc làm",
          "success"
        );
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showNotification(
        error.message ||
          t("findJob.errors.saveFailed") ||
          "Không thể lưu việc làm",
        "error"
      );
    } finally {
      setSavingJobId(null);
    }
  }

  function handleApply() {
    if (!isAuthenticated || !user) {
      showNotification(
        t("findJob.errors.loginRequired") || "Vui lòng đăng nhập để ứng tuyển",
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
        t("findJob.applicationModal.pdfOnlyError") || "Chỉ chấp nhận file PDF",
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
          "Vui lòng điền đầy đủ thông tin",
        "error"
      );
      return;
    }

    if (!applicationData.pdfFile) {
      showNotification(
        t("findJob.applicationModal.missingCV") || "Vui lòng upload CV",
        "error"
      );
      return;
    }

    if (!applicationData.introduction.trim()) {
      showNotification(
        t("findJob.applicationModal.missingIntro") ||
          "Vui lòng nhập giới thiệu",
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
            "Ứng tuyển thành công!",
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
          response.message || "Có lỗi xảy ra khi ứng tuyển",
          "error"
        );
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification(
        error.message ||
          t("findJob.applicationModal.errorMessage") ||
          "Không thể gửi đơn ứng tuyển",
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

  function handleBackToMyJobs() {
    navigate(ROUTES.MY_JOBS);
  }

  async function handleAcceptApplication(applicationId) {
    try {
      const response = await jobService.acceptApplication(applicationId);
      if (response?.success) {
        showNotification(t("jobDetail.acceptSuccess"), "success");
        // Refresh applications
        const appsResponse = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(appsResponse.data)
          ? appsResponse.data
          : appsResponse.data?.applications || [];
        setApplications(applicationsData);
      }
    } catch (error) {
      showNotification(error.message || t("jobDetail.acceptError"), "error");
    }
  }

  async function handleRejectApplication(applicationId) {
    try {
      const response = await jobService.rejectApplication(applicationId);
      if (response?.success) {
        showNotification(t("jobDetail.rejectSuccess"), "success");
        // Refresh applications
        const appsResponse = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(appsResponse.data)
          ? appsResponse.data
          : appsResponse.data?.applications || [];
        setApplications(applicationsData);
      }
    } catch (error) {
      showNotification(error.message || t("jobDetail.rejectError"), "error");
    }
  }

  // Check if current user is the owner of this job
  const isJobOwner = user?.role === "client" && job?.ownerUserId === user?.id;

  // Fetch applications for this job if user is owner
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isJobOwner || !job?.id) {
        return;
      }

      try {
        setLoadingApplications(true);
        const response = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(response.data)
          ? response.data
          : response.data?.applications || [];

        if (response && response.success !== false) {
          setApplications(applicationsData);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [isJobOwner, job?.id]);

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
        {/* Back Button */}
        <button
          className={styles.backBtn}
          onClick={() => {
            if (isJobOwner) {
              navigate(ROUTES.MY_JOBS);
            } else {
              navigate(ROUTES.FIND_JOB);
            }
          }}
        >
          <FaArrowLeft /> {t("common.back") || "Quay lại"}
        </button>

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
            {job.reviewNotes && (
              <div className={styles.reviewNotesBanner}>
                <strong>{t("jobDetail.reviewNotes")}:</strong> {job.reviewNotes}
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            {isJobOwner ? (
              <>
                <button className={styles.editBtn} onClick={handleEditJob}>
                  <FaEdit /> {t("jobDetail.editJob")}
                </button>
                <button className={styles.backBtn} onClick={handleBackToMyJobs}>
                  <FaArrowLeft /> {t("jobDetail.backToMyJobs")}
                </button>
              </>
            ) : (
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
                  {loadingApplications ? (
                    <div className={styles.loading}>
                      {t("jobDetail.loadingApplications")}
                    </div>
                  ) : applications.length > 0 ? (
                    <div className={styles.applicationsList}>
                      {applications.map((app) => (
                        <div key={app.id} className={styles.applicationCard}>
                          <div className={styles.applicationHeader}>
                            <div className={styles.applicationInfo}>
                              <div className={styles.applicationName}>
                                <FaUser />{" "}
                                {app.interpreter?.fullName ||
                                  app.interpreter?.email ||
                                  "Interpreter"}
                              </div>
                              <div className={styles.applicationDate}>
                                {t("jobDetail.applied")}:{" "}
                                {new Date(
                                  app.applicationDate ||
                                    app.appliedAt ||
                                    app.createdAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div
                              className={`${styles.applicationStatus} ${
                                app.status === "accepted"
                                  ? styles.statusAccepted
                                  : app.status === "rejected"
                                  ? styles.statusRejected
                                  : styles.statusPending
                              }`}
                            >
                              {app.status === "accepted" ? (
                                <>
                                  <FaCheckCircle /> {t("jobDetail.accepted")}
                                </>
                              ) : app.status === "rejected" ? (
                                <>
                                  <FaTimesCircle /> {t("jobDetail.rejected")}
                                </>
                              ) : (
                                <>
                                  <FaClock /> {t("jobDetail.pending")}
                                </>
                              )}
                            </div>
                          </div>
                          {app.coverLetter && (
                            <div className={styles.applicationCoverLetter}>
                              <strong>{t("jobDetail.coverLetter")}:</strong>
                              <p>{app.coverLetter}</p>
                            </div>
                          )}
                          <div className={styles.applicationResume}>
                            <FaFileAlt />
                            {app.resumeUrl ? (
                              <button
                                onClick={() => {
                                  setSelectedResumeUrl(app.resumeUrl);
                                  setResumeModalOpen(true);
                                }}
                                className={styles.resumeLink}
                              >
                                {t("applications.modal.viewResume") || "Xem CV"}
                              </button>
                            ) : (
                              <span className={styles.noResumeText}>
                                {t("applications.noResume") || "Chưa có CV"}
                              </span>
                            )}
                          </div>
                          {app.status === "pending" && (
                            <div className={styles.applicationActions}>
                              <button
                                className={styles.acceptBtn}
                                onClick={() => handleAcceptApplication(app.id)}
                              >
                                <FaCheck /> {t("jobDetail.accept")}
                              </button>
                              <button
                                className={styles.rejectBtn}
                                onClick={() => handleRejectApplication(app.id)}
                              >
                                <FaTimes /> {t("jobDetail.reject")}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyApplications}>
                      <p>{t("jobDetail.noApplications")}</p>
                    </div>
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
          </div>
        </div>
      </div>

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
                    📄{" "}
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
    </MainLayout>
  );
}
