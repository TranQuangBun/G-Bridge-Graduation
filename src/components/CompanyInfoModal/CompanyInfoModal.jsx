import React from "react";
import styles from "./CompanyInfoModal.module.css";

const CompanyInfoModal = ({ isOpen, onClose, company }) => {
  if (!isOpen || !company) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
          <div className={styles.companyLogoSection}>
            {company.logo ? (
              <img
                src={`http://localhost:4000${company.logo}`}
                alt={company.companyName || "Company"}
                className={styles.companyLogo}
              />
            ) : (
              <div className={styles.logoPlaceholder}>
                <span>🏢</span>
              </div>
            )}
          </div>

          <div className={styles.headerInfo}>
            <h2 className={styles.companyName}>
              {company.companyName || "Company"}
            </h2>
            {company.industry && (
              <p className={styles.industry}>
                <span className={styles.icon}>🏭</span>
                {company.industry}
              </p>
            )}
            <div className={styles.quickInfo}>
              {company.companyType && (
                <span className={styles.infoTag}>
                  {company.companyType.replace("_", " ")}
                </span>
              )}
              {company.companySize && (
                <span className={styles.infoTag}>
                  {company.companySize === "under_10"
                    ? "< 10 employees"
                    : company.companySize === "500+"
                    ? "500+ employees"
                    : `${company.companySize} employees`}
                </span>
              )}
              {company.verificationStatus === "verified" && (
                <span className={styles.verifiedBadge}>✓ Verified</span>
              )}
            </div>
          </div>
        </div>

        {/* Body Section */}
        <div className={styles.modalBody}>
          {/* About Section */}
          {company.description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>ℹ️</span>
                About Company
              </h3>
              <p className={styles.description}>{company.description}</p>
            </div>
          )}

          {/* Company Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.icon}>📋</span>
              Company Details
            </h3>
            <div className={styles.detailsGrid}>
              {company.website && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>🌐</span>
                    Website
                  </span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.detailValue}
                  >
                    {company.website}
                  </a>
                </div>
              )}

              {company.headquarters && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>📍</span>
                    Headquarters
                  </span>
                  <span className={styles.detailValue}>
                    {company.headquarters}
                  </span>
                </div>
              )}

              {company.foundedYear && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>📅</span>
                    Founded
                  </span>
                  <span className={styles.detailValue}>
                    {company.foundedYear}
                  </span>
                </div>
              )}

              {company.totalJobsPosted !== undefined && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>💼</span>
                    Jobs Posted
                  </span>
                  <span className={styles.detailValue}>
                    {company.totalJobsPosted}
                  </span>
                </div>
              )}

              {company.totalJobsCompleted !== undefined && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>✓</span>
                    Jobs Completed
                  </span>
                  <span className={styles.detailValue}>
                    {company.totalJobsCompleted}
                  </span>
                </div>
              )}

              {company.rating !== undefined && company.rating > 0 && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>
                    <span className={styles.icon}>⭐</span>
                    Rating
                  </span>
                  <span className={styles.detailValue}>
                    {Number(company.rating).toFixed(1)} / 5.0
                    {company.totalReviews > 0 && (
                      <span className={styles.reviewCount}>
                        ({company.totalReviews} reviews)
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preferred Languages */}
          {company.preferredLanguages &&
            company.preferredLanguages.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.icon}>🌍</span>
                  Preferred Languages
                </h3>
                <div className={styles.languageTags}>
                  {company.preferredLanguages.map((lang, index) => (
                    <span key={index} className={styles.languageTag}>
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Subscription Plan */}
          {company.subscriptionPlan && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>💎</span>
                Subscription
              </h3>
              <div className={styles.subscriptionInfo}>
                <span
                  className={`${styles.planBadge} ${
                    company.subscriptionPlan === "premium"
                      ? styles.premiumPlan
                      : company.subscriptionPlan === "enterprise"
                      ? styles.enterprisePlan
                      : styles.basicPlan
                  }`}
                >
                  {company.subscriptionPlan.toUpperCase()} PLAN
                </span>
                {company.subscriptionExpiry && (
                  <span className={styles.expiryDate}>
                    Valid until:{" "}
                    {new Date(company.subscriptionExpiry).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Business License */}
          {company.businessLicense && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <span className={styles.icon}>📄</span>
                Business License
              </h3>
              <div className={styles.licenseInfo}>
                {company.businessLicenseNumber && (
                  <p className={styles.licenseNumber}>
                    License Number:{" "}
                    <strong>{company.businessLicenseNumber}</strong>
                  </p>
                )}
                <div className={styles.licenseStatus}>
                  <span
                    className={`${styles.statusBadge} ${
                      company.businessLicenseVerified
                        ? styles.verifiedStatus
                        : styles.unverifiedStatus
                    }`}
                  >
                    {company.businessLicenseVerified
                      ? "✓ Verified"
                      : "⏳ Pending Verification"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal;
