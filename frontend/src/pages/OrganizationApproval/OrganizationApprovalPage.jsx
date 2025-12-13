import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./OrganizationApprovalPage.module.css";

const OrganizationApprovalPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [detailOrg, setDetailOrg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getPendingOrganizations({
        page: pagination.page,
        limit: pagination.limit,
      });
      console.log("Organizations response:", response);
      if (response.success) {
        // sendPaginated trả về data là array trực tiếp, pagination là object riêng
        setOrganizations(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching pending organizations:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchOrganizations();
    }
  }, [isAuthenticated, user, pagination.page, fetchOrganizations]);

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
      alert(error.message || "Không thể duyệt tổ chức");
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
      alert("Vui lòng nhập lý do từ chối");
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
      alert(error.message || "Không thể từ chối tổ chức");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (org) => {
    setSelectedOrg(org);
    setRejectionReason("");
    setShowModal(true);
  };

  const openDetailModal = (org) => {
    setDetailOrg(org);
    setShowDetailModal(true);
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Duyệt tổ chức</h1>
          <p>Danh sách tổ chức đang chờ duyệt</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : organizations.length === 0 ? (
          <div className={styles.empty}>
            Không có tổ chức nào đang chờ duyệt
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.orgTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên tổ chức</th>
                    <th>Email</th>
                    <th>Website</th>
                    <th>Chủ sở hữu</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td>{org.id}</td>
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
                            <button
                              className={styles.orgNameBtn}
                              onClick={() => openDetailModal(org)}
                            >
                              {org.name}
                            </button>
                            <span className={styles.badge}>Chờ duyệt</span>
                          </div>
                        </div>
                      </td>
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
                            title={org.website}
                          >
                            Link
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {org.owner
                          ? org.owner.fullName || org.owner.email
                          : "—"}
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            className={styles.approveButton}
                            onClick={() => openApprovalModal(org)}
                            disabled={processing === org.id}
                          >
                            {processing === org.id ? "Đang xử lý..." : "Duyệt"}
                          </button>
                          <button
                            className={styles.rejectButton}
                            onClick={() => openRejectModal(org)}
                            disabled={processing === org.id}
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  disabled={pagination.page === 1}
                >
                  Trước
                </button>
                <span>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}

        {showDetailModal && detailOrg && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className={styles.detailModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Chi tiết tổ chức</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.detailContent}>
                {detailOrg.logo && (
                  <img
                    src={detailOrg.logo}
                    alt={detailOrg.name}
                    className={styles.detailLogo}
                  />
                )}
                <div className={styles.detailRow}>
                  <strong>Tên tổ chức:</strong>
                  <span>{detailOrg.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Email:</strong>
                  <span>{detailOrg.email || "—"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Điện thoại:</strong>
                  <span>{detailOrg.phone || "—"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Website:</strong>
                  {detailOrg.website ? (
                    <a
                      href={detailOrg.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {detailOrg.website}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className={styles.detailRow}>
                  <strong>Địa chỉ:</strong>
                  <span>
                    {detailOrg.address || detailOrg.province
                      ? [detailOrg.address, detailOrg.province]
                          .filter(Boolean)
                          .join(", ")
                      : "—"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Chủ sở hữu:</strong>
                  <span>
                    {detailOrg.owner
                      ? detailOrg.owner.fullName || detailOrg.owner.email
                      : "—"}
                  </span>
                </div>
                {detailOrg.description && (
                  <div className={styles.detailRow}>
                    <strong>Mô tả:</strong>
                    <p>{detailOrg.description}</p>
                  </div>
                )}
              </div>
              <div className={styles.detailActions}>
                <button
                  className={styles.approveButton}
                  onClick={() => {
                    setShowDetailModal(false);
                    openApprovalModal(detailOrg);
                  }}
                  disabled={processing === detailOrg.id}
                >
                  {processing === detailOrg.id ? "Đang xử lý..." : "Duyệt"}
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={() => {
                    setShowDetailModal(false);
                    openRejectModal(detailOrg);
                  }}
                  disabled={processing === detailOrg.id}
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {showApprovalModal && selectedOrg && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowApprovalModal(false)}
          >
            <div
              className={styles.confirmModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.confirmIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#dcfce7" />
                  <path
                    d="M20 24l4 4 8-8"
                    stroke="#16a34a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3>Xác nhận duyệt tổ chức</h3>
              <p className={styles.confirmText}>
                Bạn đang chuẩn bị duyệt tổ chức{" "}
                <strong>"{selectedOrg.name}"</strong>.
              </p>
              <div className={styles.warningBox}>
                <p>
                  <strong>⚠️ Lưu ý quan trọng:</strong>
                </p>
                <ul>
                  <li>
                    Tổ chức sẽ được kích hoạt và có thể đăng tin tuyển dụng
                  </li>
                  <li>Chủ sở hữu sẽ nhận được thông báo về việc phê duyệt</li>
                  <li>Tổ chức sẽ hiển thị công khai trên hệ thống</li>
                  <li>Hành động này không thể hoàn tác</li>
                </ul>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedOrg(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  className={styles.confirmApproveButton}
                  onClick={() => handleApprove(selectedOrg.id)}
                  disabled={processing === selectedOrg.id}
                >
                  {processing === selectedOrg.id
                    ? "Đang xử lý..."
                    : "Xác nhận duyệt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedOrg && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Từ chối tổ chức</h3>
              <p>Tổ chức: {selectedOrg.name}</p>
              <textarea
                className={styles.reasonInput}
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrg(null);
                    setRejectionReason("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className={styles.confirmRejectButton}
                  onClick={() => handleReject(selectedOrg.id)}
                  disabled={
                    !rejectionReason.trim() || processing === selectedOrg.id
                  }
                >
                  {processing === selectedOrg.id
                    ? "Đang xử lý..."
                    : "Xác nhận từ chối"}
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
