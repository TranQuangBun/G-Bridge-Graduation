import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import jobService from "../../services/jobService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./AdminJobModerationPage.module.css";

const AdminJobModerationPage = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // pending, approved, rejected, all
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrgApprovalModal, setShowOrgApprovalModal] = useState(false);
  const [approveOrganization, setApproveOrganization] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionJobId, setActionJobId] = useState(null);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    all: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Fetch counts for all statuses
  const fetchCounts = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes, allRes] = await Promise.all([
        jobService.getJobs({ page: 1, limit: 1, reviewStatus: "pending" }),
        jobService.getJobs({ page: 1, limit: 1, reviewStatus: "approved" }),
        jobService.getJobs({ page: 1, limit: 1, reviewStatus: "rejected" }),
        jobService.getJobs({ page: 1, limit: 1 }),
      ]);

      setCounts({
        pending: pendingRes.pagination?.total || 0,
        approved: approvedRes.pagination?.total || 0,
        rejected: rejectedRes.pagination?.total || 0,
        all: allRes.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== "all" && { reviewStatus: filter }),
      };
      const response = await jobService.getJobs(params);
      if (response.success) {
        // sendPaginated returns data as array directly, pagination as separate field
        const jobsData = Array.isArray(response.data) ? response.data : (response.data?.jobs || []);
        const paginationData = response.pagination || response.data?.pagination;
        setJobs(jobsData);
        if (paginationData) {
          setPagination((prev) => paginationData || prev);
        }
      }
    } catch (error) {
      console.error("Error fetching jobs for moderation:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchJobs();
      fetchCounts();
    }
  }, [filter, pagination.page, isAuthenticated, user, fetchJobs, fetchCounts]);

  const confirmApprove = (jobId) => {
    setActionJobId(jobId);
    setShowApproveConfirm(true);
  };

  const handleApprove = async (jobId, shouldApproveOrg = false) => {
    const actualJobId = jobId || actionJobId;
    setProcessing(actualJobId);
    setShowApproveConfirm(false);
    try {
      // If organization needs approval and user confirmed, approve it first
      if (shouldApproveOrg && selectedJob?.organization?.id) {
        try {
          await adminService.approveOrganization(selectedJob.organization.id);
        } catch (orgError) {
          console.error("Error approving organization:", orgError);
          alert("Không thể duyệt tổ chức: " + (orgError.message || "Lỗi không xác định"));
          setProcessing(null);
          return;
        }
      }
      
      await jobService.approveJob(actualJobId, reviewNotes);
      await fetchJobs();
      await fetchCounts();
      setShowModal(false);
      setShowOrgApprovalModal(false);
      setSelectedJob(null);
      setReviewNotes("");
      setApproveOrganization(false);
      setActionJobId(null);
    } catch (error) {
      console.error("Error approving job:", error);
      alert(error.message || "Failed to approve job");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveClick = () => {
    // Check if organization is not approved
    if (selectedJob?.organization?.approvalStatus !== "approved") {
      setShowOrgApprovalModal(true);
    } else {
      handleApprove(selectedJob.id, false);
    }
  };

  const confirmReject = (jobId) => {
    if (!reviewNotes.trim()) {
      alert(
        t("adminModeration.reviewNotesRequired") ||
          "Review notes are required for rejection"
      );
      return;
    }
    setActionJobId(jobId);
    setShowRejectConfirm(true);
  };

  const handleReject = async () => {
    const jobId = actionJobId;
    setProcessing(jobId);
    setShowRejectConfirm(false);
    try {
      await jobService.rejectJob(jobId, reviewNotes);
      await fetchJobs();
      await fetchCounts();
      setShowModal(false);
      setSelectedJob(null);
      setReviewNotes("");
      setActionJobId(null);
    } catch (error) {
      console.error("Error rejecting job:", error);
      alert(error.message || "Failed to reject job");
    } finally {
      setProcessing(null);
    }
  };

  const openModal = (job) => {
    setSelectedJob(job);
    setReviewNotes(job.reviewNotes || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowOrgApprovalModal(false);
    setSelectedJob(null);
    setReviewNotes("");
    setApproveOrganization(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getReviewStatusBadge = (status) => {
    const statusMap = {
      pending: {
        label: t("adminModeration.status.pending") || "Pending",
        className: styles.statusPending,
      },
      approved: {
        label: t("adminModeration.status.approved") || "Approved",
        className: styles.statusApproved,
      },
      rejected: {
        label: t("adminModeration.status.rejected") || "Rejected",
        className: styles.statusRejected,
      },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`${styles.statusBadge} ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>{t("common.loading")}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.moderationPage}>
        <header className={styles.pageHeader}>
          <h1>{t("adminModeration.title") || "Job Moderation"}</h1>
          <p className={styles.subtitle}>
            {t("adminModeration.subtitle") ||
              "Review and approve or reject job postings"}
          </p>
        </header>

        <div className={styles.filters}>
          <label className={styles.filterLabel}>
            {t("adminModeration.filterByStatus") || "Lọc theo trạng thái:"}
            <select
              className={styles.filterSelect}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="all">{t("adminModeration.filters.all") || "Tất cả"} ({counts.all})</option>
              <option value="pending">{t("adminModeration.filters.pending") || "Chờ duyệt"} ({counts.pending})</option>
              <option value="approved">{t("adminModeration.filters.approved") || "Đã duyệt"} ({counts.approved})</option>
              <option value="rejected">{t("adminModeration.filters.rejected") || "Từ chối"} ({counts.rejected})</option>
            </select>
          </label>
        </div>

        <div className={styles.jobsList}>
          {loading ? (
            <div className={styles.loading}>{t("common.loading")}</div>
          ) : jobs.length === 0 ? (
            <div className={styles.emptyState}>
              {t("adminModeration.noJobs") || "No jobs found"}
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleSection}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobMeta}>
                      <span className={styles.company}>
                        {job.organization?.name || "Unknown Company"}
                      </span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.location}>
                        {job.province || job.address || "Location TBD"}
                      </span>
                      <span className={styles.separator}>•</span>
                      <span className={styles.date}>
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.jobActions}>
                    {getReviewStatusBadge(job.reviewStatus)}
                    <button
                      className={styles.viewBtn}
                      onClick={() => openModal(job)}
                    >
                      {t("adminModeration.viewDetails") || "View Details"}
                    </button>
                  </div>
                </div>
                <div className={styles.jobPreview}>
                  <p className={styles.jobDescription}>
                    {job.descriptions?.substring(0, 200) ||
                      "No description available"}
                    {job.descriptions?.length > 200 ? "..." : ""}
                  </p>
                  {job.reviewNotes && (
                    <div className={styles.reviewNotes}>
                      <strong>
                        {t("adminModeration.reviewNotes") || "Review Notes"}:
                      </strong>{" "}
                      {job.reviewNotes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              {t("common.previous") || "Previous"}
            </button>
            <span className={styles.pageInfo}>
              {t("common.page") || "Page"} {pagination.page}{" "}
              {t("common.of") || "of"} {pagination.totalPages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              {t("common.next") || "Next"}
            </button>
          </div>
        )}

        {/* Review Modal */}
        {showModal && selectedJob && (
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{selectedJob.title}</h2>
                <button className={styles.closeBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.jobDetails") || "Job Details"}</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.company") || "Tổ chức"}:</strong>
                      <span>
                        {selectedJob.organization?.name || "Unknown"}
                        {selectedJob.organization?.approvalStatus !== "approved" && (
                          <span className={styles.orgWarning}>
                            {" "}(Chưa duyệt)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Trạng thái tổ chức:</strong>
                      <span>
                        {selectedJob.organization?.approvalStatus === "approved" ? (
                          <span className={styles.statusApproved}>Đã duyệt</span>
                        ) : selectedJob.organization?.approvalStatus === "pending" ? (
                          <span className={styles.statusPending}>Chờ duyệt</span>
                        ) : (
                          <span className={styles.statusRejected}>Từ chối</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Hình thức làm việc:</strong>
                      <span>{selectedJob.workingMode?.name || selectedJob.workingMode?.nameVi || "N/A"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Địa điểm:</strong>
                      <span>
                        {[selectedJob.province, selectedJob.commune, selectedJob.address]
                          .filter(Boolean)
                          .join(", ") || "TBD"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Số lượng:</strong>
                      <span>{selectedJob.quantity || 1} người</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Hạn nộp hồ sơ:</strong>
                      <span>{formatDate(selectedJob.expirationDate)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.salary") || "Lương"}:</strong>
                      <span>
                        {selectedJob.salaryType === "FIXED" && selectedJob.minSalary
                          ? `$${selectedJob.minSalary}`
                          : selectedJob.salaryType === "RANGE" && selectedJob.minSalary && selectedJob.maxSalary
                          ? `$${selectedJob.minSalary} - $${selectedJob.maxSalary}`
                          : selectedJob.minSalary
                          ? `$${selectedJob.minSalary}+`
                          : "Thỏa thuận"}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Email liên hệ:</strong>
                      <span>{selectedJob.contactEmail || "N/A"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>Số điện thoại:</strong>
                      <span>{selectedJob.contactPhone || "N/A"}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.statusLabel") || "Trạng thái"}:</strong>
                      {getReviewStatusBadge(selectedJob.reviewStatus)}
                    </div>
                    <div className={styles.detailItem}>
                      <strong>{t("adminModeration.createdAt") || "Ngày tạo"}:</strong>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedJob.domains && selectedJob.domains.length > 0 && (
                  <div className={styles.modalSection}>
                    <h3>Lĩnh vực / Ngành nghề</h3>
                    <div className={styles.tagsList}>
                      {selectedJob.domains.map((domain) => (
                        <span key={domain.domainId || domain.id} className={styles.tag}>
                          {domain.domain?.name || domain.name || domain.domainName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.requiredLanguages && selectedJob.requiredLanguages.length > 0 && (
                  <div className={styles.modalSection}>
                    <h3>Yêu cầu ngôn ngữ</h3>
                    <div className={styles.languagesList}>
                      {selectedJob.requiredLanguages.map((lang, idx) => (
                        <div key={idx} className={styles.languageItem}>
                          <span className={styles.languageName}>
                            {lang.language?.name || lang.languageName || "N/A"}
                          </span>
                          <span className={styles.languageLevel}>
                            {lang.level?.name || lang.level?.nameVi || lang.levelName || "N/A"}
                          </span>
                          {lang.isSourceLanguage && (
                            <span className={styles.sourceBadge}>Ngôn ngữ nguồn</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.description") || "Mô tả"}</h3>
                  <p className={styles.descriptionText}>
                    {selectedJob.descriptions || "Không có mô tả"}
                  </p>
                </div>

                {selectedJob.responsibility && (
                  <div className={styles.modalSection}>
                    <h3>Nhiệm vụ chính</h3>
                    <p className={styles.descriptionText}>{selectedJob.responsibility}</p>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div className={styles.modalSection}>
                    <h3>Quyền lợi</h3>
                    <p className={styles.descriptionText}>{selectedJob.benefits}</p>
                  </div>
                )}

                {selectedJob.reviewNotes && (
                  <div className={styles.modalSection}>
                    <h3>
                      {t("adminModeration.previousNotes") ||
                        "Previous Review Notes"}
                    </h3>
                    <p className={styles.notesText}>
                      {selectedJob.reviewNotes}
                    </p>
                  </div>
                )}

                <div className={styles.modalSection}>
                  <h3>{t("adminModeration.reviewNotes") || "Review Notes"}</h3>
                  <textarea
                    className={styles.notesTextarea}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={
                      t("adminModeration.notesPlaceholder") ||
                      "Add review notes (required for rejection)..."
                    }
                    rows={4}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={closeModal}
                  disabled={processing === selectedJob.id}
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                {selectedJob.reviewStatus !== "approved" && (
                  <button
                    className={styles.approveBtn}
                    onClick={handleApproveClick}
                    disabled={processing === selectedJob.id}
                  >
                    {processing === selectedJob.id
                      ? t("common.loading") || "Loading..."
                      : t("adminModeration.approve") || "Approve"}
                  </button>
                )}
                {selectedJob.reviewStatus !== "rejected" && (
                  <button
                    className={styles.rejectBtn}
                    onClick={() => confirmReject(selectedJob.id)}
                    disabled={processing === selectedJob.id}
                  >
                    {processing === selectedJob.id
                      ? t("common.loading") || "Loading..."
                      : t("adminModeration.reject") || "Reject"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Organization Approval Confirmation Modal */}
        {showOrgApprovalModal && selectedJob && (
          <div className={styles.modalOverlay} onClick={() => setShowOrgApprovalModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#fef3c7" />
                  <path
                    d="M24 16v8M24 28h.01"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Xác nhận duyệt tổ chức</h3>
              <p className={styles.confirmText}>
                Tổ chức <strong>"{selectedJob.organization?.name}"</strong> chưa được duyệt.
                Bạn có muốn duyệt tổ chức này cùng lúc với công việc không?
              </p>
              <div className={styles.warningBox}>
                <p>
                  <strong>⚠️ Lưu ý:</strong>
                </p>
                <ul>
                  <li>Nếu duyệt tổ chức, tổ chức sẽ được kích hoạt và có thể đăng thêm công việc</li>
                  <li>Chủ sở hữu tổ chức sẽ nhận được thông báo về việc phê duyệt</li>
                  <li>Bạn có thể duyệt công việc mà không duyệt tổ chức, nhưng công việc sẽ không hiển thị công khai cho đến khi tổ chức được duyệt</li>
                </ul>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowOrgApprovalModal(false);
                    setApproveOrganization(false);
                  }}
                >
                  Chỉ duyệt công việc
                </button>
                <button
                  className={styles.confirmApproveButton}
                  onClick={() => {
                    setApproveOrganization(true);
                    setShowOrgApprovalModal(false);
                    handleApprove(selectedJob.id, true);
                  }}
                  disabled={processing === selectedJob.id}
                >
                  {processing === selectedJob.id
                    ? "Đang xử lý..."
                    : "Duyệt cả tổ chức và công việc"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveConfirm && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.confirmModal}`}>
              <h2>📝 Xác nhận duyệt công việc</h2>
              <p>Bạn có chắc chắn muốn duyệt công việc này không?</p>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setActionJobId(null);
                  }}
                >
                  Hủy
                </button>
                <button className={styles.approveBtn} onClick={() => handleApprove()}>
                  Xác nhận duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectConfirm && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.confirmModal}`}>
              <h2>⚠️ Xác nhận từ chối công việc</h2>
              <p>Bạn có chắc chắn muốn từ chối công việc này không?</p>
              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setActionJobId(null);
                  }}
                >
                  Hủy
                </button>
                <button className={styles.rejectBtn} onClick={handleReject}>
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminJobModerationPage;
