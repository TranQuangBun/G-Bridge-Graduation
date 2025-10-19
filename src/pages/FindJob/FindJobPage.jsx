import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindJobPage.module.css";
import { MainLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ROUTES } from "../../constants/enums";

export default function FindJobPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [keyword, setKeyword] = useState("");
  const [province, setProvince] = useState("");
  const [domainId, setDomainId] = useState("");
  const [workingModeId, setWorkingModeId] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const limit = 9;

  // Lookup data
  const [domains, setDomains] = useState([]);
  const [workingModes, setWorkingModes] = useState([]);
  const [provinces, setProvinces] = useState([]);

  // Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [applicationData, setApplicationData] = useState({
    pdfFile: null,
    introduction: "",
    profileLink: "",
  });

  // Notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Premium state (keep for demo)
  const [hasPremium, setHasPremium] = useState(false);

  // Saved jobs state
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);

  // Fetch lookup data on mount
  useEffect(() => {
    fetchLookupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch saved jobs when user changes
  useEffect(() => {
    fetchSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch jobs when filters change
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, keyword, province, domainId, workingModeId, minSalary, maxSalary]);

  async function fetchLookupData() {
    try {
      const [domainsRes, modesRes] = await Promise.all([
        fetch("/api/jobs/lookup/domains"),
        fetch("/api/jobs/lookup/working-modes"),
      ]);

      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData.data || []);
      }

      if (modesRes.ok) {
        const modesData = await modesRes.json();
        setWorkingModes(modesData.data || []);
      }
    } catch (error) {
      console.error("Error fetching lookup data:", error);
    }
  }

  async function fetchJobs() {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: "open",
      });

      if (keyword) params.append("search", keyword);
      if (province) params.append("province", province);
      if (domainId) params.append("domainId", domainId);
      if (workingModeId) params.append("workingModeId", workingModeId);
      if (minSalary) params.append("minSalary", minSalary);
      if (maxSalary) params.append("maxSalary", maxSalary);

      const response = await fetch(`/api/jobs?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalJobs(data.data.pagination?.total || 0);

        // Extract unique provinces from jobs for filter
        const uniqueProvinces = [
          ...new Set(data.data.jobs.map((j) => j.province).filter(Boolean)),
        ];
        setProvinces(uniqueProvinces);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message);
      showNotification("Error loading jobs. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  // Fetch saved jobs IDs for current user
  async function fetchSavedJobs() {
    if (!user) return; // Only fetch if user is logged in

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/jobs/saved/list?page=1&limit=1000", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.savedJobs) {
          const ids = new Set(data.data.savedJobs.map((sj) => sj.jobId));
          setSavedJobIds(ids);
        }
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  }

  // Handle save/unsave job
  async function handleSaveJob(jobId, event) {
    // Stop event propagation to prevent opening modal
    if (event) {
      event.stopPropagation();
    }

    // Check if user is logged in
    if (!user) {
      showNotification("Please login to save jobs", "error");
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 1500);
      return;
    }

    // Prevent multiple clicks
    if (savingJobId === jobId) return;

    try {
      setSavingJobId(jobId);

      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update savedJobIds state
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          if (data.isSaved) {
            newSet.add(jobId);
          } else {
            newSet.delete(jobId);
          }
          return newSet;
        });

        showNotification(data.message, "success");
      } else {
        showNotification(data.message || "Failed to save job", "error");
      }
    } catch (error) {
      console.error("Error saving job:", error);
      showNotification("An error occurred. Please try again.", "error");
    } finally {
      setSavingJobId(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  }

  function handleReset() {
    setKeyword("");
    setProvince("");
    setDomainId("");
    setWorkingModeId("");
    setMinSalary("");
    setMaxSalary("");
    setPage(1);
  }

  function showNotification(message, type = "success") {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 5000);
  }

  function openJobModal(job) {
    setSelectedJob(job);
    setIsModalOpen(true);
  }

  function closeJobModal() {
    setIsModalOpen(false);
    setSelectedJob(null);
  }

  function handleApply() {
    setIsApplicationModalOpen(true);
  }

  function closeApplicationModal() {
    setIsApplicationModalOpen(false);
    setApplicationData({
      pdfFile: null,
      introduction: "",
      profileLink: "",
    });
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setApplicationData((prev) => ({ ...prev, pdfFile: file }));
    } else {
      showNotification("Please upload a PDF file", "error");
    }
  }

  function handleApplicationSubmit() {
    if (!applicationData.pdfFile || !applicationData.introduction.trim()) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    // Submit logic here
    console.log("Application submitted:", applicationData);
    closeApplicationModal();
    closeJobModal();
    showNotification("Application submitted successfully!", "success");
  }

  function formatSalary(job) {
    if (job.salaryType === "NEGOTIABLE") {
      return "Negotiable";
    }
    if (job.minSalary && job.maxSalary) {
      return `$${job.minSalary} - $${job.maxSalary}`;
    }
    if (job.minSalary) {
      return `From $${job.minSalary}`;
    }
    return "Contact for details";
  }

  function getWorkingModeDisplay(job) {
    if (!job.workingMode) return "";
    return language === "vi" && job.workingMode.nameVi
      ? job.workingMode.nameVi
      : job.workingMode.name;
  }

  function getDomainsDisplay(job) {
    if (!job.domains || job.domains.length === 0) return [];
    return job.domains.map((d) =>
      language === "vi" && d.nameVi ? d.nameVi : d.name
    );
  }

  function togglePremium() {
    setHasPremium(!hasPremium);
  }

  return (
    <MainLayout>
      <div className={styles.findJobRoot}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.container}>
            <h1 className={styles.title}>Find Interpreter Jobs</h1>
            <p className={styles.subtitle}>
              Discover opportunities that match your skills
            </p>

            {/* Demo buttons */}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <button
                onClick={() => navigate(user ? ROUTES.DASHBOARD : ROUTES.LOGIN)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: user ? "#22c55e" : "#f3f4f6",
                  color: user ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {user ? `✓ ${user.fullName || user.email}` : "🔑 Login"}
              </button>
              <button
                onClick={togglePremium}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: hasPremium ? "#f59e0b" : "#f3f4f6",
                  color: hasPremium ? "white" : "black",
                  cursor: "pointer",
                }}
              >
                {hasPremium ? "👑 Premium" : "🔒 Free"}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles.contentArea}>
          <div className={styles.container}>
            {/* Search Bar */}
            <form className={styles.searchBar} onSubmit={handleSearch}>
              <div className={styles.field}>
                <label>Keyword</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, company..."
                />
              </div>

              <div className={styles.field}>
                <label>Location</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                >
                  <option value="">All Locations</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Domain</label>
                <select
                  value={domainId}
                  onChange={(e) => setDomainId(e.target.value)}
                >
                  <option value="">All Domains</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === "vi" && d.nameVi ? d.nameVi : d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Working Mode</label>
                <select
                  value={workingModeId}
                  onChange={(e) => setWorkingModeId(e.target.value)}
                >
                  <option value="">All Modes</option>
                  {workingModes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {language === "vi" && m.nameVi ? m.nameVi : m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Salary Range</label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    placeholder="Min"
                    style={{ width: "50%" }}
                  />
                  <input
                    type="number"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    placeholder="Max"
                    style={{ width: "50%" }}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.searchBtn}>
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className={styles.resetBtn}
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Results count */}
            {!loading && (
              <div
                style={{ margin: "20px 0", textAlign: "center", color: "#666" }}
              >
                Found {totalJobs} job{totalJobs !== 1 ? "s" : ""}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  fontSize: "18px",
                  color: "#666",
                }}
              >
                Loading jobs...
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  fontSize: "18px",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}

            {/* Jobs Grid */}
            {!loading && !error && (
              <div className={styles.jobsGrid}>
                {jobs.length === 0 && (
                  <div className={styles.empty}>
                    No jobs found matching your criteria
                  </div>
                )}

                {jobs.map((job) => (
                  <div key={job.id} className={styles.jobCard}>
                    <div className={styles.jobTop}>
                      <div className={styles.logo}>
                        {job.organization?.logo ? (
                          <img
                            src={job.organization.logo}
                            alt={job.organization.name}
                          />
                        ) : (
                          job.organization?.name?.[0] || "?"
                        )}
                      </div>
                      <div className={styles.jobInfo}>
                        <h3 className={styles.jobTitle}>{job.title}</h3>
                        <p className={styles.company}>
                          {job.organization?.name}
                        </p>
                        <div className={styles.meta}>
                          <span>📍 {job.province}</span>
                          {job.workingMode && (
                            <span>💼 {getWorkingModeDisplay(job)}</span>
                          )}
                          <span>💰 {formatSalary(job)}</span>
                          <span>
                            👥 {job.quantity} position
                            {job.quantity > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className={styles.desc}>
                      {job.descriptions?.substring(0, 150)}...
                    </p>

                    <div className={styles.tags}>
                      {getDomainsDisplay(job).map((domain) => (
                        <span key={domain}>{domain}</span>
                      ))}
                    </div>

                    <div className={styles.cardActions}>
                      <button
                        className={styles.applyBtn}
                        onClick={() => openJobModal(job)}
                      >
                        View Details
                      </button>
                      <button
                        className={`${styles.saveBtn} ${
                          savedJobIds.has(job.id) ? styles.saved : ""
                        }`}
                        onClick={(e) => handleSaveJob(job.id, e)}
                        disabled={savingJobId === job.id}
                      >
                        {savedJobIds.has(job.id) ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && jobs.length > 0 && (
              <div className={styles.pagination}>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`${styles.pageBtn} ${
                        p === page ? styles.active : ""
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Job Details Modal */}
          {isModalOpen && selectedJob && (
            <div className={styles.modalOverlay} onClick={closeJobModal}>
              <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <button className={styles.closeBtn} onClick={closeJobModal}>
                  ×
                </button>

                <div className={styles.modalHeader}>
                  <div className={styles.modalLogo}>
                    {selectedJob.organization?.logo ? (
                      <img
                        src={selectedJob.organization.logo}
                        alt={selectedJob.organization.name}
                      />
                    ) : (
                      selectedJob.organization?.name?.[0] || "?"
                    )}
                  </div>
                  <div className={styles.modalJobInfo}>
                    <h2 className={styles.modalJobTitle}>
                      {selectedJob.title}
                    </h2>
                    <p className={styles.modalCompany}>
                      {selectedJob.organization?.name}
                    </p>
                    <div className={styles.modalMeta}>
                      <span>
                        📍 {selectedJob.province}, {selectedJob.commune}
                      </span>
                      <span>💼 {getWorkingModeDisplay(selectedJob)}</span>
                      <span>💰 {formatSalary(selectedJob)}</span>
                      <span>👥 {selectedJob.quantity} positions</span>
                    </div>
                  </div>
                  <div className={styles.modalHeaderActions}>
                    <button
                      className={styles.modalApplyBtn}
                      onClick={handleApply}
                    >
                      Apply Now
                    </button>
                    <button
                      className={`${styles.modalSaveBtn} ${
                        savedJobIds.has(selectedJob.id) ? styles.saved : ""
                      }`}
                      onClick={(e) => handleSaveJob(selectedJob.id, e)}
                      disabled={savingJobId === selectedJob.id}
                    >
                      {savedJobIds.has(selectedJob.id) ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.modalLeft}>
                    <h3>Contact Information</h3>
                    <div className={styles.contactInfo}>
                      <div
                        className={`${styles.contactItem} ${
                          !user || !hasPremium ? styles.blurred : ""
                        }`}
                      >
                        <span className={styles.contactLabel}>📧 Email:</span>
                        <span className={styles.contactValue}>
                          {selectedJob.contactEmail}
                        </span>
                      </div>
                      <div
                        className={`${styles.contactItem} ${
                          !user || !hasPremium ? styles.blurred : ""
                        }`}
                      >
                        <span className={styles.contactLabel}>📞 Phone:</span>
                        <span className={styles.contactValue}>
                          {selectedJob.contactPhone}
                        </span>
                      </div>
                      <div
                        className={`${styles.contactItem} ${
                          !user || !hasPremium ? styles.blurred : ""
                        }`}
                      >
                        <span className={styles.contactLabel}>📍 Address:</span>
                        <span className={styles.contactValue}>
                          {selectedJob.address}
                        </span>
                      </div>
                    </div>

                    {(!user || !hasPremium) && (
                      <div className={styles.premiumNotice}>
                        <p>
                          🔒 Contact information is only available for premium
                          members.
                        </p>
                        <button
                          className={styles.upgradeBtn}
                          onClick={() => navigate(ROUTES.PRICING)}
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.modalRight}>
                    <div className={styles.section}>
                      <h3>Job Description</h3>
                      <p>{selectedJob.descriptions}</p>
                    </div>

                    {selectedJob.responsibility && (
                      <div className={styles.section}>
                        <h3>Responsibilities</h3>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                          }}
                        >
                          {selectedJob.responsibility}
                        </pre>
                      </div>
                    )}

                    {selectedJob.benefits && (
                      <div className={styles.section}>
                        <h3>Benefits</h3>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                          }}
                        >
                          {selectedJob.benefits}
                        </pre>
                      </div>
                    )}

                    {selectedJob.requiredLanguages &&
                      selectedJob.requiredLanguages.length > 0 && (
                        <div className={styles.section}>
                          <h3>Required Languages</h3>
                          <div className={styles.modalTags}>
                            {selectedJob.requiredLanguages.map((rl) => (
                              <span key={rl.id} className={styles.modalTag}>
                                {rl.language?.name}{" "}
                                {rl.level && `(${rl.level.name})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {selectedJob.requiredCertificates &&
                      selectedJob.requiredCertificates.length > 0 && (
                        <div className={styles.section}>
                          <h3>Required Certificates</h3>
                          <div className={styles.modalTags}>
                            {selectedJob.requiredCertificates.map((rc) => (
                              <span key={rc.id} className={styles.modalTag}>
                                {rc.certificate?.name}
                                {rc.minAchievementDetail &&
                                  ` - ${rc.minAchievementDetail}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className={styles.section}>
                      <h3>Domains</h3>
                      <div className={styles.modalTags}>
                        {getDomainsDisplay(selectedJob).map((domain) => (
                          <span key={domain} className={styles.modalTag}>
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Application Modal */}
          {isApplicationModalOpen && (
            <div className={styles.modalOverlay}>
              <div className={styles.applicationModal}>
                <div className={styles.applicationModalHeader}>
                  <h2>Apply for {selectedJob?.title}</h2>
                  <button
                    className={styles.closeBtn}
                    onClick={closeApplicationModal}
                  >
                    ×
                  </button>
                </div>

                <div className={styles.applicationModalBody}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Upload CV (PDF) <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                    />
                    {applicationData.pdfFile && (
                      <div className={styles.filePreview}>
                        📄 Selected: {applicationData.pdfFile.name}
                      </div>
                    )}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Introduction <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      value={applicationData.introduction}
                      onChange={(e) =>
                        setApplicationData((prev) => ({
                          ...prev,
                          introduction: e.target.value,
                        }))
                      }
                      placeholder="Tell us about yourself and why you're interested in this position..."
                      className={styles.textArea}
                      rows={5}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Portfolio/LinkedIn Link
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
                      placeholder="https://..."
                      className={styles.textInput}
                    />
                  </div>

                  <div className={styles.applicationModalActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={closeApplicationModal}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.submitBtn}
                      onClick={handleApplicationSubmit}
                    >
                      Submit Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification */}
          {notification.show && (
            <div className={styles.notificationOverlay}>
              <div
                className={`${styles.notification} ${
                  styles[notification.type]
                }`}
              >
                <div className={styles.notificationContent}>
                  <div className={styles.notificationIcon}>
                    {notification.type === "error" && "⚠️"}
                    {notification.type === "success" && "✅"}
                  </div>
                  <div className={styles.notificationMessage}>
                    {notification.message}
                  </div>
                  <button
                    className={styles.notificationClose}
                    onClick={() =>
                      setNotification((prev) => ({ ...prev, show: false }))
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
