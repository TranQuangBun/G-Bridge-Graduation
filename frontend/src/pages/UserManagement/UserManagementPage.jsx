import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./UserManagementPage.module.css";

const UserManagementPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
  const [selectedUser, setSelectedUser] = useState(null);

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
    setShowToggleConfirm(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    setProcessing(selectedUser.id);
    setShowToggleConfirm(false);
    try {
      await adminService.toggleUserStatus(selectedUser.id);
      await fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Error toggling user status:", error);
      alert(error.message || "Không thể thay đổi trạng thái người dùng");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (userId) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    setProcessing(userId);
    try {
      await adminService.deleteUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error.message || "Không thể xóa người dùng");
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

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className={styles.container}>
          <div className={styles.loading}>Đang tải...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Quản lý tài khoản</h1>
          <p>Quản lý người dùng trong hệ thống</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={search}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className={styles.filterSelect}
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="client">Khách hàng</option>
              <option value="interpreter">Phiên dịch viên</option>
            </select>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className={styles.filterSelect}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã khóa</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Xác thực</th>
                <th>Ngày tạo</th>
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
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {user.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.isVerified ? styles.verified : styles.unverified
                        }
                      >
                        {user.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                      </span>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={
                            user.isActive
                              ? styles.deactiveButton
                              : styles.activeButton
                          }
                          onClick={() => confirmToggleStatus(user)}
                          disabled={processing === user.id}
                        >
                          {processing === user.id
                            ? "..."
                            : user.isActive
                            ? "Deactive"
                            : "Active"}
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(user.id)}
                          disabled={processing === user.id}
                          title="Xóa tài khoản"
                        >
                          🗑️
                        </button>
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
              Trang {pagination.page} / {pagination.totalPages} (Tổng:{" "}
              {pagination.total})
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

        <div className={styles.backButton}>
          <button
            onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            className={styles.backBtn}
          >
            ← Quay lại Dashboard
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showToggleConfirm && selectedUser && (
        <div
          className={styles.confirmOverlay}
          onClick={() => setShowToggleConfirm(false)}
        >
          <div
            className={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Xác nhận thay đổi trạng thái</h3>
            <p>
              Bạn có chắc muốn{" "}
              <strong>
                {selectedUser.isActive
                  ? "vô hiệu hóa (Deactive)"
                  : "kích hoạt (Active)"}
              </strong>{" "}
              tài khoản của <strong>{selectedUser.name}</strong>?
            </p>
            <div className={styles.confirmButtons}>
              <button
                onClick={handleToggleStatus}
                className={styles.confirmBtn}
              >
                Xác nhận
              </button>
              <button
                onClick={() => {
                  setShowToggleConfirm(false);
                  setSelectedUser(null);
                }}
                className={styles.cancelBtn}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagementPage;
