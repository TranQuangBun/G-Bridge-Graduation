import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import alertService from "../../services/alertService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./OrganizationApprovalPage.module.css";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner } from "react-icons/fa";

const OrganizationApprovalPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add status filter - use "status" parameter for admin endpoint
      // When "all", don't send status filter to get all organizations
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      // Add search parameter
      if (search.trim()) {
        params.search = search.trim();
      }

      // Use adminService instead of organizationService for admin page
      // adminService.getOrganizations() returns response.data from axios
      // sendPaginated format: { success: true, data: [...], pagination: {...} }
      const response = await adminService.getOrganizations(params);
      
      if (response && response.success) {
        // response.data is the array of organizations from sendPaginated
        const organizationsData = Array.isArray(response.data) 
          ? response.data 
          : [];
        const paginationData = response.pagination;
        
        setOrganizations(organizationsData);
        if (paginationData) {
          setPagination((prev) => ({
            ...prev,
            ...paginationData,
          }));
        }
      } else {
        console.error("Response not successful:", response);
        setOrganizations([]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, search]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const timeoutId = setTimeout(() => {
        fetchOrganizations();
      }, search ? 500 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user, pagination.page, statusFilter, search, fetchOrganizations]);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await adminService.approveOrganization(id);
      await fetchOrganizations();
      setShowModal(false);
      setShowApprovalModal(false);
      setSelectedOrg(null);
    } catch (error) {
      console.error("Error approving organization:", error);
      await alertService.error(error.message || t("admin.organizationApproval.approveFailed"));
    } finally {
      setProcessing(null);
    }
  };

  const openApprovalModal = (org) => {
    setSelectedOrg(org);
    setShowApprovalModal(true);
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      await alertService.warning(t("admin.organizationApproval.rejectReasonRequired"));
      return;
    }
    setProcessing(id);
    try {
      await adminService.rejectOrganization(id, rejectionReason);
      await fetchOrganizations();
      setShowModal(false);
      setSelectedOrg(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting organization:", error);
      await alertService.error(error.message || t("admin.organizationApproval.rejectFailed"));
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (org) => {
    setSelectedOrg(org);
    setRejectionReason("");
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: t("admin.organizationApproval.pending") || "Chờ duyệt", className: commonStyles.adminBadgePending },
      approved: { label: t("admin.organizationApproval.approved") || "Đã duyệt", className: commonStyles.adminBadgeActive },
      rejected: { label: t("admin.organizationApproval.rejected") || "Từ chối", className: commonStyles.adminBadgeInactive },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={statusInfo.className}>
        {statusInfo.label}
      </span>
    );
  };

  const toggleMenu = (orgId, e) => {
    e.stopPropagation();

    if (openMenuId === orgId) {
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
    setOpenMenuId(orgId);
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

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div className={commonStyles.adminFilters}>
          <div className={commonStyles.adminFilterGroup} style={{ flex: 1, minWidth: "300px" }}>
            <input
              type="text"
              className={commonStyles.adminFilterInput}
              placeholder={t("admin.organizationApproval.searchPlaceholder") || "Tìm theo tên tổ chức hoặc email..."}
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
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="all">{t("admin.organizationApproval.all") || "Tất cả"}</option>
              <option value="pending">{t("admin.organizationApproval.pending") || "Chờ duyệt"}</option>
              <option value="approved">{t("admin.organizationApproval.approved") || "Đã duyệt"}</option>
              <option value="rejected">{t("admin.organizationApproval.rejected") || "Từ chối"}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>{t("admin.organizationApproval.loading") || "Đang tải..."}</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <p>{t("admin.organizationApproval.noOrganizations") || "Không có tổ chức nào"}</p>
          </div>
        ) : (
          <>
            <div className={commonStyles.adminTableContainer}>
              <table className={commonStyles.adminTable}>
                <thead>
                  <tr>
                    <th>{t("admin.organizationApproval.order") || "Thứ tự"}</th>
                    <th>{t("admin.organizationApproval.organizationName") || "Tên tổ chức"}</th>
                    <th>{t("admin.organizationApproval.status") || "Trạng thái"}</th>
                    <th>{t("admin.organizationApproval.email") || "Email"}</th>
                    <th>{t("admin.organizationApproval.website") || "Website"}</th>
                    <th>{t("admin.organizationApproval.businessLicense") || "Giấy phép KD"}</th>
                    <th>{t("admin.organizationApproval.owner") || "Chủ sở hữu"}</th>
                    <th>{t("admin.organizationApproval.submissionDate") || "Ngày gửi"}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org, index) => (
                    <tr key={org.id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td className={styles.orgNameCell}>
                        <div className={styles.orgNameWrap}>
                          {org.logo && (
                            <img
                              src={org.logo}
                              alt={org.name}
                              className={styles.logoThumb}
                            />
                          )}
                          <div>
                            <span>{org.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(org.approvalStatus)}</td>
                      <td className={styles.emailCell}>
                        {org.email ? (
                          <span title={org.email}>{org.email}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.websiteCell}>
                        {org.website ? (
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#3b82f6", textDecoration: "none" }}
                            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                          >
                            {org.website.length > 30 ? `${org.website.substring(0, 30)}...` : org.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.licenseCell}>
                        {org.businessLicense ? (
                          <a
                            href={org.businessLicense}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewLicenseBtn}
                            title={t("admin.organizationApproval.viewBusinessLicense") || "Xem giấy phép kinh doanh"}
                          >
                            {t("admin.organizationApproval.viewFile") || "Xem file"}
                          </a>
                        ) : (
                          <span className={styles.noFile}>—</span>
                        )}
                      </td>
                      <td>
                        {org.owner
                          ? org.owner.fullName || org.owner.email
                          : "—"}
                      </td>
                      <td>{formatDate(org.createdAt)}</td>
                      <td>
                        <div className={commonStyles.adminMenuContainer}>
                          <button
                            className={commonStyles.adminMenuButton}
                            onClick={(e) => toggleMenu(org.id, e)}
                            disabled={processing === org.id}
                          >
                            <span className={commonStyles.adminMenuDots}>⋮</span>
                          </button>
                          {openMenuId === org.id && (
                            <div
                              className={commonStyles.adminContextMenu}
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                              }}
                            >
                              <button
                                className={commonStyles.adminMenuItem}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openApprovalModal(org);
                                }}
                                disabled={processing === org.id || org.approvalStatus === "approved"}
                              >
                                {processing === org.id ? (t("admin.organizationApproval.processing") || "Đang xử lý...") : (t("admin.organizationApproval.approve") || "Duyệt")}
                              </button>
                              <button
                                className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemDanger}`}
                                onClick={() => {
                                  setOpenMenuId(null);
                                  openRejectModal(org);
                                }}
                                disabled={processing === org.id || org.approvalStatus === "rejected"}
                              >
                                {t("admin.organizationApproval.reject") || "Từ chối"}
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

            {pagination.totalPages > 1 && (
              <div className={commonStyles.adminPagination}>
                <button
                  className={commonStyles.adminPaginationButton}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  {t("admin.organizationApproval.previous") || "Trước"}
                </button>
                <span className={commonStyles.adminPaginationInfo}>
                  {t("admin.organizationApproval.page") || "Trang"} {pagination.page} / {pagination.totalPages} ({t("admin.organizationApproval.total") || "Tổng"}: {pagination.total})
                </span>
                <button
                  className={commonStyles.adminPaginationButton}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  {t("admin.organizationApproval.next") || "Sau"}
                </button>
              </div>
            )}
          </>
        )}

        {showApprovalModal && selectedOrg && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => setShowApprovalModal(false)}
          >
            <div
              className={commonStyles.adminModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={commonStyles.adminModalHeader}>
                <h3>Xác nhận duyệt tổ chức</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedOrg(null);
                  }}
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
                    background: "#dcfce7", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M20 24l4 4 8-8"
                        stroke="#16a34a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <p style={{ textAlign: "center", color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                  {t("admin.organizationApproval.preparingToApprove") || "Bạn đang chuẩn bị duyệt tổ chức"}{" "}
                  <strong style={{ color: "#0f172a" }}>"{selectedOrg.name}"</strong>.
                </p>
                <div style={{
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginTop: "1rem"
                }}>
                  <p style={{ marginBottom: "0.75rem", fontWeight: 600, color: "#92400e" }}>
                    <strong>{t("admin.organizationApproval.importantNote") || "Lưu ý quan trọng:"}</strong>
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#78350f" }}>
                    <li style={{ marginBottom: "0.5rem" }}>
                      {t("admin.organizationApproval.noteOrgActivated") || "Tổ chức sẽ được kích hoạt và có thể đăng tin tuyển dụng"}
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>{t("admin.organizationApproval.noteOwnerNotification") || "Chủ sở hữu sẽ nhận được thông báo về việc phê duyệt"}</li>
                    <li style={{ marginBottom: "0.5rem" }}>{t("admin.organizationApproval.noteOrgPublic") || "Tổ chức sẽ hiển thị công khai trên hệ thống"}</li>
                    <li>{t("admin.organizationApproval.cannotUndo") || "Hành động này không thể hoàn tác"}</li>
                  </ul>
                </div>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedOrg(null);
                  }}
                >
                  {t("admin.common.cancel") || "Hủy"}
                </button>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSuccess}`}
                  onClick={() => handleApprove(selectedOrg.id)}
                  disabled={processing === selectedOrg.id}
                >
                  {processing === selectedOrg.id
                    ? (t("admin.organizationApproval.processing") || "Đang xử lý...")
                    : (t("admin.common.confirm") || "Xác nhận duyệt")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedOrg && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={commonStyles.adminModal} onClick={(e) => e.stopPropagation()}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.organizationApproval.rejectTitle") || "Từ chối tổ chức"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrg(null);
                    setRejectionReason("");
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p style={{ marginBottom: "1rem", color: "#64748b" }}>{t("admin.organizationApproval.organizationName") || "Tổ chức"}: <strong>{selectedOrg.name}</strong></p>
                <textarea
                  className={commonStyles.adminFilterInput}
                  placeholder={t("admin.organizationApproval.rejectReasonPlaceholder") || "Nhập lý do từ chối..."}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  style={{ width: "100%", resize: "vertical", minHeight: "100px" }}
                />
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrg(null);
                    setRejectionReason("");
                  }}
                >
                  {t("admin.common.cancel") || "Hủy"}
                </button>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonDanger}`}
                  onClick={() => handleReject(selectedOrg.id)}
                  disabled={
                    !rejectionReason.trim() || processing === selectedOrg.id
                  }
                >
                  {processing === selectedOrg.id
                    ? (t("admin.organizationApproval.processing") || "Đang xử lý...")
                    : (t("admin.common.confirm") || "Xác nhận từ chối")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrganizationApprovalPage;
