import React, { useState } from "react";
import styles from "./CompanyDashboardPage.module.css";
import { MainLayout } from "../../../layouts";
import { useLanguage } from "../../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";

// Mock data for company dashboard
const MOCK_COMPANY_STATS = {
  activeJobs: 8,
  applicationsReceived: 47,
  interviewsScheduled: 12,
  hiredInterpreters: 5,
};

const MOCK_RECENT_APPLICATIONS = [
  {
    id: 1,
    jobTitle: "Medical Interpreter - Emergency Services",
    applicantName: "Nguyễn Minh Anh",
    avatar: "/src/assets/images/avatar/minhanh.png",
    languages: ["Vietnamese", "English", "Japanese"],
    experience: "8 years",
    rating: 4.9,
    appliedDate: "2025-09-20",
    status: "pending",
    applicationLetter:
      "I am very interested in this medical interpreter position...",
    hourlyRate: "$55",
  },
  {
    id: 2,
    jobTitle: "Business Conference Interpreter",
    applicantName: "David Wilson",
    avatar: "/src/assets/images/avatar/nam.png",
    languages: ["English", "Vietnamese", "Mandarin"],
    experience: "6 years",
    rating: 4.7,
    appliedDate: "2025-09-19",
    status: "interview_scheduled",
    applicationLetter:
      "With my extensive business interpretation experience...",
    hourlyRate: "$45",
  },
  {
    id: 3,
    jobTitle: "Legal Document Translator",
    applicantName: "Trần Thị Hương",
    avatar: "/src/assets/images/avatar/huonng.png",
    languages: ["Vietnamese", "English", "French"],
    experience: "10 years",
    rating: 4.8,
    appliedDate: "2025-09-18",
    status: "accepted",
    applicationLetter: "I specialize in legal translation and have worked...",
    hourlyRate: "$60",
  },
  {
    id: 4,
    jobTitle: "Technical Interpreter - IT Sector",
    applicantName: "Kim Min-jun",
    avatar: "/src/assets/images/avatar/nam.png",
    languages: ["Korean", "English", "Vietnamese"],
    experience: "7 years",
    rating: 4.6,
    appliedDate: "2025-09-17",
    status: "rejected",
    applicationLetter: "My technical background in IT makes me perfect...",
    hourlyRate: "$40",
  },
];

const MOCK_ACTIVE_JOBS = [
  {
    id: 1,
    title: "Medical Interpreter - Emergency Services",
    type: "Full-time",
    location: "Ho Chi Minh City",
    salary: "$50-70/hour",
    postedDate: "2025-09-15",
    applicationsCount: 12,
    status: "active",
    description:
      "Seeking experienced medical interpreter for emergency services...",
    deadline: "2025-09-30",
  },
  {
    id: 2,
    title: "Business Conference Interpreter",
    type: "Contract",
    location: "Hanoi",
    salary: "$40-60/hour",
    postedDate: "2025-09-12",
    applicationsCount: 8,
    status: "active",
    description: "International business conference interpreter needed...",
    deadline: "2025-09-25",
  },
  {
    id: 3,
    title: "Legal Document Translator",
    type: "Part-time",
    location: "Remote",
    salary: "$45-65/hour",
    postedDate: "2025-09-10",
    applicationsCount: 15,
    status: "active",
    description: "Legal document translation for international law firm...",
    deadline: "2025-09-28",
  },
];

const SIDEBAR_MENU = [
  { id: "overview", icon: "📊", labelKey: "overview", active: true },
  { id: "job_posts", icon: "💼", labelKey: "jobPosts", active: false },
  { id: "applications", icon: "📋", labelKey: "applications", active: false },
  {
    id: "find_interpreters",
    icon: "🔍",
    labelKey: "findInterpreters",
    active: false,
  },
  { id: "interviews", icon: "🗣️", labelKey: "interviews", active: false },
  { id: "hired", icon: "✅", labelKey: "hired", active: false },
  { id: "profile", icon: "🏢", labelKey: "companyProfile", active: false },
  { id: "settings", icon: "⚙️", labelKey: "settings", active: false },
];

function CompanyDashboardPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("overview");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [companyName] = useState("GlobalSpeak Solutions"); // Mock company name

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
      case "pending":
        return styles.statusPending;
      case "interview_scheduled":
        return styles.statusInterview;
      case "accepted":
        return styles.statusAccepted;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Under Review";
      case "interview_scheduled":
        return "Interview Scheduled";
      case "accepted":
        return "Hired";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
  };

  const handleApplicationAction = (applicationId, action) => {
    console.log(`${action} application ${applicationId}`);
    // Here you would update the application status
    setSelectedApplication(null);
  };

  const closeModal = () => {
    setSelectedApplication(null);
  };

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Company Dashboard</h2>
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
                  if (item.id === "find_interpreters") {
                    navigate("/company/find-interpreter");
                  } else if (item.id === "job_posts") {
                    navigate("/company/job-post");
                  }
                  // Add other navigation logic for other menu items
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.labelKey}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Header */}
          <header className={styles.contentHeader}>
            <h1 className={styles.greeting}>Welcome back, {companyName}!</h1>
            <p className={styles.subGreeting}>
              Here's what's happening with your recruitment today.
            </p>
          </header>

          {/* Summary Stats */}
          <section className={styles.summarySection}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💼</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_COMPANY_STATS.activeJobs}
                  </div>
                  <div className={styles.statLabel}>Active Job Posts</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_COMPANY_STATS.applicationsReceived}
                  </div>
                  <div className={styles.statLabel}>Applications Received</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🗣️</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_COMPANY_STATS.interviewsScheduled}
                  </div>
                  <div className={styles.statLabel}>Interviews Scheduled</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <div className={styles.statNumber}>
                    {MOCK_COMPANY_STATS.hiredInterpreters}
                  </div>
                  <div className={styles.statLabel}>Interpreters Hired</div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className={styles.actionsSection}>
            <div className={styles.actionsGrid}>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/company/job-post")}
              >
                <span className={styles.actionIcon}>📝</span>
                <span className={styles.actionText}>Post New Job</span>
              </button>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/company/find-interpreter")}
              >
                <span className={styles.actionIcon}>🔍</span>
                <span className={styles.actionText}>Find Interpreters</span>
              </button>
              <button className={styles.actionButton}>
                <span className={styles.actionIcon}>📊</span>
                <span className={styles.actionText}>View Analytics</span>
              </button>
              <button className={styles.actionButton}>
                <span className={styles.actionIcon}>💬</span>
                <span className={styles.actionText}>Messages</span>
              </button>
            </div>
          </section>

          {/* Recent Applications */}
          <section className={styles.applicationsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Applications</h2>
              <button className={styles.viewAllBtn}>
                View All Applications
              </button>
            </div>

            <div className={styles.applicationsList}>
              {MOCK_RECENT_APPLICATIONS.map((application) => (
                <div key={application.id} className={styles.applicationCard}>
                  {/* Applicant Info */}
                  <div className={styles.applicantInfo}>
                    <div className={styles.applicantHeader}>
                      <img
                        src={application.avatar}
                        alt={application.applicantName}
                        className={styles.applicantAvatar}
                      />
                      <div className={styles.applicantDetails}>
                        <h3 className={styles.applicantName}>
                          {application.applicantName}
                        </h3>
                        <p className={styles.jobTitle}>
                          {application.jobTitle}
                        </p>
                        <div className={styles.applicantMeta}>
                          <span className={styles.experience}>
                            {application.experience} experience
                          </span>
                          <span className={styles.rating}>
                            ⭐ {application.rating}
                          </span>
                          <span className={styles.hourlyRate}>
                            {application.hourlyRate}/hour
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div className={styles.languagesColumn}>
                    <span className={styles.columnLabel}>Languages</span>
                    <div className={styles.languagesList}>
                      {application.languages.map((lang) => (
                        <span key={lang} className={styles.languageTag}>
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Applied Date */}
                  <div className={styles.dateColumn}>
                    <span className={styles.columnLabel}>Applied</span>
                    <span className={styles.dateValue}>
                      {formatDate(application.appliedDate)}
                    </span>
                  </div>

                  {/* Status */}
                  <div className={styles.statusColumn}>
                    <span className={styles.columnLabel}>Status</span>
                    <div
                      className={`${styles.statusBadge} ${getStatusClass(
                        application.status
                      )}`}
                    >
                      <span className={styles.statusIcon}>●</span>
                      <span className={styles.statusText}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.actionColumn}>
                    <button
                      className={styles.viewApplicationBtn}
                      onClick={() => handleViewApplication(application)}
                    >
                      View Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Active Jobs */}
          <section className={styles.jobsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Active Job Posts</h2>
              <button
                className={styles.viewAllBtn}
                onClick={() => navigate("/company/job-post")}
              >
                Manage Jobs
              </button>
            </div>

            <div className={styles.jobsList}>
              {MOCK_ACTIVE_JOBS.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobMeta}>
                      <span className={styles.jobType}>{job.type}</span>
                      <span className={styles.jobLocation}>
                        📍 {job.location}
                      </span>
                      <span className={styles.jobSalary}>💰 {job.salary}</span>
                    </div>
                  </div>

                  <div className={styles.jobStats}>
                    <div className={styles.jobStat}>
                      <span className={styles.statLabel}>Posted:</span>
                      <span className={styles.statValue}>
                        {formatDate(job.postedDate)}
                      </span>
                    </div>
                    <div className={styles.jobStat}>
                      <span className={styles.statLabel}>Applications:</span>
                      <span className={styles.statValue}>
                        {job.applicationsCount}
                      </span>
                    </div>
                    <div className={styles.jobStat}>
                      <span className={styles.statLabel}>Deadline:</span>
                      <span className={styles.statValue}>
                        {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.jobActions}>
                    <button className={styles.editJobBtn}>Edit</button>
                    <button className={styles.viewApplicantsBtn}>
                      View Applicants ({job.applicationsCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                <div className={styles.modalTitleSection}>
                  <img
                    src={selectedApplication.avatar}
                    alt={selectedApplication.applicantName}
                    className={styles.modalAvatar}
                  />
                  <div>
                    <h2>{selectedApplication.applicantName}</h2>
                    <p className={styles.modalJobTitle}>
                      {selectedApplication.jobTitle}
                    </p>
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.applicantStats}>
                  <div className={styles.modalStat}>
                    <strong>Experience:</strong>{" "}
                    {selectedApplication.experience}
                  </div>
                  <div className={styles.modalStat}>
                    <strong>Rating:</strong> ⭐ {selectedApplication.rating}
                  </div>
                  <div className={styles.modalStat}>
                    <strong>Hourly Rate:</strong>{" "}
                    {selectedApplication.hourlyRate}
                  </div>
                  <div className={styles.modalStat}>
                    <strong>Applied:</strong>{" "}
                    {formatDate(selectedApplication.appliedDate)}
                  </div>
                </div>

                <div className={styles.languagesSection}>
                  <h4>Languages</h4>
                  <div className={styles.modalLanguages}>
                    {selectedApplication.languages.map((lang) => (
                      <span key={lang} className={styles.modalLanguageTag}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.letterSection}>
                  <h4>Application Letter</h4>
                  <p className={styles.applicationLetter}>
                    {selectedApplication.applicationLetter}
                  </p>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  className={styles.rejectBtn}
                  onClick={() =>
                    handleApplicationAction(selectedApplication.id, "reject")
                  }
                >
                  Reject
                </button>
                <button
                  className={styles.interviewBtn}
                  onClick={() =>
                    handleApplicationAction(selectedApplication.id, "interview")
                  }
                >
                  Schedule Interview
                </button>
                <button
                  className={styles.acceptBtn}
                  onClick={() =>
                    handleApplicationAction(selectedApplication.id, "accept")
                  }
                >
                  Hire
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default CompanyDashboardPage;
