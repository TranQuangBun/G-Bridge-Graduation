import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../translet/LanguageContext";
import { useNavigate } from "react-router-dom";
import interpreterService from "../../services/interpreterService";
import { toast } from "react-toastify";
import BookingModal from "../BookingModal/BookingModal";
import styles from "./InterpreterModal.module.css";

const InterpreterModal = ({ interpreterId, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [interpreter, setInterpreter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Check if user has premium access (chưa trả phí = isPremium false)
  const hasPremiumAccess = user?.isPremium || false;

  // Helper function to parse specializations (handle both array and string)
  const parseSpecializations = (specializations) => {
    if (!specializations) return [];
    if (Array.isArray(specializations)) return specializations;
    if (typeof specializations === "string") {
      try {
        const parsed = JSON.parse(specializations);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Helper function to parse languages (handle both array and string)
  const parseLanguages = (languages) => {
    if (!languages) return [];
    if (Array.isArray(languages)) return languages;
    if (typeof languages === "string") {
      try {
        const parsed = JSON.parse(languages);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  // Helper function to parse certifications (handle both array and string)
  const parseCertifications = (certifications) => {
    if (!certifications) return [];
    if (Array.isArray(certifications)) return certifications;
    if (typeof certifications === "string") {
      try {
        const parsed = JSON.parse(certifications);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    fetchInterpreterDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interpreterId]);

  const fetchInterpreterDetails = async () => {
    try {
      setLoading(true);
      const response = await interpreterService.getInterpreterById(
        interpreterId
      );
      setInterpreter(response.data);
    } catch (error) {
      console.error("Error fetching interpreter details:", error);
      toast.error("Failed to load interpreter details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = () => {
    if (!hasPremiumAccess) {
      toast.warning(t("interpreterModal.premiumMessage"));
      return;
    }
    toast.info("Contact feature coming soon!");
  };

  const handleBookingClick = () => {
    if (!hasPremiumAccess) {
      toast.warning(t("interpreterModal.premiumMessage"));
      return;
    }
    setIsBookingModalOpen(true);
  };

  const handleUpgradeToPremium = () => {
    onClose(); // Close modal first
    navigate("/pricing"); // Navigate to pricing page
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
        <div className={styles.modalContent}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interpreter) return null;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header Section */}
        <div className={styles.modalHeader}>
          <div className={styles.avatarSection}>
            {interpreter.avatar ? (
              <img
                src={`http://localhost:4000${interpreter.avatar}`}
                alt={interpreter.fullName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {interpreter.fullName?.charAt(0)?.toUpperCase()}
              </div>
            )}
            {interpreter.profile?.rating >= 4.5 && (
              <div className={styles.topRatedBadge}>
                ⭐ {t("interpreterModal.topRated")}
              </div>
            )}
          </div>

          <div className={styles.headerInfo}>
            <h2 className={styles.interpreterName}>{interpreter.fullName}</h2>
            <div className={styles.ratingRow}>
              <span className={styles.rating}>
                ⭐ {Number(interpreter.profile?.rating || 0).toFixed(1)}
              </span>
              <span className={styles.reviews}>
                ({interpreter.profile?.totalReviews || 0}{" "}
                {t("interpreterModal.reviews")})
              </span>
            </div>
            <div className={styles.quickInfo}>
              <span className={styles.infoItem}>
                💼 {interpreter.profile?.experience || 0}{" "}
                {t("interpreterModal.years")}
              </span>
              <span className={styles.infoItem}>
                💰 ${Number(interpreter.profile?.hourlyRate || 0).toFixed(2)}/hr
              </span>
              <span className={styles.infoItem}>
                📍 {interpreter.address || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Premium Access Warning */}
        {!hasPremiumAccess && (
          <div className={styles.premiumWarning}>
            <div className={styles.warningIcon}>🔒</div>
            <div className={styles.warningText}>
              <strong>{t("interpreterModal.premiumRequired")}</strong>
              <p>{t("interpreterModal.premiumMessage")}</p>
            </div>
            <button
              className={styles.upgradeBtn}
              onClick={handleUpgradeToPremium}
            >
              {t("interpreterModal.upgradeToPremium")}
            </button>
          </div>
        )}

        {/* Content Section */}
        <div className={styles.modalBody}>
          {/* Bio Section */}
          {interpreter.profile?.bio && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>📝</span>
                {t("interpreterModal.about")}
              </h3>
              <p className={styles.bio}>{interpreter.profile.bio}</p>
            </div>
          )}

          {/* Languages Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>🌐</span>
              {t("interpreterModal.languages")}
            </h3>
            <div className={styles.tagsList}>
              {parseLanguages(interpreter.languages).map((lang) => (
                <span key={lang.id} className={styles.tag}>
                  {lang.name}
                </span>
              ))}
            </div>
          </div>

          {/* Specializations Section */}
          {parseSpecializations(interpreter.profile?.specializations).length >
            0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>🎯</span>
                {t("interpreterModal.specializations")}
              </h3>
              <div className={styles.tagsList}>
                {parseSpecializations(interpreter.profile.specializations).map(
                  (spec, idx) => (
                    <span key={idx} className={styles.tag}>
                      {spec}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Certifications Section */}
          {parseCertifications(interpreter.certifications).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>🏆</span>
                {t("interpreterModal.certifications")}
              </h3>
              <div className={styles.certificationsList}>
                {parseCertifications(interpreter.certifications).map((cert) => (
                  <div key={cert.id} className={styles.certificationItem}>
                    <div className={styles.certIcon}>📜</div>
                    <div className={styles.certInfo}>
                      <strong>{cert.name}</strong>
                      <p className={styles.certIssuer}>
                        {cert.issuingOrganization}
                      </p>
                      {cert.issueDate && (
                        <p className={styles.certDate}>
                          {t("interpreterModal.issued")}:{" "}
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability Section */}
          {interpreter.profile?.availability &&
            typeof interpreter.profile.availability === "object" &&
            Object.keys(interpreter.profile.availability).length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.icon}>📅</span>
                  {t("interpreterModal.availability")}
                </h3>
                <div className={styles.availabilityGrid}>
                  {(() => {
                    // Day name mapping - support both number indices and string names
                    const dayMapping = {
                      0: "sunday",
                      1: "monday",
                      2: "tuesday",
                      3: "wednesday",
                      4: "thursday",
                      5: "friday",
                      6: "saturday",
                      sunday: "sunday",
                      monday: "monday",
                      tuesday: "tuesday",
                      wednesday: "wednesday",
                      thursday: "thursday",
                      friday: "friday",
                      saturday: "saturday",
                    };

                    // Define day order for consistent display
                    const dayOrder = [
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ];

                    try {
                      // Get availability entries and normalize keys
                      const availabilityEntries = Object.entries(
                        interpreter.profile.availability
                      )
                        .map(([key, value]) => {
                          const normalizedKey =
                            dayMapping[String(key).toLowerCase()] ||
                            String(key).toLowerCase();
                          return [normalizedKey, value];
                        })
                        .filter(([key]) => dayOrder.includes(key)); // Only keep valid days

                      // Sort by day order
                      availabilityEntries.sort((a, b) => {
                        return dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]);
                      });

                      return availabilityEntries.map(([day, hours]) => {
                        // Format hours
                        let formattedHours = t("interpreterModal.notAvailable");

                        if (hours) {
                          if (Array.isArray(hours)) {
                            formattedHours = hours.filter((h) => h).join(", ");
                          } else if (typeof hours === "string") {
                            formattedHours = hours;
                          }
                        }

                        return (
                          <div key={day} className={styles.availabilityItem}>
                            <strong className={styles.day}>
                              {t(`interpreterModal.days.${day}`)}:
                            </strong>
                            <span className={styles.hours}>
                              {formattedHours}
                            </span>
                          </div>
                        );
                      });
                    } catch (error) {
                      console.error("Error rendering availability:", error);
                      return (
                        <div className={styles.availabilityItem}>
                          <span>{t("interpreterModal.notAvailable")}</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

          {/* Contact Information (Blurred if not premium) */}
          <div
            className={`${styles.section} ${
              !hasPremiumAccess ? styles.blurred : ""
            }`}
          >
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>📧</span>
              {t("interpreterModal.contactInformation")}
            </h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>
                  {t("interpreterModal.email")}:
                </span>
                <span className={styles.contactValue}>{interpreter.email}</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>
                  {t("interpreterModal.phone")}:
                </span>
                <span className={styles.contactValue}>
                  {interpreter.phoneNumber || t("interpreterModal.notProvided")}
                </span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>
                  {t("interpreterModal.address")}:
                </span>
                <span className={styles.contactValue}>
                  {interpreter.address || t("interpreterModal.notProvided")}
                </span>
              </div>
            </div>
            {!hasPremiumAccess && (
              <div className={styles.blurOverlay}>
                <div className={styles.lockIcon}>🔒</div>
                <p>{t("interpreterModal.upgradeToViewContact")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            className={styles.contactBtn}
            onClick={handleContactClick}
            disabled={!hasPremiumAccess}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {t("interpreterModal.contactInterpreter")}
          </button>
          <button
            className={styles.bookBtn}
            onClick={handleBookingClick}
            disabled={!hasPremiumAccess}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {t("interpreterModal.bookNow")}
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        interpreter={{
          id: interpreter.id,
          name: interpreter.fullName,
          avatar: interpreter.avatar
            ? `http://localhost:4000${interpreter.avatar}`
            : null,
          hourlyRate: interpreter.profile?.hourlyRate || 0,
        }}
      />
    </div>
  );
};

export default InterpreterModal;
