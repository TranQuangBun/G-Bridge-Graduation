import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useLanguage } from "../../translet/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import alertService from "../../services/alertService";
import jobService from "../../services/jobService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner } from "react-icons/fa";

const AdminJobModerationPage = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // pending, approved, rejected, all
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrgApprovalModal, setShowOrgApprovalModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [processing, setProcessing] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const toggleMenu = (jobId, e) => {
    e.stopPropagation();

    if (openMenuId === jobId) {
      setOpenMenuId(null);
      return;
    }

    // Calculate menu position
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 180;
    const menuHeight = 150; // approximate

    let top = rect.bottom + 4;
    let left = rect.right - menuWidth;

    // Adjust if menu would go off screen
    if (left < 0) left = rect.left;
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    setMenuPosition({ top, left });
    setOpenMenuId(jobId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);
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

      // Add search parameter - search by job title or organization name
      if (search.trim()) {
        params.search = search.trim();
      }

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
  }, [filter, pagination.page, pagination.limit, search]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const timeoutId = setTimeout(() => {
        fetchJobs();
        fetchCounts();
      }, search ? 500 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [filter, pagination.page, search, isAuthenticated, user, fetchJobs, fetchCounts]);


  const handleApprove = async (jobId, shouldApproveOrg = false) => {
    const actualJobId = jobId || selectedJob?.id;
    if (!actualJobId) return;
    
    setProcessing(actualJobId);
    setShowApproveConfirm(false);
    setShowOrgApprovalModal(false);
    try {
      // If organization needs approval and user confirmed, approve it first
      if (shouldApproveOrg && selectedJob?.organization?.id) {
        try {
          await adminService.approveOrganization(selectedJob.organization.id);
        } catch (orgError) {
          console.error("Error approving organization:", orgError);
          await alertService.error(orgError.message || "Failed to approve organization");
          setProcessing(null);
          return;
        }
      }
      
      await jobService.approveJob(actualJobId, reviewNotes || "");
      await fetchJobs();
      await fetchCounts();
      setShowModal(false);
      setSelectedJob(null);
      setReviewNotes("");
      await alertService.success(t("admin.jobModeration.approveSuccess") || "Duyệt công việc thành công");
    } catch (error) {
      console.error("Error approving job:", error);
      await alertService.error(error.message || "Failed to approve job");
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveClick = (job) => {
    if (!job) {
      // If no job passed, use selectedJob from modal
      if (!selectedJob) return;
      const jobToApprove = selectedJob;
      // Check if organization is not approved
      if (jobToApprove?.organization?.approvalStatus !== "approved") {
        setShowOrgApprovalModal(true);
      } else {
        handleApprove(jobToApprove.id, false);
      }
    } else {
      setSelectedJob(job);
      // Check if organization is not approved
      if (job?.organization?.approvalStatus !== "approved") {
        setShowOrgApprovalModal(true);
      } else {
        setReviewNotes("");
        handleApprove(job.id, false);
      }
    }
  };

  const confirmReject = (job) => {
    // Handle both job object and jobId
    if (typeof job === 'number') {
      const jobObj = jobs.find(j => j.id === job);
      if (jobObj) {
        setSelectedJob(jobObj);
        setReviewNotes("");
      }
    } else if (job) {
      setSelectedJob(job);
      setReviewNotes("");
    }
    setShowRejectConfirm(true);
  };

  const handleReject = async () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    if (!reviewNotes.trim()) {
      await alertService.error(t("admin.jobModeration.rejectReasonRequired") || "Vui lòng nhập lý do từ chối");
      return;
    }
    
    setProcessing(jobId);
    setShowModal(false);
    try {
      await jobService.rejectJob(jobId, reviewNotes);
      await fetchJobs();
      await fetchCounts();
      setSelectedJob(null);
      setReviewNotes("");
      await alertService.success(t("admin.jobModeration.rejectSuccess") || "Từ chối công việc thành công");
    } catch (error) {
      console.error("Error rejecting job:", error);
      await alertService.error(error.message || "Failed to reject job");
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
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getReviewStatusBadge = (status) => {
    const statusMap = {
      pending: {
        label: t("admin.jobModeration.statusPending") || "Chờ duyệt",
        className: commonStyles.adminBadgePending,
      },
      approved: {
        label: t("admin.jobModeration.statusApproved") || "Đã duyệt",
        className: commonStyles.adminBadgeActive,
      },
      rejected: {
        label: t("admin.jobModeration.statusRejected") || "Đã từ chối",
        className: commonStyles.adminBadgeInactive,
      },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={statusInfo.className}>
        {statusInfo.label}
      </span>
    );
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className={commonStyles.adminContainer}>
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>{t("common.loading")}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div className={commonStyles.adminFilters}>
          <div className={commonStyles.adminFilterGroup} style={{ flex: 1, minWidth: "300px" }}>
            <input
              type="text"
              className={commonStyles.adminFilterInput}
              placeholder={t("admin.jobModeration.searchPlaceholder") || "Tìm theo tên công việc hoặc tổ chức..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <select
              className={commonStyles.adminFilterSelect}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="all">{t("admin.jobModeration.all") || "Tất cả"} ({counts.all})</option>
              <option value="pending">{t("admin.jobModeration.pending") || "Chờ duyệt"} ({counts.pending})</option>
              <option value="approved">{t("admin.jobModeration.approved") || "Đã duyệt"} ({counts.approved})</option>
              <option value="rejected">{t("admin.jobModeration.rejected") || "Đã từ chối"} ({counts.rejected})</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>{t("common.loading")}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <p>{t("admin.jobModeration.noJobs") || "Không có công việc nào"}</p>
          </div>
        ) : (
          <>
            <div className={commonStyles.adminTableContainer}>
              <table className={commonStyles.adminTable}>
                <thead>
                  <tr>
                    <th>{t("admin.jobModeration.order") || "Thứ tự"}</th>
                    <th>{t("admin.jobModeration.title") || "Tiêu đề"}</th>
                    <th>{t("admin.jobModeration.organization") || "Tổ chức"}</th>
                    <th>{t("admin.jobModeration.location") || "Địa điểm"}</th>
                    <th>{t("admin.jobModeration.status") || "Trạng thái"}</th>
                    <th>{t("admin.jobModeration.submissionDate") || "Ngày gửi"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <tr key={job.id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <div style={{ maxWidth: "300px" }}>
                          <strong>{job.title}</strong>
                          {job.descriptions && (
                            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                              {job.descriptions.length > 100
                                ? `${job.descriptions.substring(0, 100)}...`
                                : job.descriptions}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>{job.organization?.name || "Unknown"}</td>
                      <td>
                        {[job.province, job.commune, job.address]
                          .filter(Boolean)
                          .join(", ") || "TBD"}
                      </td>
                      <td>{getReviewStatusBadge(job.reviewStatus)}</td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <div className={commonStyles.adminMenuContainer}>
                          <button
                            className={commonStyles.adminMenuButton}
                            onClick={(e) => toggleMenu(job.id, e)}
                            disabled={processing === job.id}
                          >
                            <span className={commonStyles.adminMenuDots}>⋮</span>
                          </button>
                          {openMenuId === job.id && (
                            <div
                              className={commonStyles.adminContextMenu}
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                              }}
                            >
                              <button
                                className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemView}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openModal(job);
                                }}
                              >
                                {t("admin.jobModeration.viewDetails") || "Xem chi tiết"}
                              </button>
                              <button
                                className={commonStyles.adminMenuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleApproveClick(job);
                                }}
                                disabled={processing === job.id || job.reviewStatus === "approved"}
                              >
                                {processing === job.id
                                  ? t("admin.jobModeration.loading") || "Đang tải..."
                                  : t("admin.jobModeration.approve") || "Duyệt"}
                              </button>
                              <button
                                className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  confirmReject(job);
                                }}
                                disabled={processing === job.id || job.reviewStatus === "rejected"}
                              >
                                {t("admin.jobModeration.reject") || "Từ chối"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className={commonStyles.adminPagination}>
            <button
              className={commonStyles.adminPaginationButton}
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              {t("common.previous") || "Previous"}
            </button>
            <span className={commonStyles.adminPaginationInfo}>
              {t("common.page") || "Page"} {pagination.page}{" "}
              {t("common.of") || "of"} {pagination.totalPages}
            </span>
            <button
              className={commonStyles.adminPaginationButton}
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
          <div className={commonStyles.adminModalOverlay} onClick={closeModal}>
            <div
              className={commonStyles.adminModal}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px" }}
            >
              <div className={commonStyles.adminModalHeader}>
                <h3>{selectedJob.title}</h3>
                <button className={commonStyles.adminModalCloseBtn} onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className={commonStyles.adminModalBody}>
                <div className={commonStyles.adminModalSection}>
                  <h3>{t("admin.jobModeration.jobDetails") || "Chi tiết công việc"}</h3>
                  <div className={commonStyles.adminModalDetailGrid}>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.company") || "Tổ chức"}:</strong>
                      <span>
                        {selectedJob.organization?.name || "Unknown"}
                        {selectedJob.organization?.approvalStatus !== "approved" && (
                          <span style={{ color: "#f59e0b", marginLeft: "0.5rem" }}>
                            {" "}({t("admin.jobModeration.notApproved") || "Chưa duyệt"})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.organizationStatus") || "Trạng thái tổ chức:"}</strong>
                      <span>
                        {selectedJob.organization?.approvalStatus === "approved" ? (
                          <span className={commonStyles.adminBadgeActive}>{t("admin.jobModeration.approved") || "Đã duyệt"}</span>
                        ) : selectedJob.organization?.approvalStatus === "pending" ? (
                          <span className={commonStyles.adminBadgePending}>{t("admin.jobModeration.pending") || "Chờ duyệt"}</span>
                        ) : (
                          <span className={commonStyles.adminBadgeInactive}>{t("admin.jobModeration.rejected") || "Từ chối"}</span>
                        )}
                      </span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.workingMode") || "Hình thức làm việc:"}</strong>
                      <span>{selectedJob.workingMode?.name || selectedJob.workingMode?.nameVi || "N/A"}</span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.locationLabel") || "Địa điểm:"}</strong>
                      <span>
                        {[selectedJob.province, selectedJob.commune, selectedJob.address]
                          .filter(Boolean)
                          .join(", ") || "TBD"}
                      </span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.quantity") || "Số lượng:"}</strong>
                      <span>{selectedJob.quantity || 1} {t("admin.jobModeration.people") || "người"}</span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.applicationDeadline") || "Hạn nộp hồ sơ:"}</strong>
                      <span>{formatDate(selectedJob.expirationDate)}</span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.salary") || "Mức lương"}:</strong>
                      <span>
                        {selectedJob.salaryType === "FIXED" && selectedJob.minSalary
                          ? `$${selectedJob.minSalary}`
                          : selectedJob.salaryType === "RANGE" && selectedJob.minSalary && selectedJob.maxSalary
                          ? `$${selectedJob.minSalary} - $${selectedJob.maxSalary}`
                          : selectedJob.minSalary
                          ? `$${selectedJob.minSalary}+`
                          : t("admin.jobModeration.negotiable") || "Thỏa thuận"}
                      </span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.contactEmail") || "Email liên hệ:"}</strong>
                      <span>{selectedJob.contactEmail || "N/A"}</span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.contactPhone") || "Số điện thoại:"}</strong>
                      <span>{selectedJob.contactPhone || "N/A"}</span>
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.statusLabel") || "Trạng thái"}:</strong>
                      {getReviewStatusBadge(selectedJob.reviewStatus)}
                    </div>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>{t("admin.jobModeration.createdAt") || "Ngày tạo"}:</strong>
                      <span>{formatDate(selectedJob.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {selectedJob.domains && selectedJob.domains.length > 0 && (
                  <div className={commonStyles.adminModalSection}>
                    <h3>{t("admin.jobModeration.domains") || "Lĩnh vực / Ngành nghề"}</h3>
                    <div className={commonStyles.adminModalTagsList}>
                      {selectedJob.domains.map((domain) => (
                        <span key={domain.domainId || domain.id} className={commonStyles.adminModalTag}>
                          {domain.domain?.name || domain.name || domain.domainName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.requiredLanguages && selectedJob.requiredLanguages.length > 0 && (
                  <div className={commonStyles.adminModalSection}>
                    <h3>{t("admin.jobModeration.requiredLanguages") || "Yêu cầu ngôn ngữ"}</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {selectedJob.requiredLanguages.map((lang, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, color: "#374151" }}>
                            {lang.language?.name || lang.languageName || "N/A"}
                          </span>
                          <span style={{ color: "#64748b" }}>
                            {lang.level?.name || lang.level?.nameVi || lang.levelName || "N/A"}
                          </span>
                          {lang.isSourceLanguage && (
                            <span className={commonStyles.adminBadgeRole}>{t("admin.jobModeration.sourceLanguage") || "Ngôn ngữ nguồn"}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={commonStyles.adminModalSection}>
                  <h3>{t("admin.jobModeration.description") || "Mô tả"}</h3>
                  <p className={commonStyles.adminModalDescriptionText}>
                    {selectedJob.descriptions || t("admin.jobModeration.noDescription") || "Không có mô tả"}
                  </p>
                </div>

                {selectedJob.responsibility && (
                  <div className={commonStyles.adminModalSection}>
                    <h3>{t("admin.jobModeration.responsibilities") || "Nhiệm vụ chính"}</h3>
                    <p className={commonStyles.adminModalDescriptionText}>{selectedJob.responsibility}</p>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div className={commonStyles.adminModalSection}>
                    <h3>{t("admin.jobModeration.benefits") || "Quyền lợi"}</h3>
                    <p className={commonStyles.adminModalDescriptionText}>{selectedJob.benefits}</p>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Organization Approval Confirmation Modal */}
        {showOrgApprovalModal && selectedJob && (
          <div className={commonStyles.adminModalOverlay} onClick={() => setShowOrgApprovalModal(false)}>
            <div className={commonStyles.adminModal} onClick={(e) => e.stopPropagation()}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.jobModeration.confirmApproveOrg") || "Xác nhận duyệt tổ chức"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => setShowOrgApprovalModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                  <div style={{ 
                    width: "64px", 
                    height: "64px", 
                    borderRadius: "50%", 
                    background: "#fef3c7", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M24 16v8M24 28h.01"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <p style={{ marginBottom: "1.5rem", color: "#64748b", lineHeight: "1.6" }}>
                  {t("admin.jobModeration.orgNotApprovedMessage") || "Tổ chức"} <strong style={{ color: "#374151" }}>"{selectedJob.organization?.name}"</strong> {t("admin.jobModeration.orgNotApprovedMessage2") || "chưa được duyệt. Bạn có muốn duyệt tổ chức này cùng lúc với công việc không?"}
                </p>
                <div style={{ 
                  background: "#fef3c7", 
                  border: "1px solid #fbbf24", 
                  borderRadius: "12px", 
                  padding: "1rem 1.25rem",
                  marginBottom: "1.5rem"
                }}>
                  <p style={{ marginBottom: "0.75rem", fontWeight: 600, color: "#92400e" }}>
                    <strong>{t("admin.jobModeration.noteTitle")}</strong>
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#78350f" }}>
                    <li style={{ marginBottom: "0.5rem" }}>{t("admin.jobModeration.note1")}</li>
                    <li style={{ marginBottom: "0.5rem" }}>{t("admin.jobModeration.note2")}</li>
                    <li>{t("admin.jobModeration.note3")}</li>
                  </ul>
                </div>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowOrgApprovalModal(false);
                  }}
                >
                  {t("admin.jobModeration.approveJobOnly") || "Chỉ duyệt công việc"}
                </button>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSuccess}`}
                  onClick={() => {
                    setShowOrgApprovalModal(false);
                    handleApprove(selectedJob.id, true);
                  }}
                  disabled={processing === selectedJob.id}
                >
                  {processing === selectedJob.id
                    ? t("admin.jobModeration.loading") || "Đang tải..."
                    : t("admin.jobModeration.approveBoth") || "Duyệt cả tổ chức và công việc"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveConfirm && (
          <div className={commonStyles.adminModalOverlay}>
            <div className={commonStyles.adminModal}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.jobModeration.confirmApproveJob") || "Xác nhận duyệt công việc"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setSelectedJob(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p>Bạn có chắc chắn muốn duyệt công việc này không?</p>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setSelectedJob(null);
                  }}
                  disabled={processing === selectedJob?.id}
                >
                  Hủy
                </button>
                <button 
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSuccess}`} 
                  onClick={() => handleApprove(selectedJob?.id, false)}
                  disabled={processing === selectedJob?.id}
                >
                  {processing === selectedJob?.id ? (t("admin.jobModeration.loading") || "Đang tải...") : (t("admin.common.confirm") || "Xác nhận duyệt")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectConfirm && (
          <div className={commonStyles.adminModalOverlay}>
            <div className={commonStyles.adminModal}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.jobModeration.confirmRejectTitle") || "Xác nhận từ chối công việc"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setSelectedJob(null);
                    setReviewNotes("");
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                  {t("admin.jobModeration.confirmRejectMessage") || "Bạn có chắc chắn muốn từ chối công việc này không?"}
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#374151" }}>
                    {t("admin.jobModeration.rejectReason") || "Lý do từ chối"} <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <textarea
                    className={commonStyles.adminModalTextarea}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t("admin.jobModeration.rejectReasonPlaceholder") || "Nhập lý do từ chối..."}
                    rows={4}
                    style={{ width: "100%", resize: "vertical", minHeight: "100px" }}
                  />
                </div>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setSelectedJob(null);
                    setReviewNotes("");
                  }}
                  disabled={processing === selectedJob?.id}
                >
                  {t("admin.common.cancel") || "Hủy"}
                </button>
                <button 
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonDanger}`} 
                  onClick={handleReject}
                  disabled={processing === selectedJob?.id || !reviewNotes.trim()}
                >
                  {processing === selectedJob?.id ? (t("admin.jobModeration.loading") || "Đang tải...") : (t("admin.common.confirm") || "Xác nhận từ chối")}
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
