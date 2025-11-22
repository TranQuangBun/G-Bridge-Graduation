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
            category: jobData.domains?.[0]?.domain?.name || jobData.domains?.[0]?.name || "General",
            allDomains: jobData.domains?.map((d) => d.domain?.name || d.name || "").filter(Boolean) || [],
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
              ...(jobData.requiredLanguages?.map((rl) => rl.language?.name || "") || []),
              ...(jobData.domains?.map((d) => d.domain?.name || d.name || "") || []),
            ].filter(Boolean),
            desc: jobData.descriptions || "",
            fullDesc: jobData.descriptions || "",
            responsibility: jobData.responsibility || "",
            requirements: jobData.requiredLanguages?.map((rl) => ({
              language: rl.language?.name || "",
              level: rl.level?.name || "",
              fullText: `${rl.language?.name || ""} - ${rl.level?.name || ""}`,
            })) || [],
            requiredCertificates: jobData.requiredCertificates?.map((rc) => rc.certificate?.name || "").filter(Boolean) || [],
            benefits: jobData.benefits ? (Array.isArray(jobData.benefits) ? jobData.benefits : [jobData.benefits]) : [],
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
        
        if (response && (response.success !== false) && Array.isArray(savedJobsData)) {
          const savedIds = new Set(
            savedJobsData.map((saved) => saved.job?.id || saved.id).filter(Boolean)
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
        t("findJob.errors.loginRequired") || "Vui lòng đăng nhập để lưu việc làm",
        "error"
      );
      return;
    }

    try {
      setSavingJobId(job.id);
      const currentlySaved = savedJobIds.has(job.id);
      
      const response = await jobService.toggleSaveJob(job.id);
      
      if (response && response.success !== false) {
        const isSaved = response.data?.isSaved ?? response.isSaved ?? !currentlySaved;
        
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
            ? (t("findJob.saveJob.saved") || "Đã lưu việc làm")
            : (t("findJob.saveJob.unsaved") || "Đã bỏ lưu việc làm"),
          "success"
        );
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showNotification(
        error.message || (t("findJob.errors.saveFailed") || "Không thể lưu việc làm"),
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
    navigate(ROUTES.APPLY_JOB.replace(':id', job.id));
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
        showNotification("Application accepted successfully", "success");
        // Refresh applications
        const appsResponse = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(appsResponse.data) 
          ? appsResponse.data 
          : appsResponse.data?.applications || [];
        setApplications(applicationsData);
      }
    } catch (error) {
      showNotification(error.message || "Error accepting application", "error");
    }
  }

  async function handleRejectApplication(applicationId) {
    try {
      const response = await jobService.rejectApplication(applicationId);
      if (response?.success) {
        showNotification("Application rejected successfully", "success");
        // Refresh applications
        const appsResponse = await jobService.getJobApplications(job.id);
        const applicationsData = Array.isArray(appsResponse.data) 
          ? appsResponse.data 
          : appsResponse.data?.applications || [];
        setApplications(applicationsData);
      }
    } catch (error) {
      showNotification(error.message || "Error rejecting application", "error");
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
        
        if (response && (response.success !== false)) {
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
          <div className={styles.loading}>{t("common.loading") || "Loading..."}</div>
        </div>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <div className={styles.errorContainer}>
          <div className={styles.error}>{t("common.notFound") || "Job not found"}</div>
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
            className={`${styles.notification} ${
              styles[notification.type]
            }`}
          >
            <div className={styles.notificationContent}>
              <div className={styles.notificationMessage}>
                {notification.message}
              </div>
              <button onClick={hideNotification} className={styles.notificationClose}>
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
                <span className={`${styles.reviewBadge} ${
                  job.reviewStatus === "pending" ? styles.reviewPending :
                  job.reviewStatus === "rejected" ? styles.reviewRejected : ""
                }`}>
                  {job.reviewStatus === "pending" ? (
                    <><FaClock /> Pending Review</>
                  ) : (
                    <><FaTimesCircle /> Rejected</>
                  )}
                </span>
              )}
            </div>
            <p className={styles.company}>{job.company}</p>
            <div className={styles.meta}>
              <span><FaMapMarkerAlt /> {job.location}</span>
              {job.commune && <span><FaMapMarkerAlt /> {job.commune}</span>}
              <span><FaBullseye /> {job.category}</span>
              <span><FaBriefcase /> {job.type}</span>
              <span><FaStar /> {job.level}</span>
              <span><FaDollarSign /> {job.salary}</span>
              {job.quantity > 1 && <span><FaUsers /> {job.quantity} positions</span>}
              {job.expirationDate && (
                <span><FaCalendarAlt /> Expires: {new Date(job.expirationDate).toLocaleDateString()}</span>
              )}
            </div>
            {job.reviewNotes && (
              <div className={styles.reviewNotesBanner}>
                <strong>Review Notes:</strong> {job.reviewNotes}
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            {isJobOwner ? (
              <>
                <button
                  className={styles.editBtn}
                  onClick={handleEditJob}
                >
                  <FaEdit /> Edit Job
                </button>
                <button
                  className={styles.backBtn}
                  onClick={handleBackToMyJobs}
                >
                  <FaArrowLeft /> Back to My Jobs
                </button>
              </>
            ) : (
              <>
                <button
                  className={styles.applyBtn}
                  onClick={handleApply}
                >
                  {t("common.applyNow") || "Ứng tuyển ngay"}
                </button>
                <button 
                  className={`${styles.saveBtn} ${savedJobIds.has(job.id) ? styles.savedBtn : ""}`}
                  onClick={handleSaveJob}
                  disabled={savingJobId === job.id}
                  title={savedJobIds.has(job.id) ? (t("findJob.saveJob.unsave") || "Bỏ lưu") : (t("findJob.saveJob.save") || "Lưu")}
                >
                  {savingJobId === job.id ? (
                    <><FaClock /> {t("common.loading") || "Đang xử lý..."}</>
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
                  <h2 className={styles.sectionTitle}>Job Management</h2>
                  <div className={styles.ownerInfo}>
                    <p><strong>Status:</strong> {job.statusOpenStop || "open"}</p>
                    <p><strong>Review Status:</strong> {job.reviewStatus || "pending"}</p>
                    {job.reviewNotes && (
                      <div className={styles.reviewNotesBox}>
                        <strong>Review Notes:</strong>
                        <p>{job.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>
                    Applications ({applications.length})
                  </h2>
                  {loadingApplications ? (
                    <div className={styles.loading}>Loading applications...</div>
                  ) : applications.length > 0 ? (
                    <div className={styles.applicationsList}>
                      {applications.map((app) => (
                        <div key={app.id} className={styles.applicationCard}>
                          <div className={styles.applicationHeader}>
                            <div className={styles.applicationInfo}>
                              <div className={styles.applicationName}>
                                <FaUser /> {app.interpreter?.fullName || app.interpreter?.email || "Interpreter"}
                              </div>
                              <div className={styles.applicationDate}>
                                Applied: {new Date(app.applicationDate || app.appliedAt || app.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className={`${styles.applicationStatus} ${
                              app.status === "accepted" ? styles.statusAccepted :
                              app.status === "rejected" ? styles.statusRejected :
                              styles.statusPending
                            }`}>
                              {app.status === "accepted" ? (
                                <><FaCheckCircle /> Accepted</>
                              ) : app.status === "rejected" ? (
                                <><FaTimesCircle /> Rejected</>
                              ) : (
                                <><FaClock /> Pending</>
                              )}
                            </div>
                          </div>
                          {app.coverLetter && (
                            <div className={styles.applicationCoverLetter}>
                              <strong>Cover Letter:</strong>
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
                                <FaCheck /> Accept
                              </button>
                              <button
                                className={styles.rejectBtn}
                                onClick={() => handleRejectApplication(app.id)}
                              >
                                <FaTimes /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyApplications}>
                      <p>No applications yet</p>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Information</h2>
              <div className={styles.contactInfo}>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}><FaEnvelope /> Email:</span>
                  <span className={styles.contactValue}>
                    {job.contact?.email || "N/A"}
                  </span>
                </div>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}><FaPhone /> Phone:</span>
                  <span className={styles.contactValue}>
                    {job.contact?.phone || "N/A"}
                  </span>
                </div>
                <div
                  className={`${styles.contactItem} ${
                    !user || (!hasPremium && !isJobOwner) ? styles.blurred : ""
                  }`}
                >
                  <span className={styles.contactLabel}><FaMapMarkerAlt /> Address:</span>
                  <span className={styles.contactValue}>
                    {job.contact?.address || "N/A"}
                  </span>
                </div>
              </div>

              {(!user || (!hasPremium && !isJobOwner)) && (
                <div className={styles.premiumNotice}>
                  <p>
                    🔒 Contact information is only available for premium members.
                  </p>
                  <button
                    className={styles.upgradeBtn}
                    onClick={handleUpgradeToPremium}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Job Description</h2>
              <p className={styles.description}>{job.fullDesc || job.desc || "No description available"}</p>
            </div>

            {job.responsibility && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Responsibilities</h2>
                <div className={styles.description} dangerouslySetInnerHTML={{ __html: job.responsibility.replace(/\n/g, '<br />') }} />
              </div>
            )}

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Required Languages</h2>
              {job.requirements && job.requirements.length > 0 ? (
                <ul className={styles.requirementsList}>
                  {job.requirements.map((req, index) => (
                    <li key={index}>
                      <FaLanguage /> <strong>{req.language || req.fullText?.split(' - ')[0]}</strong> - Level: {req.level || req.fullText?.split(' - ')[1] || "N/A"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No specific language requirements listed</p>
              )}
            </div>

            {job.requiredCertificates && job.requiredCertificates.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Required Certificates</h2>
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
              <h2 className={styles.sectionTitle}>Benefits</h2>
              <ul className={styles.benefitsList}>
                {job.benefits && job.benefits.length > 0 ? (
                  job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))
                ) : (
                  <li>Benefits to be discussed</li>
                )}
              </ul>
            </div>

            {job.allDomains && job.allDomains.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Domains / Categories</h2>
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
              <h2 className={styles.sectionTitle}>Skills & Tags</h2>
              <div className={styles.tags}>
                {job.tags && job.tags.length > 0 ? (
                  job.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span>No tags available</span>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Job Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}><FaBriefcase /> Working Mode:</span>
                  <span className={styles.infoValue}>{job.type}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}><FaDollarSign /> Salary Type:</span>
                  <span className={styles.infoValue}>{job.salaryType === "NEGOTIABLE" ? "Negotiable" : job.salaryType === "FIXED" ? "Fixed" : "Range"}</span>
                </div>
                {job.quantity > 1 && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}><FaUsers /> Positions:</span>
                    <span className={styles.infoValue}>{job.quantity}</span>
                  </div>
                )}
                {job.expirationDate && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}><FaCalendarAlt /> Application Deadline:</span>
                    <span className={styles.infoValue}>{new Date(job.expirationDate).toLocaleDateString()}</span>
                  </div>
                )}
                {job.createdDate && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}><FaClock /> Posted:</span>
                    <span className={styles.infoValue}>{new Date(job.createdDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}><FaCheckCircle /> Status:</span>
                  <span className={styles.infoValue}>{job.statusOpenStop === "open" ? "Open" : job.statusOpenStop === "closed" ? "Closed" : "Expired"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume View Modal */}
      {resumeModalOpen && selectedResumeUrl && (
        <div className={styles.modalOverlay} onClick={() => {
          setResumeModalOpen(false);
          setSelectedResumeUrl(null);
        }}>
          <div className={styles.resumeModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.resumeModalHeader}>
              <h2>{t("applications.modal.viewResume") || "Xem CV"}</h2>
              <button className={styles.closeBtn} onClick={() => {
                setResumeModalOpen(false);
                setSelectedResumeUrl(null);
              }}>
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
                  <FaFileAlt /> {t("applications.downloadResume") || "Tải xuống"}
                </a>
                <button className={styles.closeResumeBtn} onClick={() => {
                  setResumeModalOpen(false);
                  setSelectedResumeUrl(null);
                }}>
                  {t("common.close") || "Đóng"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

