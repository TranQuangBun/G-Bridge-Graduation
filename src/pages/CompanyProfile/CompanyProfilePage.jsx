import React, { useState, useEffect } from "react";
import styles from "./CompanyProfilePage.module.css";
import { MainLayout } from "../../layouts";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";
import clientService from "../../services/clientService";
import { toast } from "react-toastify";
import { useLanguage } from "../../translet/LanguageContext";

const INDUSTRIES = [
  { value: "technology", label: "Technology & IT" },
  { value: "healthcare", label: "Healthcare & Medical" },
  { value: "education", label: "Education & Training" },
  { value: "finance", label: "Finance & Banking" },
  { value: "legal", label: "Legal Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "real_estate", label: "Real Estate" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "media", label: "Media & Entertainment" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "agriculture", label: "Agriculture" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "consulting", label: "Consulting Services" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "nonprofit", label: "Non-profit Organization" },
  { value: "government", label: "Government & Public Sector" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZES = [
  { value: "under_10", label: "Under 10 employees" },
  { value: "10-50", label: "10-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "101-200", label: "101-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
];

function CompanyProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState("profile");

  // Sidebar menu for companies
  const SIDEBAR_MENU = [
    { id: "overview", icon: "📊", labelKey: "overview" },
    { id: "applications", icon: "📋", label: "Job Applications" },
    {
      id: "favorites",
      icon: "❤️",
      label: t("companyProfile.savedInterpreters"),
    },
    { id: "alerts", icon: "🔔", labelKey: "alerts" },
    { id: "profile", icon: "🏢", label: t("companyProfile.title") },
    { id: "settings", icon: "⚙️", labelKey: "settings" },
  ];

  const [formData, setFormData] = useState({
    companyName: "",
    companySize: "",
    industry: "",
    description: "",
    website: "",
    headquarters: "",
    foundedYear: "",
    businessLicenseNumber: "",
  });

  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === "client") {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await clientService.getProfile();
      setProfile(response.data);

      // Populate form
      setFormData({
        companyName: response.data.companyName || "",
        companySize: response.data.companySize || "",
        industry: response.data.industry || "",
        description: response.data.description || "",
        website: response.data.website || "",
        headquarters: response.data.headquarters || "",
        foundedYear: response.data.foundedYear || "",
        businessLicenseNumber: response.data.businessLicenseNumber || "",
      });

      if (response.data.businessLicense) {
        setBusinessLicensePreview(response.data.businessLicense);
      }

      // Load logo if exists
      if (response.data.logo) {
        setLogoPreview(response.data.logo);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t("companyProfile.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessLicenseChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|pdf)/)) {
        toast.error(t("companyProfile.invalidLicenseType"));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("companyProfile.licenseSizeTooLarge"));
        return;
      }

      setBusinessLicenseFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessLicensePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - only images
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        toast.error(t("companyProfile.invalidImageType"));
        return;
      }

      // Validate file size (max 2MB for logo)
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t("companyProfile.logoSizeTooLarge"));
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("logo", logoFile);

      await clientService.uploadLogo(formData);
      toast.success(t("companyProfile.logoUploadSuccess"));
      setLogoFile(null);
      fetchProfile();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error(
        error.response?.data?.message || t("companyProfile.logoUploadFailed")
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (
        !formData.companyName ||
        !formData.industry ||
        !formData.companySize ||
        !formData.description
      ) {
        toast.error(t("companyProfile.fillRequiredFields"));
        return;
      }

      setSaving(true);
      await clientService.updateProfile(formData);
      toast.success(t("companyProfile.profileUpdated"));
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message || t("companyProfile.updateFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadBusinessLicense = async () => {
    try {
      if (!businessLicenseFile) {
        toast.error(t("companyProfile.selectLicenseFile"));
        return;
      }

      // Check if basic info is complete
      if (!profile.companyName || !profile.industry || !profile.companySize) {
        toast.error(t("companyProfile.completeBasicInfoMessage"));
        return;
      }

      setUploading(true);

      // Upload to cloudinary or your storage
      const uploadFormData = new FormData();
      uploadFormData.append("file", businessLicenseFile);
      uploadFormData.append("upload_preset", "gbridge_business_licenses"); // Configure in Cloudinary

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      const uploadData = await uploadResponse.json();

      // Save to backend
      await clientService.uploadBusinessLicense({
        businessLicenseUrl: uploadData.secure_url,
        businessLicenseNumber: formData.businessLicenseNumber,
      });

      toast.success(t("companyProfile.licenseUploadSuccess"));
      fetchProfile();
    } catch (error) {
      console.error("Error uploading business license:", error);
      toast.error(t("companyProfile.licenseUploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    if (!profile) return null;

    const statusConfig = {
      unverified: {
        text: t("companyProfile.statusUnverified"),
        icon: "⚠️",
        className: styles.statusUnverified,
      },
      pending: {
        text: t("companyProfile.statusPending"),
        icon: "🕐",
        className: styles.statusPending,
      },
      verified: {
        text: t("companyProfile.statusVerified"),
        icon: "✓",
        className: styles.statusVerified,
      },
      rejected: {
        text: t("companyProfile.statusRejected"),
        icon: "✕",
        className: styles.statusRejected,
      },
    };

    const status =
      statusConfig[profile.verificationStatus] || statusConfig.unverified;

    return (
      <div className={`${styles.statusBadge} ${status.className}`}>
        <span className={styles.statusIcon}>{status.icon}</span>
        <span className={styles.statusText}>{status.text}</span>
      </div>
    );
  };

  const isProfileComplete =
    profile?.companyName &&
    profile?.industry &&
    profile?.companySize &&
    profile?.description;
  const hasBusinessLicense = !!profile?.businessLicense;

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className={styles.loading}>Loading...</div>
      </MainLayout>
    );
  }

  if (user?.role !== "client") {
    return (
      <MainLayout>
        <div className={styles.error}>
          This page is only for company accounts
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.dashboardRoot}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2 className={styles.sidebarTitle}>Dashboard</h2>
          </div>
          <nav className={styles.sidebarNav}>
            {SIDEBAR_MENU.map((item) => (
              <button
                key={item.id}
                className={`${styles.menuItem} ${
                  activeMenu === item.id ? styles.menuItemActive : ""
                }`}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.id === "overview") {
                    navigate(ROUTES.DASHBOARD);
                  } else if (item.id === "applications") {
                    navigate(ROUTES.MY_APPLICATIONS);
                  } else if (item.id === "favorites") {
                    navigate(ROUTES.SAVED_JOBS);
                  } else if (item.id === "alerts") {
                    navigate(ROUTES.JOB_ALERTS);
                  } else if (item.id === "profile") {
                    navigate(ROUTES.COMPANY_PROFILE);
                  } else if (item.id === "settings") {
                    toast.info("Settings page coming soon!");
                  }
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>
                  {item.label || t(`dashboard.${item.labelKey}`)}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <div className={styles.profileContainer}>
            <div className={styles.header}>
              <h1 className={styles.title}>{t("companyProfile.title")}</h1>
              {getVerificationStatusBadge()}
            </div>

            {/* Alert Messages */}
            {profile?.verificationStatus === "unverified" && (
              <div className={styles.alertWarning}>
                <span className={styles.alertIcon}>⚠️</span>
                <div className={styles.alertContent}>
                  <strong>{t("companyProfile.accountNotVerified")}</strong>
                  <p>{t("companyProfile.accountNotVerifiedMsg")}</p>
                </div>
              </div>
            )}

            {profile?.verificationStatus === "pending" && (
              <div className={styles.alertInfo}>
                <span className={styles.alertIcon}>🕐</span>
                <div className={styles.alertContent}>
                  <strong>{t("companyProfile.verificationPending")}</strong>
                  <p>{t("companyProfile.verificationPendingMsg")}</p>
                </div>
              </div>
            )}

            {profile?.verificationStatus === "rejected" &&
              profile?.verificationNote && (
                <div className={styles.alertDanger}>
                  <span className={styles.alertIcon}>✕</span>
                  <div className={styles.alertContent}>
                    <strong>{t("companyProfile.verificationRejected")}</strong>
                    <p>{profile.verificationNote}</p>
                    <p>{t("companyProfile.verificationRejectedMsg")}</p>
                  </div>
                </div>
              )}

            {/* Company Logo Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("companyProfile.companyLogo")}
                </h2>
              </div>

              <div className={styles.logoSection}>
                <div className={styles.logoDisplay}>
                  {logoPreview || profile?.logo ? (
                    <img
                      src={logoPreview || profile?.logo}
                      alt="Company Logo"
                      className={styles.logoImage}
                    />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      <span className={styles.logoIcon}>🏢</span>
                      <p>{t("companyProfile.noLogoUploaded")}</p>
                    </div>
                  )}
                </div>

                <div className={styles.logoUpload}>
                  <p className={styles.hint}>
                    {t("companyProfile.logoHint")}
                    <br />
                    {t("companyProfile.logoRecommendation")}
                  </p>

                  <div className={styles.uploadActions}>
                    <input
                      type="file"
                      id="companyLogo"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleLogoChange}
                      className={styles.fileInput}
                    />
                    <label htmlFor="companyLogo" className={styles.uploadBtn}>
                      {logoPreview || profile?.logo
                        ? t("companyProfile.changeLogo")
                        : t("companyProfile.chooseLogo")}
                    </label>

                    {logoFile && (
                      <button
                        className={styles.submitBtn}
                        onClick={handleUploadLogo}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo
                          ? t("companyProfile.uploading")
                          : t("companyProfile.uploadLogo")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("companyProfile.basicInformation")}
                </h2>
                {!editMode && (
                  <button
                    className={styles.editBtn}
                    onClick={() => setEditMode(true)}
                  >
                    {t("companyProfile.edit")}
                  </button>
                )}
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.companyName")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder={t("companyProfile.enterCompanyName")}
                    />
                  ) : (
                    <p className={styles.value}>
                      {profile?.companyName || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.industry")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  {editMode ? (
                    <select
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">
                        {t("companyProfile.selectIndustry")}
                      </option>
                      {INDUSTRIES.map((ind) => (
                        <option key={ind.value} value={ind.value}>
                          {ind.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className={styles.value}>
                      {INDUSTRIES.find((i) => i.value === profile?.industry)
                        ?.label || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.companySize")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  {editMode ? (
                    <select
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleInputChange}
                      className={styles.select}
                    >
                      <option value="">
                        {t("companyProfile.selectCompanySize")}
                      </option>
                      {COMPANY_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className={styles.value}>
                      {COMPANY_SIZES.find(
                        (s) => s.value === profile?.companySize
                      )?.label || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.website")}
                  </label>
                  {editMode ? (
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder={t("companyProfile.websitePlaceholder")}
                    />
                  ) : (
                    <p className={styles.value}>
                      {profile?.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        t("companyProfile.notProvided")
                      )}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.headquarters")}
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="headquarters"
                      value={formData.headquarters}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder={t("companyProfile.headquartersPlaceholder")}
                    />
                  ) : (
                    <p className={styles.value}>
                      {profile?.headquarters || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.foundedYear")}
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      name="foundedYear"
                      value={formData.foundedYear}
                      onChange={handleInputChange}
                      className={styles.input}
                      placeholder={t("companyProfile.foundedYearPlaceholder")}
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  ) : (
                    <p className={styles.value}>
                      {profile?.foundedYear || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>
                    {t("companyProfile.companyDescription")}{" "}
                    <span className={styles.required}>*</span>
                  </label>
                  {editMode ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className={styles.textarea}
                      placeholder={t("companyProfile.descriptionPlaceholder")}
                      rows={4}
                    />
                  ) : (
                    <p className={styles.value}>
                      {profile?.description || t("companyProfile.notProvided")}
                    </p>
                  )}
                </div>
              </div>

              {editMode && (
                <div className={styles.formActions}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => {
                      setEditMode(false);
                      // Reset form
                      setFormData({
                        companyName: profile?.companyName || "",
                        companySize: profile?.companySize || "",
                        industry: profile?.industry || "",
                        description: profile?.description || "",
                        website: profile?.website || "",
                        headquarters: profile?.headquarters || "",
                        foundedYear: profile?.foundedYear || "",
                        businessLicenseNumber:
                          profile?.businessLicenseNumber || "",
                      });
                    }}
                  >
                    {t("companyProfile.cancel")}
                  </button>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving
                      ? t("companyProfile.saving")
                      : t("companyProfile.saveChanges")}
                  </button>
                </div>
              )}
            </div>

            {/* Business License Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("companyProfile.businessCertificate")}
                  {!hasBusinessLicense && (
                    <span className={styles.required}>*</span>
                  )}
                </h2>
              </div>

              {!isProfileComplete && (
                <div className={styles.alertWarning}>
                  <span className={styles.alertIcon}>ℹ️</span>
                  <div className={styles.alertContent}>
                    <p className={styles.alertText}>
                      {t("companyProfile.completeBasicInfoMessage")}
                    </p>
                  </div>
                </div>
              )}

              <div className={styles.licenseContainer}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {t("companyProfile.businessLicenseNumber")}
                  </label>
                  <input
                    type="text"
                    name="businessLicenseNumber"
                    value={formData.businessLicenseNumber}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder={t("companyProfile.enterLicenseNumber")}
                    disabled={!isProfileComplete}
                    style={{ pointerEvents: "auto" }}
                  />
                  <p className={styles.hint}>
                    {t("companyProfile.licenseNumberHint")}
                  </p>
                </div>

                <div className={styles.uploadSection}>
                  <label className={styles.label}>
                    {t("companyProfile.uploadBusinessLicense")}
                  </label>
                  <p className={styles.hint}>
                    {t("companyProfile.licenseHint")}
                  </p>

                  {businessLicensePreview && (
                    <div className={styles.preview}>
                      <img
                        src={businessLicensePreview}
                        alt={t("companyProfile.businessLicenseAlt")}
                        className={styles.previewImage}
                      />
                      <button
                        className={styles.removePreviewBtn}
                        onClick={() => {
                          setBusinessLicenseFile(null);
                          setBusinessLicensePreview(
                            profile?.businessLicense || null
                          );
                        }}
                        title={t("companyProfile.removeFile")}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className={styles.uploadActions}>
                    <input
                      type="file"
                      id="businessLicense"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleBusinessLicenseChange}
                      className={styles.fileInput}
                      disabled={!isProfileComplete}
                    />
                    <label
                      htmlFor="businessLicense"
                      className={`${styles.uploadBtn} ${
                        !isProfileComplete ? styles.disabled : ""
                      }`}
                    >
                      {businessLicensePreview && !businessLicenseFile
                        ? t("companyProfile.changeFile")
                        : t("companyProfile.chooseFile")}
                    </label>

                    {businessLicenseFile && (
                      <button
                        className={styles.submitBtn}
                        onClick={handleUploadBusinessLicense}
                        disabled={uploading || !isProfileComplete}
                      >
                        {uploading
                          ? t("companyProfile.uploading")
                          : t("companyProfile.submitForVerification")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status Info */}
            {profile?.verificationStatus === "verified" && (
              <div className={styles.section}>
                <div className={styles.verifiedInfo}>
                  <span className={styles.verifiedIcon}>✓</span>
                  <div>
                    <h3>{t("companyProfile.companyVerified")}</h3>
                    <p>
                      {t("companyProfile.verifiedOn")}{" "}
                      {new Date(profile.verifiedAt).toLocaleDateString()}
                    </p>
                    <p className={styles.badgeInfo}>
                      {t("companyProfile.verifiedBadgeInfo")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
}

export default CompanyProfilePage;
