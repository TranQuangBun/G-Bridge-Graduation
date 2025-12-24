import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import alertService from "../../services/alertService";
import adminService from "../../services/adminService";
import { ROUTES } from "../../constants";
import styles from "./CertificateApprovalPage.module.css";
import commonStyles from "../../styles/adminCommon.module.css";
import { FaSpinner } from "react-icons/fa";

const CertificateApprovalPage = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

      const response = await adminService.getPendingCertifications(params);

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
      pending: { label: "Chờ duyệt", className: commonStyles.adminBadgePending },
      approved: { label: "Đã duyệt", className: commonStyles.adminBadgeActive },
      rejected: { label: "Đã từ chối", className: commonStyles.adminBadgeInactive },
      draft: { label: "Bản nháp", className: commonStyles.adminBadgeUnverified },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      className: commonStyles.adminBadgePending,
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
      await alertService.error(error.message || t("admin.certificateApproval.approveFailed"));
    } finally {
      setProcessing(null);
    }
  };

  const confirmReject = async (id) => {
    if (!rejectionReason.trim()) {
      await alertService.warning(t("admin.certificateApproval.rejectReasonRequired"));
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
      await alertService.error(error.message || t("admin.certificateApproval.rejectFailed"));
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


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${commonStyles.adminMenuContainer}`)) {
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
    // Check if credentialUrl is a PDF
    if (cert.credentialUrl && isPdfUrl(cert.credentialUrl)) {
      return cert.credentialUrl;
    }
    // Check if imageUrl is a PDF (PDFs can be uploaded as images)
    if (cert.imageUrl && isPdfUrl(cert.imageUrl)) {
      return cert.imageUrl;
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className={commonStyles.adminContainer}>
        <div className={commonStyles.adminFilters}>
          <div className={commonStyles.adminSearchBox}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chứng chỉ, tổ chức cấp, hoặc tên người nộp..."
              value={search}
              onChange={handleSearch}
              className={commonStyles.adminSearchInput}
            />
          </div>
          <div className={commonStyles.adminFilterGroup}>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={handleStatusFilter}
              className={commonStyles.adminFilterSelect}
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
          <div className={commonStyles.adminLoading}>
            <FaSpinner className={commonStyles.adminSpinner} />
            <p>Đang tải...</p>
          </div>
        ) : certifications.length === 0 ? (
          <div className={commonStyles.adminEmpty}>
            <p>Không có chứng chỉ nào</p>
          </div>
        ) : (
          <>
            <div className={commonStyles.adminTableContainer}>
              <table className={commonStyles.adminTable}>
                <thead>
                  <tr>
                    <th>Thứ tự</th>
                    <th>Tên chứng chỉ</th>
                    <th>Tổ chức cấp</th>
                    <th>Người nộp</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th>Tham chiếu</th>
                    <th>Mô tả</th>
                    <th>Ngày gửi</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {certifications.map((cert, index) => (
                    <tr key={cert.id}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
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
                      <td>{formatDate(cert.createdAt)}</td>
                      <td>
                        <div className={commonStyles.adminMenuContainer}>
                          <button
                            className={commonStyles.adminMenuButton}
                            onClick={(e) => toggleMenu(cert.id, e)}
                            disabled={processing === cert.id}
                          >
                            <span className={commonStyles.adminMenuDots}>⋮</span>
                          </button>
                          {openMenuId === cert.id && (
                            <div
                              className={commonStyles.adminContextMenu}
                              style={{
                                top: `${menuPosition.top}px`,
                                left: `${menuPosition.left}px`,
                              }}
                            >
                              <button
                                className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemView}`}
                                onClick={() => handleViewCert(cert)}
                              >
                                Xem chứng chỉ
                              </button>
                              <button
                                className={commonStyles.adminMenuItem}
                                onClick={() => handleApproveFromMenu(cert)}
                                disabled={processing === cert.id || cert.verificationStatus === "approved"}
                              >
                                {processing === cert.id
                                  ? t("admin.certificateApproval.processing") || "Processing..."
                                  : t("admin.certificateApproval.approve") || "Approve"}
                              </button>
                              <button
                                className={`${commonStyles.adminMenuItem} ${commonStyles.adminMenuItemDanger}`}
                                onClick={() => handleRejectFromMenu(cert)}
                                disabled={processing === cert.id || cert.verificationStatus === "rejected"}
                              >
                                {t("admin.certificateApproval.reject") || "Reject"}
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
                  Trước
                </button>
                <span className={commonStyles.adminPaginationInfo}>
                  {t("admin.certificateApproval.page")} {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  className={commonStyles.adminPaginationButton}
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

        {showModal && selectedCert && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => setShowModal(false)}
          >
            <div className={commonStyles.adminModal} onClick={(e) => e.stopPropagation()}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.certificateApproval.rejectTitle") || "Reject Certificate"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowModal(false);
                    setSelectedCert(null);
                    setRejectionReason("");
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p style={{ marginBottom: "1rem", color: "#64748b" }}>
                  {t("admin.certificateApproval.certificateLabel") || "Certificate"}: <strong>{selectedCert.name}</strong>
                </p>
                <textarea
                  className={commonStyles.adminFilterInput}
                  placeholder={t("admin.certificateApproval.rejectReasonPlaceholder") || "Enter rejection reason..."}
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
                    setSelectedCert(null);
                    setRejectionReason("");
                  }}
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonDanger}`}
                  onClick={() => confirmReject(selectedCert.id)}
                  disabled={
                    !rejectionReason.trim() || processing === selectedCert.id
                  }
                >
                  {processing === selectedCert.id
                    ? t("admin.certificateApproval.processing") || "Processing..."
                    : t("admin.certificateApproval.confirmReject") || "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewCert && (
          <div
            className={commonStyles.adminModalOverlay}
            onClick={() => setShowViewModal(false)}
          >
            <div
              className={commonStyles.adminModal}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "900px", maxHeight: "95vh" }}
            >
              <div className={commonStyles.adminModalHeader}>
                <h3>Chi tiết chứng chỉ</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowViewModal(false);
                    setViewCert(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <div className={commonStyles.adminModalSection}>
                  <h3>{viewCert.name || "N/A"}</h3>
                  <div style={{ marginTop: "0.75rem" }}>
                    {getStatusBadge(viewCert.verificationStatus)}
                  </div>
                </div>

                {(() => {
                  const pdfUrl = getPdfUrl(viewCert);

                  // Show PDF viewer if PDF is detected
                  if (pdfUrl) {
                    return (
                      <div className={commonStyles.adminModalSection}>
                        <h3>{t("admin.certificateApproval.certificateDocumentPdf") || "Certificate Document (PDF)"}</h3>
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
                              {t("admin.certificateApproval.downloadPdf") || "Download PDF"}
                            </a>
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.pdfOpenButton}
                            >
                              {t("admin.certificateApproval.openInNewTab") || "Open in new tab"}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Show image if exists
                  if (viewCert.imageUrl) {
                    return (
                      <div className={commonStyles.adminModalSection}>
                        <h3>{t("admin.certificateApproval.certificateImageDocument") || "Certificate Image/Document"}</h3>
                        <div className={styles.certImageContainer}>
                          <img
                            src={viewCert.imageUrl}
                            alt={viewCert.name || "Certificate"}
                            className={styles.certImage}
                            onError={(e) => {
                              // If image fails to load, try as PDF
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
                            {t("admin.certificateApproval.openInNewTab") || "Open in new tab"}
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
                            {t("admin.certificateApproval.tryViewAsPdf") || "Try viewing as PDF"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Show credentialUrl if exists
                  if (viewCert.credentialUrl) {
                    return (
                      <div className={commonStyles.adminModalSection}>
                        <h3>{t("admin.certificateApproval.certificateDocument") || "Certificate Document"}</h3>
                        <div className={styles.pdfActions}>
                          <a
                            href={viewCert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfOpenButton}
                          >
                            {t("admin.certificateApproval.openCertificateLink") || "Open certificate link"}
                          </a>
                          <button
                            className={styles.pdfOpenButton}
                            onClick={() => {
                              // Try to open as PDF
                              window.open(viewCert.credentialUrl, "_blank");
                            }}
                          >
                            {t("admin.certificateApproval.tryViewAsPdf") || "Try viewing as PDF"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Show message if no file/URL
                  return (
                    <div className={commonStyles.adminModalSection}>
                      <h3>{t("admin.certificateApproval.certificateDocument") || "Certificate Document"}</h3>
                      <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                        <p>{t("admin.certificateApproval.noDocumentAttached") || "This certificate has no attached document."}</p>
                        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                          {t("admin.certificateApproval.noDocumentSubtext") || "The user has not uploaded an image or PDF file for this certificate."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className={commonStyles.adminModalSection}>
                  <h3>Thông tin chứng chỉ</h3>
                  <div className={commonStyles.adminModalDetailGrid}>
                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Tổ chức cấp:</strong>
                      <span>
                        {viewCert.issuingOrganization || "N/A"}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Người nộp:</strong>
                      <span>
                        {viewCert.user?.fullName || "N/A"}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Email:</strong>
                      <span>
                        {viewCert.user?.email || "N/A"}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Ngày cấp:</strong>
                      <span>
                        {formatDate(viewCert.issueDate)}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Ngày hết hạn:</strong>
                      <span>
                        {formatDate(viewCert.expiryDate)}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Mã chứng chỉ:</strong>
                      <span>
                        {viewCert.credentialId || "N/A"}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Điểm:</strong>
                      <span>
                        {viewCert.score || "N/A"}
                      </span>
                    </div>

                    <div className={commonStyles.adminModalDetailItem}>
                      <strong>Ngày tạo:</strong>
                      <span>
                        {formatDate(viewCert.createdAt)}
                      </span>
                    </div>

                    {viewCert.credentialUrl && (
                      <div className={commonStyles.adminModalDetailItem}>
                        <strong>Link chứng chỉ:</strong>
                        <a
                          href={viewCert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#3b82f6", textDecoration: "none" }}
                          onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                        >
                          {viewCert.credentialUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {viewCert.description && (
                  <div className={commonStyles.adminModalSection}>
                    <h3>Mô tả</h3>
                    <p className={commonStyles.adminModalDescriptionText}>
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
          <div className={commonStyles.adminModalOverlay}>
            <div className={commonStyles.adminModal}>
              <div className={commonStyles.adminModalHeader}>
                <h3>{t("admin.certificateApproval.confirmApproveTitle") || "Confirm Certificate Approval"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p>{t("admin.certificateApproval.confirmApproveMessage") || "Are you sure you want to approve this certificate?"}</p>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowApproveConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSuccess}`}
                  onClick={handleApprove}
                >
                  {t("admin.certificateApproval.confirmApprove") || "Confirm Approval"}
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
                <h3>{t("admin.certificateApproval.confirmRejectTitle") || "Confirm Certificate Rejection"}</h3>
                <button
                  className={commonStyles.adminModalCloseBtn}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className={commonStyles.adminModalBody}>
                <p>{t("admin.certificateApproval.confirmRejectMessage") || "Are you sure you want to reject this certificate?"}</p>
              </div>
              <div className={commonStyles.adminModalActions}>
                <button
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonSecondary}`}
                  onClick={() => {
                    setShowRejectConfirm(false);
                    setActionCertId(null);
                  }}
                >
                  {t("common.cancel") || "Cancel"}
                </button>
                <button 
                  className={`${commonStyles.adminButton} ${commonStyles.adminButtonDanger}`} 
                  onClick={handleReject}
                >
                  {t("admin.certificateApproval.confirmReject") || "Confirm Rejection"}
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
