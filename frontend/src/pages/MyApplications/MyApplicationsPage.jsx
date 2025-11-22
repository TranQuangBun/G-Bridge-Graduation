import React, { useState, useEffect } from "react";
import styles from "./MyApplicationsPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService.js";
import { 
  FaBuilding, 
  FaChartBar,
  FaClipboardList,
  FaHeart,
  FaBell,
  FaUser,
  FaCog,
  FaBriefcase,
  FaFileAlt
} from "react-icons/fa";

// Unused mock data - kept for reference
/* const MOCK_APPLICATIONS = [
  {
    id: 1,
    company: "GlobalSpeak",
    logo: FaBuilding,
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
    logo: FaHospital,
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
    logo: FaGraduationCap,
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
    logo: FaLaptop,
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
    logo: FaBalanceScale,
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
]; */

// Sidebar menu for Interpreter role
const INTERPRETER_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "applications", icon: FaClipboardList, labelKey: "applications", active: true },
  { id: "favorites", icon: FaHeart, labelKey: "favorites", active: false },
  { id: "alerts", icon: FaBell, labelKey: "alerts", active: false },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

// Sidebar menu for Client/Company role
const CLIENT_SIDEBAR_MENU = [
  { id: "overview", icon: FaChartBar, labelKey: "overview", active: false },
  { id: "myJobs", icon: FaBriefcase, labelKey: "myJobs", active: false },
  { id: "jobApplications", icon: FaClipboardList, labelKey: "jobApplications", active: true },
  { id: "profile", icon: FaUser, labelKey: "profile", active: false },
  { id: "settings", icon: FaCog, labelKey: "settings", active: false },
];

function MyApplicationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("applications");
  
  // Get sidebar menu based on user role
  const SIDEBAR_MENU = user?.role === "client" ? CLIENT_SIDEBAR_MENU : INTERPRETER_SIDEBAR_MENU;
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  // const [loading, setLoading] = useState(true); // Reserved for future use
  const [processingApplication, setProcessingApplication] = useState(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);

  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // setLoading(true); // Reserved for future use
        const response = await jobService.getMyApplications();
        
        // Handle response from sendPaginated (data is array directly)
        const applicationsData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.applications || [];
        
        if (applicationsData.length > 0 || (response && response.success !== false)) {
          const transformedApps = applicationsData.map((app) => {
            // For client: show interpreter info, for interpreter: show job info
            const isClient = user?.role === "client";
            
            return {
              id: app.id,
              company: isClient 
                ? (app.interpreter?.fullName || app.interpreter?.email || "Interpreter")
                : (app.job?.organization?.name || "Company"),
              logo: isClient 
                ? FaUser 
                : (app.job?.organization?.logo || FaBuilding),
              position: isClient
                ? (app.job?.title || "Job Position")
                : (app.job?.title || "Position"),
              jobType: app.job?.workingMode?.name || "Full-time",
              workType: app.job?.workingMode?.name || "Remote",
              location: app.job?.province || app.job?.address || "Location TBD",
              salary:
                app.job?.minSalary && app.job?.maxSalary
                  ? `$${app.job.minSalary}-${app.job.maxSalary}`
                  : app.job?.minSalary
                  ? `$${app.job.minSalary}+`
                  : "Negotiable",
              dateApplied: app.applicationDate || app.createdAt || new Date().toISOString(),
              status: app.status || "pending",
              description: isClient
                ? (app.coverLetter || app.job?.descriptions || "")
                : (app.job?.descriptions || ""),
              requirements: app.job?.requiredLanguages?.map((rl) => `${rl.language?.name || ""} - ${rl.level?.name || ""}`).filter(Boolean) || [],
              // Additional fields for client view
              interpreter: app.interpreter || null,
              coverLetter: app.coverLetter || "",
              resumeUrl: app.resumeUrl || "",
            };
          });
          setApplications(transformedApps);
        } else {
          setApplications([]);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
        setApplications([]);
      } finally {
        // setLoading(false); // Reserved for future use
      }
    };

    fetchApplications();
  }, [user]);

  const handleAcceptApplication = async (applicationId) => {
    if (!user || user.role !== "client") return;
    
    try {
      setProcessingApplication(applicationId);
      await jobService.acceptApplication(applicationId);
      
      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: "approved" }
            : app
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
      alert(t("applications.modal.accept") + " thành công!");
    } catch (error) {
      console.error("Error accepting application:", error);
      alert("Lỗi: " + (error.message || "Không thể chấp nhận đơn ứng tuyển"));
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!user || user.role !== "client") return;
    
    const reviewNotes = prompt("Nhập lý do từ chối (tùy chọn):");
    if (reviewNotes === null) return; // User cancelled
    
    try {
      setProcessingApplication(applicationId);
      await jobService.rejectApplication(applicationId, reviewNotes);
      
      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, status: "rejected" }
            : app
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
      alert(t("applications.modal.reject") + " thành công!");
    } catch (error) {
      console.error("Error rejecting application:", error);
      alert("Lỗi: " + (error.message || "Không thể từ chối đơn ứng tuyển"));
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

  const filteredApplications = applications.filter(
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

  const openResumeModal = (resumeUrl) => {
    setSelectedResumeUrl(resumeUrl);
    setResumeModalOpen(true);
  };

  const closeResumeModal = () => {
    setResumeModalOpen(false);
    setSelectedResumeUrl(null);
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
                    } else if (item.id === "favorites") {
                      navigate(ROUTES.SAVED_JOBS);
                    } else if (item.id === "myJobs") {
                      navigate(ROUTES.MY_JOBS);
                    } else if (item.id === "jobApplications") {
                      navigate(ROUTES.MY_APPLICATIONS);
                    } else if (item.id === "alerts") {
                      navigate(ROUTES.JOB_ALERTS);
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
                ? "Xem và quản lý các đơn ứng tuyển cho công việc của bạn"
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
                            {isClient ? application.company : application.company}
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
                              <strong>{t("applications.modal.coverLetter")}:</strong>
                              <p>{application.coverLetter.substring(0, 100)}...</p>
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
                          <div className={styles.salary}>{application.salary}</div>
                        </>
                      )}
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
                      {isClient ? (
                        <>
                          {application.resumeUrl ? (
                            <button
                              onClick={() => openResumeModal(application.resumeUrl)}
                              className={styles.viewResumeBtn}
                            >
                              <FaFileAlt /> {t("applications.modal.viewResume") || "Xem CV"}
                            </button>
                          ) : (
                            <span className={styles.noResumeText}>
                              <FaFileAlt /> {t("applications.noResume") || "Chưa có CV"}
                            </span>
                          )}
                        </>
                      ) : (
                        <button className={styles.withdrawBtn}>
                          {t("applications.withdraw")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredApplications.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <h3>{t("applications.noApplications")}</h3>
                <p>
                  {user?.role === "client"
                    ? "Chưa có đơn ứng tuyển nào cho công việc của bạn."
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
                          onClick={() => openResumeModal(selectedApplication.resumeUrl)}
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
                  </>
                )}
              </div>

              <div className={styles.modalActions}>
                {user?.role === "client" ? (
                  <>
                    {selectedApplication.resumeUrl && (
                      <button
                        onClick={() => openResumeModal(selectedApplication.resumeUrl)}
                        className={styles.viewResumeModalBtn}
                      >
                        {t("applications.modal.viewResume")}
                      </button>
                    )}
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleAcceptApplication(selectedApplication.id)}
                      disabled={
                        processingApplication === selectedApplication.id ||
                        selectedApplication.status === "approved" ||
                        selectedApplication.status === "rejected"
                      }
                    >
                      {processingApplication === selectedApplication.id
                        ? "Đang xử lý..."
                        : selectedApplication.status === "approved"
                        ? "Đã chấp nhận"
                        : t("applications.modal.accept")}
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleRejectApplication(selectedApplication.id)}
                      disabled={
                        processingApplication === selectedApplication.id ||
                        selectedApplication.status === "approved" ||
                        selectedApplication.status === "rejected"
                      }
                    >
                      {processingApplication === selectedApplication.id
                        ? "Đang xử lý..."
                        : selectedApplication.status === "rejected"
                        ? "Đã từ chối"
                        : t("applications.modal.reject")}
                    </button>
                    <button className={styles.contactBtn}>
                      {t("applications.modal.contactApplicant")}
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.contactBtn}>
                      {t("applications.modal.contactCompany")}
                    </button>
                    <button className={styles.withdrawModalBtn}>
                      {t("applications.modal.withdraw")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resume View Modal */}
        {resumeModalOpen && selectedResumeUrl && (
          <div className={styles.modalOverlay} onClick={closeResumeModal}>
            <div className={styles.resumeModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.resumeModalHeader}>
                <h2>{t("applications.modal.viewResume") || "Xem CV"}</h2>
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
                    <FaFileAlt /> {t("applications.downloadResume") || "Tải xuống"}
                  </a>
                  <button className={styles.closeResumeBtn} onClick={closeResumeModal}>
                    {t("common.close") || "Đóng"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default MyApplicationsPage;
