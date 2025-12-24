import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import alertService from "../../services/alertService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./UserManagementPage.module.css";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner } from "react-icons/fa";

const UserManagementPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [processing, setProcessing] = useState(null);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toggleReason, setToggleReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) {
        params.search = search;
      }
      if (roleFilter) {
        params.role = roleFilter;
      }
      if (statusFilter) {
        params.isActive =
          statusFilter === "active"
            ? "true"
            : statusFilter === "inactive"
            ? "false"
            : "";
      }

      const response = await adminService.getAllUsers(params);

      if (response.success) {
        // sendPaginated returns: { success: true, message, data: users[], pagination: {...} }
        // So data is the users array directly, not an object with users property
        const usersData = Array.isArray(response.data)
          ? response.data
          : response.data?.users || [];
        const paginationData = response.pagination || response.data?.pagination;
        setUsers(usersData);
        if (paginationData) {
          setPagination((prev) => paginationData || prev);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const timeoutId = setTimeout(
        () => {
          fetchUsers();
        },
        search ? 500 : 0
      );
      return () => clearTimeout(timeoutId);
    }
  }, [
    isAuthenticated,
    user,
    pagination.page,
    search,
    roleFilter,
    statusFilter,
    fetchUsers,
  ]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const confirmToggleStatus = (user) => {
    setSelectedUser(user);
    setToggleReason("");
    setShowToggleConfirm(true);
  };

  const confirmDelete = (user) => {
    setSelectedUser(user);
    setDeleteReason("");
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    
    // Only require reason when deactivating (locking) account
    const willBeActive = !selectedUser.isActive;
    if (!willBeActive && !toggleReason.trim()) {
      await alertService.error("Vui lòng nhập lý do khóa tài khoản");
      return;
    }

    setProcessing(selectedUser.id);
    setShowToggleConfirm(false);
    try {
      // Only send reason when deactivating
      const reason = willBeActive ? "" : toggleReason;
      await adminService.toggleUserStatus(selectedUser.id, reason);
      await fetchUsers();
      setSelectedUser(null);
      setToggleReason("");
      await alertService.success(t("admin.userManagement.changeStatusSuccess") || "Thay đổi trạng thái thành công");
    } catch (error) {
      console.error("Error toggling user status:", error);
      await alertService.error(error.message || t("admin.userManagement.changeStatusFailed"));
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    if (!deleteReason.trim()) {
      await alertService.error("Vui lòng nhập lý do");
      return;
    }

    setProcessing(selectedUser.id);
    setShowDeleteConfirm(false);
    try {
      await adminService.deleteUser(selectedUser.id, deleteReason);
      await fetchUsers();
      setSelectedUser(null);
      setDeleteReason("");
      await alertService.success(t("admin.userManagement.deleteSuccess") || "Xóa tài khoản thành công");
    } catch (error) {
      console.error("Error deleting user:", error);
      await alertService.error(error.message || t("admin.userManagement.deleteFailed"));
    } finally {
      setProcessing(null);
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      admin: "Quản trị viên",
      client: "Khách hàng",
      interpreter: "Phiên dịch viên",
    };
    return roleMap[role] || role;
  };

  const toggleMenu = (userId, e) => {
    e.stopPropagation();

    if (openMenuId === userId) {
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
    setOpenMenuId(userId);
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

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className={commonStyles.adminContainer}>
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>Đang tải...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div className={commonStyles.adminFilters}>
          <div className={commonStyles.adminSearchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={search}
              onChange={handleSearch}
              className={commonStyles.adminSearchInput}
            />
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className={commonStyles.adminFilterSelect}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="client">Khách hàng</option>
              <option value="interpreter">Phiên dịch viên</option>
            </select>
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className={commonStyles.adminFilterSelect}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className={commonStyles.adminTableContainer}>
          <table className={commonStyles.adminTable}>
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Xác thực</th>
                <th>Ngày gửi</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noData}>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={commonStyles.adminBadgeRole}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.isActive
                            ? commonStyles.adminBadgeActive
                            : commonStyles.adminBadgeInactive
                        }
                      >
                        {user.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.isVerified ? commonStyles.adminBadgeVerified : commonStyles.adminBadgeUnverified
                        }
                      >
                        {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className={commonStyles.adminMenuContainer}>
                        <button
                          className={commonStyles.adminMenuButton}
                          onClick={(e) => toggleMenu(user.id, e)}
                          disabled={processing === user.id}
                        >
                          <span className={commonStyles.adminMenuDots}>⋮</span>
                        </button>
                        {openMenuId === user.id && (
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
                                confirmToggleStatus(user);
                              }}
                              disabled={processing === user.id || user.isActive}
                            >
                              {processing === user.id ? "..." : "Kích hoạt tài khoản"}
                            </button>
                            <button
                              className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemDanger}`}
                              onClick={() => {
                                setOpenMenuId(null);
                                confirmToggleStatus(user);
                              }}
                              disabled={processing === user.id || !user.isActive}
                            >
                              Khóa tài khoản
                            </button>
                            <button
                              className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemDanger}`}
                              onClick={() => {
                                setOpenMenuId(null);
                                confirmDelete(user);
                              }}
                              disabled={processing === user.id}
                            >
                              Xóa tài khoản
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
              disabled={pagination.page === 1}
              className={styles.pageButton}
            >
              Trước
            </button>
            <span className={styles.pageInfo}>
              {t("admin.userManagement.page")} {pagination.page} / {pagination.totalPages} ({t("admin.userManagement.total")}: {pagination.total})
            </span>
            <button
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(p.totalPages, p.page + 1),
                }))
              }
              disabled={pagination.page === pagination.totalPages}
              className={styles.pageButton}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showToggleConfirm && selectedUser && (
        <div
          className={commonStyles.adminModalOverlay}
          onClick={() => setShowToggleConfirm(false)}
        >
          <div
            className={commonStyles.adminModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={commonStyles.adminModalHeader} style={{ borderBottomColor: selectedUser.isActive ? "#fee2e2" : "#e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {selectedUser.isActive && (
                  <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    background: "#fee2e2", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        stroke="#dc2626"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <h3 style={{ color: selectedUser.isActive ? "#dc2626" : "#0f172a", margin: 0 }}>
                  {selectedUser.isActive ? "Xác nhận khóa tài khoản" : "Xác nhận kích hoạt tài khoản"}
                </h3>
              </div>
              <button
                className={commonStyles.adminModalCloseBtn}
                onClick={() => {
                  setShowToggleConfirm(false);
                  setSelectedUser(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.adminModalBody}>
              <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                Bạn có chắc muốn{" "}
                <strong style={{ color: selectedUser.isActive ? "#dc2626" : "#374151" }}>
                  {selectedUser.isActive
                    ? "vô hiệu hóa (Deactive)"
                    : "kích hoạt (Active)"}
                </strong>{" "}
                tài khoản của <strong style={{ color: "#374151" }}>{selectedUser.fullName || selectedUser.name}</strong>?
              </p>
              {selectedUser.isActive && (
                <div className={commonStyles.adminModalSection}>
                  <h3>Lý do *</h3>
                  <textarea
                    className={commonStyles.adminModalTextarea}
                    value={toggleReason}
                    onChange={(e) => setToggleReason(e.target.value)}
                    placeholder="Nhập lý do khóa tài khoản..."
                    rows={4}
                  />
                </div>
              )}
            </div>
            <div className={commonStyles.adminModalActions}>
              <button
                className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                onClick={() => {
                  setShowToggleConfirm(false);
                  setSelectedUser(null);
                  setToggleReason("");
                }}
                disabled={processing === selectedUser.id}
              >
                Hủy
              </button>
              <button
                className={`${commonStyles.adminButton} ${selectedUser.isActive ? commonStyles.adminButtonDanger : commonStyles.adminButtonSuccess}`}
                onClick={handleToggleStatus}
                disabled={processing === selectedUser.id || (selectedUser.isActive && !toggleReason.trim())}
              >
                {processing === selectedUser.id ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div
          className={commonStyles.adminModalOverlay}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className={commonStyles.adminModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={commonStyles.adminModalHeader} style={{ borderBottomColor: "#fee2e2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "#fee2e2", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      stroke="#dc2626"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 style={{ color: "#dc2626", margin: 0 }}>Xác nhận xóa tài khoản</h3>
              </div>
              <button
                className={commonStyles.adminModalCloseBtn}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                  setDeleteReason("");
                }}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.adminModalBody}>
              <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                Bạn có chắc muốn <strong style={{ color: "#dc2626" }}>xóa vĩnh viễn</strong> tài khoản của{" "}
                <strong style={{ color: "#374151" }}>{selectedUser.fullName || selectedUser.name}</strong>?
                <br />
                <span style={{ color: "#dc2626", fontSize: "0.875rem" }}>
                  Hành động này không thể hoàn tác!
                </span>
              </p>
              <div className={commonStyles.adminModalSection}>
                <h3>Lý do *</h3>
                <textarea
                  className={commonStyles.adminModalTextarea}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Nhập lý do xóa tài khoản..."
                  rows={4}
                />
              </div>
            </div>
            <div className={commonStyles.adminModalActions}>
              <button
                className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                  setDeleteReason("");
                }}
                disabled={processing === selectedUser.id}
              >
                Hủy
              </button>
              <button
                className={`${commonStyles.adminButton} ${commonStyles.adminButtonDanger}`}
                onClick={handleDelete}
                disabled={processing === selectedUser.id || !deleteReason.trim()}
              >
                {processing === selectedUser.id ? "Đang xử lý..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && detailUser && (
        <div
          className={commonStyles.adminModalOverlay}
          onClick={() => {
            setShowDetailModal(false);
            setDetailUser(null);
          }}
        >
          <div
            className={commonStyles.adminModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={commonStyles.adminModalHeader}>
              <h3>Chi tiết người dùng</h3>
              <button
                className={commonStyles.adminModalCloseBtn}
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailUser(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={commonStyles.adminModalBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>ID:</strong>
                  <span style={{ color: "#64748b" }}>#{detailUser.id}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Họ và tên:</strong>
                  <span style={{ color: "#64748b" }}>{detailUser.fullName || "N/A"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Email:</strong>
                  <span style={{ color: "#64748b" }}>{detailUser.email || "N/A"}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Vai trò:</strong>
                  <span className={commonStyles.adminBadgeRole}>
                    {getRoleLabel(detailUser.role)}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Trạng thái:</strong>
                  <span
                    className={
                      detailUser.isActive
                        ? commonStyles.adminBadgeActive
                        : commonStyles.adminBadgeInactive
                    }
                  >
                    {detailUser.isActive ? "Hoạt động" : "Đã khóa"}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Xác thực:</strong>
                  <span
                    className={
                      detailUser.isVerified
                        ? commonStyles.adminBadgeVerified
                        : commonStyles.adminBadgeUnverified
                    }
                  >
                    {detailUser.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                  </span>
                </div>
                {detailUser.phone && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Số điện thoại:</strong>
                    <span style={{ color: "#64748b" }}>{detailUser.phone}</span>
                  </div>
                )}
                {detailUser.address && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Địa chỉ:</strong>
                    <span style={{ color: "#64748b" }}>{detailUser.address}</span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Ngày tạo:</strong>
                  <span style={{ color: "#64748b" }}>
                    {new Date(detailUser.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                {detailUser.updatedAt && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <strong style={{ color: "#374151", fontSize: "0.875rem" }}>Cập nhật lần cuối:</strong>
                    <span style={{ color: "#64748b" }}>
                      {new Date(detailUser.updatedAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;
