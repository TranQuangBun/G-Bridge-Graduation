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
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(null);
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

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getPendingOrganizations({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success && response.data) {
        setOrganizations(response.data.organizations || []);
        setPagination(response.data.pagination || pagination);
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
      setSelectedOrg(null);
    } catch (error) {
      console.error("Error approving organization:", error);
      alert(error.message || "Không thể duyệt tổ chức");
    } finally {
      setProcessing(null);
    }
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
          <div className={styles.empty}>Không có tổ chức nào đang chờ duyệt</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.orgTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên tổ chức</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Website</th>
                    <th>Địa chỉ</th>
                    <th>Chủ sở hữu</th>
                    <th>Tham chiếu</th>
                    <th>Mô tả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id}>
                      <td>{org.id}</td>
                      <td className={styles.orgNameCell}>
                        <div className={styles.orgNameWrap}>
                          {org.logo && (
                            <img src={org.logo} alt={org.name} className={styles.logoThumb} />
                          )}
                          <div>
                            <div className={styles.orgName}>{org.name}</div>
                            <span className={styles.badge}>Chờ duyệt</span>
                          </div>
                        </div>
                      </td>
                      <td>{org.email || "—"}</td>
                      <td>{org.phone || "—"}</td>
                      <td>
                        {org.website ? (
                          <a href={org.website} target="_blank" rel="noopener noreferrer">
                            {org.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {org.address || org.province
                          ? [org.address, org.province].filter(Boolean).join(", ")
                          : "—"}
                      </td>
                      <td>{org.owner ? org.owner.fullName || org.owner.email : "—"}</td>
                      <td>
                        {org.logo ? (
                          <a
                            href={org.logo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.referenceLink}
                          >
                            Xem tham chiếu
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={styles.descriptionCell}>
                        {org.description || "—"}
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            className={styles.approveButton}
                            onClick={() => handleApprove(org.id)}
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
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Trước
                </button>
                <span>
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}

        {showModal && selectedOrg && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
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
                  disabled={!rejectionReason.trim() || processing === selectedOrg.id}
                >
                  {processing === selectedOrg.id ? "Đang xử lý..." : "Xác nhận từ chối"}
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

