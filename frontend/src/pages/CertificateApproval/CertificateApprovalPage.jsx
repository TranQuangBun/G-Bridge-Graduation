import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./CertificateApprovalPage.module.css";

const CertificateApprovalPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [actionCertId, setActionCertId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [viewCert, setViewCert] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCert, setDetailCert] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const fetchCertifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (search) {
        params.search = search;
      }

      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      console.log("Fetching certifications with params:", params);

      const response = await adminService.getPendingCertifications(params);

      console.log("Certifications response:", response);

      if (response.success) {
        // Backend returns { data: [certifications], pagination: {...} }
        const certsData = Array.isArray(response.data)
          ? response.data
          : response.data?.certifications || [];
        setCertifications(certsData);
        setPagination((prev) => response.pagination || prev);
      } else {
        console.error("Response not successful:", response);
        setCertifications([]);
      }
    } catch (error) {
      console.error("Error fetching certifications:", error);
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const timeoutId = setTimeout(
        () => {
          fetchCertifications();
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
    statusFilter,
    fetchCertifications,
  ]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "Chờ duyệt", className: styles.statusPending },
      approved: { label: "Đã duyệt", className: styles.statusApproved },
      rejected: { label: "Đã từ chối", className: styles.statusRejected },
      draft: { label: "Bản nháp", className: styles.statusDraft },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      className: styles.statusDefault,
    };
    return <span className={statusInfo.className}>{statusInfo.label}</span>;
  };

  const confirmApprove = (id) => {
    setActionCertId(id);
    setShowApproveConfirm(true);
  };

  const handleApprove = async () => {
    const id = actionCertId;
    setProcessing(id);
    setShowApproveConfirm(false);
    try {
      await adminService.approveCertification(id);
      await fetchCertifications();
      setShowModal(false);
      setSelectedCert(null);
      setActionCertId(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error approving certification:", error);
      alert(error.message || "Không thể duyệt chứng chỉ");
    } finally {
      setProcessing(null);
    }
  };

  const confirmReject = (id) => {
    if (!rejectionReason.trim()) {
      alert("Vui lòng nhập lý do từ chối");
      return;
    }
    setActionCertId(id);
    setShowRejectConfirm(true);
  };

  const handleReject = async () => {
    const id = actionCertId;
    setProcessing(id);
    setShowRejectConfirm(false);
    try {
      await adminService.rejectCertification(id, rejectionReason);
      await fetchCertifications();
      setShowModal(false);
      setSelectedCert(null);
      setRejectionReason("");
      setActionCertId(null);
    } catch (error) {
      console.error("Error rejecting certification:", error);
      alert(error.message || "Không thể từ chối chứng chỉ");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (cert) => {
    setSelectedCert(cert);
    setRejectionReason("");
    setShowModal(true);
    setOpenMenuId(null); // Close menu when opening modal
  };

  const toggleMenu = (certId, e) => {
    e.stopPropagation();

    if (openMenuId === certId) {
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

    // Adjust if menu goes off screen
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - 4;
    }

    if (left < 0) {
      left = rect.left;
    }

    setMenuPosition({ top, left });
    setOpenMenuId(certId);
  };

  const handleApproveFromMenu = (cert) => {
    setOpenMenuId(null);
    confirmApprove(cert.id);
  };

  const handleRejectFromMenu = (cert) => {
    setOpenMenuId(null);
    openRejectModal(cert);
  };

  const handleViewCert = (cert) => {
    setViewCert(cert);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const openDetailModal = (cert) => {
    setDetailCert(cert);
    setShowDetailModal(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.menuContainer}`)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const isPdfUrl = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    // Check for PDF extension or PDF in URL
    return (
      lowerUrl.endsWith(".pdf") ||
      lowerUrl.includes(".pdf") ||
      lowerUrl.includes("pdf") ||
      lowerUrl.includes("application/pdf")
    );
  };

  const getPdfUrl = (cert) => {
    console.log("Checking PDF for cert:", cert);
    // Check if credentialUrl is a PDF
    if (cert.credentialUrl && isPdfUrl(cert.credentialUrl)) {
      console.log("Found PDF in credentialUrl:", cert.credentialUrl);
      return cert.credentialUrl;
    }
    // Check if imageUrl is a PDF (PDFs can be uploaded as images)
    if (cert.imageUrl && isPdfUrl(cert.imageUrl)) {
      console.log("Found PDF in imageUrl:", cert.imageUrl);
      return cert.imageUrl;
    }
    // If imageUrl exists but we're not sure if it's PDF, check by trying to load it
    // For now, let's show both imageUrl and credentialUrl if they exist
    console.log(
      "No PDF found. credentialUrl:",
      cert.credentialUrl,
      "imageUrl:",
      cert.imageUrl
    );
    return null;
  };

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Quản lý chứng chỉ</h1>
          <p>Danh sách tất cả chứng chỉ</p>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chứng chỉ, tổ chức cấp, hoặc tên người nộp..."
              value={search}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.statusFilter}>
            <label htmlFor="statusFilter">Lọc theo trạng thái:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className={styles.statusSelect}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>Đang tải...</div>
        ) : certifications.length === 0 ? (
          <div className={styles.empty}>Không có chứng chỉ nào</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.certTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên chứng chỉ</th>
                    <th>Tổ chức cấp</th>
                    <th>Người nộp</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th>Tham chiếu</th>
                    <th>Mô tả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((cert) => (
                    <tr key={cert.id}>
                      <td>
                        <button
                          className={styles.idButton}
                          onClick={() => openDetailModal(cert)}
                        >
                          #{cert.id}
                        </button>
                      </td>
                      <td className={styles.certName}>{cert.name || "N/A"}</td>
                      <td>{cert.issuingOrganization || "N/A"}</td>
                      <td>{cert.user?.fullName || "N/A"}</td>
                      <td>{cert.user?.email || "N/A"}</td>
                      <td>{getStatusBadge(cert.verificationStatus)}</td>
                      <td>
                        {cert.imageUrl ? (
                          <a
                            href={cert.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.imageLink}
                          >
                            Link
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className={styles.descriptionCell}>
                        {cert.description ? (
                          <span title={cert.description}>
                            {cert.description.length > 50
                              ? `${cert.description.substring(0, 50)}...`
                              : cert.description}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.menuContainer}>
                          <button
                            className={styles.menuButton}
                            onClick={(e) => toggleMenu(cert.id, e)}
                            disabled={processing === cert.id}
                          >
                            <span className={styles.menuDots}>⋮</span>
                          </button>
                          {openMenuId === cert.id && (
                            <div
                              className={styles.contextMenu}
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                              }}
                            >
                              <button
                                className={`${styles.menuItem} ${styles.menuItemView}`}
                                onClick={() => handleViewCert(cert)}
                              >
                                👁️ Xem chứng chỉ
                              </button>
                              {(cert.verificationStatus === "pending" ||
                                cert.verificationStatus === "draft") && (
                                <button
                                  className={styles.menuItem}
                                  onClick={() => handleApproveFromMenu(cert)}
                                  disabled={processing === cert.id}
                                >
                                  {processing === cert.id
                                    ? "Đang xử lý..."
                                    : "✓ Duyệt"}
                                </button>
                              )}
                              <button
                                className={styles.menuItem}
                                onClick={() => handleRejectFromMenu(cert)}
                                disabled={processing === cert.id}
                              >
                                ✕ Từ chối
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

        {showDetailModal && detailCert && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDetailModal(false)}
          >
            <div
              className={styles.detailModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Chi tiết chứng chỉ</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowDetailModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <strong>ID:</strong>
                  <span>#{detailCert.id}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Tên chứng chỉ:</strong>
                  <span>{detailCert.name || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Tổ chức cấp:</strong>
                  <span>{detailCert.issuingOrganization || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Người nộp:</strong>
                  <span>{detailCert.user?.fullName || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Email:</strong>
                  <span>{detailCert.user?.email || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Trạng thái:</strong>
                  {getStatusBadge(detailCert.verificationStatus)}
                </div>
                <div className={styles.detailRow}>
                  <strong>Ngày cấp:</strong>
                  <span>{formatDate(detailCert.issueDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Ngày hết hạn:</strong>
                  <span>{formatDate(detailCert.expiryDate)}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Mã chứng chỉ:</strong>
                  <span>{detailCert.credentialId || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Điểm:</strong>
                  <span>{detailCert.score || "N/A"}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Ngày tạo:</strong>
                  <span>{formatDate(detailCert.createdAt)}</span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Tham chiếu:</strong>
                  {detailCert.imageUrl ? (
                    <a
                      href={detailCert.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem ảnh chứng chỉ
                    </a>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                {detailCert.description && (
                  <div className={styles.detailRow}>
                    <strong>Mô tả:</strong>
                    <p>{detailCert.description}</p>
                  </div>
                )}
              </div>
              {(detailCert.verificationStatus === "pending" ||
                detailCert.verificationStatus === "draft") && (
                <div className={styles.detailActions}>
                  <button
                    className={styles.approveButton}
                    onClick={() => {
                      setShowDetailModal(false);
                      confirmApprove(detailCert.id);
                    }}
                    disabled={processing === detailCert.id}
                  >
                    {processing === detailCert.id ? "Đang xử lý..." : "Duyệt"}
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={() => {
                      setShowDetailModal(false);
                      openRejectModal(detailCert);
                    }}
                    disabled={processing === detailCert.id}
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showModal && selectedCert && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>Từ chối chứng chỉ</h3>
              <p>Chứng chỉ: {selectedCert.name}</p>
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
                    setSelectedCert(null);
                    setRejectionReason("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className={styles.confirmRejectButton}
                  onClick={() => confirmReject(selectedCert.id)}
                  disabled={
                    !rejectionReason.trim() || processing === selectedCert.id
                  }
                >
                  {processing === selectedCert.id
                    ? "Đang xử lý..."
                    : "Xác nhận từ chối"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewCert && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowViewModal(false)}
          >
            <div
              className={styles.viewModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.viewModalHeader}>
                <h2>Chi tiết chứng chỉ</h2>
                <button
                  className={styles.closeButton}
                  onClick={() => {
                    setShowViewModal(false);
                    setViewCert(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className={styles.viewModalContent}>
                <div className={styles.viewSection}>
                  <h3>{viewCert.name || "N/A"}</h3>
                  <div className={styles.statusBadgeContainer}>
                    {getStatusBadge(viewCert.verificationStatus)}
                  </div>
                </div>

                {(() => {
                  console.log("View cert data:", viewCert);
                  const pdfUrl = getPdfUrl(viewCert);

                  // Show PDF viewer if PDF is detected
                  if (pdfUrl) {
                    return (
                      <div className={styles.viewSection}>
                        <h4>Tài liệu chứng chỉ (PDF)</h4>
                        <div className={styles.pdfContainer}>
                          <iframe
                            src={`${pdfUrl}#toolbar=0`}
                            className={styles.pdfViewer}
                            title="PDF Viewer"
                            type="application/pdf"
                            onError={(e) => {
                              console.error("PDF failed to load:", pdfUrl);
                            }}
                          />
                          <div className={styles.pdfActions}>
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.pdfDownloadButton}
                              download
                            >
                              📥 Tải xuống PDF
                            </a>
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.pdfOpenButton}
                            >
                              🔗 Mở trong tab mới
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Show image if exists
                  if (viewCert.imageUrl) {
                    return (
                      <div className={styles.viewSection}>
                        <h4>Hình ảnh/Tài liệu chứng chỉ</h4>
                        <div className={styles.certImageContainer}>
                          <img
                            src={viewCert.imageUrl}
                            alt={viewCert.name || "Chứng chỉ"}
                            className={styles.certImage}
                            onError={(e) => {
                              // If image fails to load, try as PDF
                              console.log(
                                "Image failed to load, trying as PDF:",
                                viewCert.imageUrl
                              );
                              const img = e.target;
                              img.style.display = "none";
                              const parent = img.parentElement;
                              if (parent && !parent.querySelector("iframe")) {
                                const iframe = document.createElement("iframe");
                                iframe.src = `${viewCert.imageUrl}#toolbar=0`;
                                iframe.className = styles.pdfViewer;
                                iframe.title = "PDF Viewer";
                                iframe.type = "application/pdf";
                                parent.appendChild(iframe);
                              }
                            }}
                          />
                        </div>
                        <div className={styles.pdfActions}>
                          <a
                            href={viewCert.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfOpenButton}
                          >
                            🔗 Mở trong tab mới
                          </a>
                          <button
                            className={styles.pdfOpenButton}
                            onClick={() => {
                              // Try to open as PDF in iframe
                              const container = document.querySelector(
                                `.${styles.certImageContainer}`
                              );
                              if (container) {
                                const img = container.querySelector("img");
                                if (img) img.style.display = "none";
                                const existingIframe =
                                  container.querySelector("iframe");
                                if (!existingIframe) {
                                  const iframe =
                                    document.createElement("iframe");
                                  iframe.src = `${viewCert.imageUrl}#toolbar=0`;
                                  iframe.className = styles.pdfViewer;
                                  iframe.title = "PDF Viewer";
                                  iframe.type = "application/pdf";
                                  container.appendChild(iframe);
                                }
                              }
                            }}
                          >
                            📄 Thử xem như PDF
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Show credentialUrl if exists
                  if (viewCert.credentialUrl) {
                    return (
                      <div className={styles.viewSection}>
                        <h4>Tài liệu chứng chỉ</h4>
                        <div className={styles.pdfActions}>
                          <a
                            href={viewCert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfOpenButton}
                          >
                            🔗 Mở link chứng chỉ
                          </a>
                          <button
                            className={styles.pdfOpenButton}
                            onClick={() => {
                              // Try to open as PDF
                              window.open(viewCert.credentialUrl, "_blank");
                            }}
                          >
                            📄 Thử xem như PDF
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Show message if no file/URL
                  return (
                    <div className={styles.viewSection}>
                      <h4>Tài liệu chứng chỉ</h4>
                      <div className={styles.noFileMessage}>
                        <p>⚠️ Chứng chỉ này chưa có tài liệu đính kèm.</p>
                        <p className={styles.noFileSubtext}>
                          Người dùng chưa upload file hình ảnh hoặc PDF cho
                          chứng chỉ này.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className={styles.viewGrid}>
                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Tổ chức cấp:</span>
                    <span className={styles.viewValue}>
                      {viewCert.issuingOrganization || "N/A"}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Người nộp:</span>
                    <span className={styles.viewValue}>
                      {viewCert.user?.fullName || "N/A"}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Email:</span>
                    <span className={styles.viewValue}>
                      {viewCert.user?.email || "N/A"}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Ngày cấp:</span>
                    <span className={styles.viewValue}>
                      {formatDate(viewCert.issueDate)}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Ngày hết hạn:</span>
                    <span className={styles.viewValue}>
                      {formatDate(viewCert.expiryDate)}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Mã chứng chỉ:</span>
                    <span className={styles.viewValue}>
                      {viewCert.credentialId || "N/A"}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Điểm:</span>
                    <span className={styles.viewValue}>
                      {viewCert.score || "N/A"}
                    </span>
                  </div>

                  <div className={styles.viewItem}>
                    <span className={styles.viewLabel}>Ngày tạo:</span>
                    <span className={styles.viewValue}>
                      {formatDate(viewCert.createdAt)}
                    </span>
                  </div>

                  {viewCert.credentialUrl && (
                    <div className={styles.viewItem}>
                      <span className={styles.viewLabel}>Link chứng chỉ:</span>
                      <a
                        href={viewCert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewLink}
                      >
                        {viewCert.credentialUrl}
                      </a>
                    </div>
                  )}
                </div>

                {viewCert.description && (
                  <div className={styles.viewSection}>
                    <h4>Mô tả</h4>
                    <p className={styles.viewDescription}>
                      {viewCert.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation Modal */}
        {showApproveConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal}>
              <h2>📝 Xác nhận duyệt chứng chỉ</h2>
              <p>Bạn có chắc chắn muốn duyệt chứng chỉ này không?</p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  className={styles.confirmButton}
                  onClick={handleApprove}
                >
                  Xác nhận duyệt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModal}>
              <h2>⚠️ Xác nhận từ chối chứng chỉ</h2>
              <p>Bạn có chắc chắn muốn từ chối chứng chỉ này không?</p>
              <div className={styles.confirmActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  Hủy
                </button>
                <button className={styles.rejectButton} onClick={handleReject}>
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

export default CertificateApprovalPage;
